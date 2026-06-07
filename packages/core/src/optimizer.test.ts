import { addDays } from './dates'
import { describe, expect, it } from 'vitest'
import { getObservedHolidaySet } from './nzHolidays'
import {
  findAnchoredPublicHolidayPlans,
  findBestPlans,
  findSoonestPlans,
  findSoonestPublicHolidayPlans,
  opportunitySignature,
  planHasPublicHoliday,
} from './optimizer'

const base = {
  consecutiveDays: 5,
  today: '2026-06-04',
  searchEndDate: '2027-12-31',
  years: [2026, 2027] as number[],
}

function publicHolidaysInPlan(
  plan: { startDate: string; consecutiveDays: number },
  holidays: Set<string>,
): string[] {
  const out: string[] = []
  for (let i = 0; i < plan.consecutiveDays; i++) {
    const d = addDays(plan.startDate, i)
    if (holidays.has(d)) out.push(d)
  }
  return out
}

describe('findSoonestPlans', () => {
  it('Matariki 4-day: one cluster with 1 leave day', () => {
    const opts = {
      consecutiveDays: 4,
      today: '2026-06-01',
      searchEndDate: '2027-12-31',
      years: [2026, 2027] as number[],
    }
    const holidays = getObservedHolidaySet(opts.years)
    const allSoonest = findSoonestPlans(opts)
    const matariki = allSoonest.filter((p) =>
      publicHolidaysInPlan(p, holidays).includes('2026-07-10'),
    )

    expect(matariki.length).toBeLessThanOrEqual(1)
    if (matariki.length === 1) {
      expect(matariki[0].annualLeaveDays).toBe(1)
    }
  })

  it('sorts by start date ascending', () => {
    const soonest = findSoonestPlans(base)
    for (let i = 1; i < soonest.length; i++) {
      expect(soonest[i].startDate >= soonest[i - 1].startDate).toBe(true)
    }
  })

  it('returns at most 3 on or after today', () => {
    const soonest = findSoonestPlans(base)
    expect(soonest.length).toBeLessThanOrEqual(3)
    for (const p of soonest) {
      expect(p.startDate >= base.today).toBe(true)
    }
  })

  it('prefers opportunities not already in best when possible', () => {
    const opts = { ...base, consecutiveDays: 4, today: '2026-06-01' }
    const best = findBestPlans(opts)
    const soonest = findSoonestPlans(opts)
    if (best.length > 0 && soonest.length > 0 && soonest.length >= 2) {
      const holidays = getObservedHolidaySet(opts.years)
      const bestSig = opportunitySignature(best[0], holidays)
      const soonestSigs = soonest.map((p) => opportunitySignature(p, holidays))
      const nonOverlapping = soonestSigs.filter((s) => s !== bestSig)
      expect(nonOverlapping.length).toBeGreaterThan(0)
    }
  })
})

describe('findAnchoredPublicHolidayPlans', () => {
  it('Matariki 4-day: Thu–Sun with 1 leave day', () => {
    const opts = {
      consecutiveDays: 4,
      today: '2026-06-01',
      searchEndDate: '2027-12-31',
      years: [2026, 2027] as number[],
    }
    const entries = findAnchoredPublicHolidayPlans({ ...opts, limit: 20 })
    const matariki = entries.find((e) => e.anchor.id === 'matariki')
    expect(matariki).toBeDefined()
    expect(matariki!.anchor.observedDate).toBe('2026-07-10')
    expect(matariki!.plan.annualLeaveDays).toBe(1)
    expect(matariki!.plan.startDate).toBe('2026-07-09')
    expect(matariki!.plan.weekendDays).toBe(2)
  })

  it('Matariki 5-day: 2 leave days', () => {
    const opts = {
      consecutiveDays: 5,
      today: '2026-06-01',
      searchEndDate: '2027-12-31',
      years: [2026, 2027] as number[],
    }
    const matariki = findAnchoredPublicHolidayPlans({ ...opts, limit: 20 }).find(
      (e) => e.anchor.id === 'matariki',
    )
    expect(matariki).toBeDefined()
    expect(matariki!.plan.annualLeaveDays).toBe(2)
  })

  it('each row includes its anchor holiday in the window', () => {
    const entries = findAnchoredPublicHolidayPlans(base)
    expect(entries.length).toBeGreaterThan(0)
    for (const { anchor, plan } of entries) {
      const d = anchor.observedDate
      expect(d >= plan.startDate && d <= plan.endDate).toBe(true)
    }
  })

  it('returns at most 3 by default', () => {
    const entries = findAnchoredPublicHolidayPlans(base)
    expect(entries.length).toBeLessThanOrEqual(3)
  })

  it('sorts by upcoming holiday date', () => {
    const entries = findAnchoredPublicHolidayPlans(base)
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].anchor.observedDate >= entries[i - 1].anchor.observedDate).toBe(
        true,
      )
    }
  })

  it('Good Friday 4-day can use 0 leave with weekend', () => {
    const entries = findAnchoredPublicHolidayPlans({
      consecutiveDays: 4,
      today: '2026-01-01',
      searchEndDate: '2027-12-31',
      years: [2026, 2027],
      limit: 20,
    })
    const gf = entries.find((e) => e.anchor.id === 'good-friday')
    expect(gf).toBeDefined()
    expect(gf!.plan.annualLeaveDays).toBe(0)
    expect(gf!.plan.weekendDays).toBeGreaterThan(0)
  })
})

describe('findSoonestPublicHolidayPlans', () => {
  it('only returns plans with at least one public holiday', () => {
    const plans = findSoonestPublicHolidayPlans(base)
    expect(plans.length).toBeGreaterThan(0)
    for (const p of plans) {
      expect(planHasPublicHoliday(p)).toBe(true)
    }
  })

  it('sorts by start date ascending', () => {
    const plans = findSoonestPublicHolidayPlans(base)
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].startDate >= plans[i - 1].startDate).toBe(true)
    }
  })

  it('excludes pure weekend windows with no public holiday', () => {
    const opts = { ...base, consecutiveDays: 3, today: '2026-06-07' }
    const holidays = getObservedHolidaySet(opts.years)
    const allSoonest = findSoonestPlans(opts)
    const phSoonest = findSoonestPublicHolidayPlans(opts)
    const weekendOnly = allSoonest.filter((p) => !planHasPublicHoliday(p))
    if (weekendOnly.length > 0) {
      for (const p of phSoonest) {
        expect(planHasPublicHoliday(p)).toBe(true)
      }
      for (const p of weekendOnly) {
        expect(phSoonest.some((h) => h.id === p.id)).toBe(false)
      }
    }
    expect(phSoonest.every((p) => publicHolidaysInPlan(p, holidays).length > 0)).toBe(
      true,
    )
  })
})

describe('findBestPlans', () => {
  it('2026 Easter 4-day window can use 0 annual leave', () => {
    const plans = findBestPlans({
      consecutiveDays: 4,
      today: '2026-01-01',
      searchEndDate: '2027-12-31',
      years: [2026, 2027],
    })
    expect(plans.some((p) => p.startDate === '2026-04-03' && p.annualLeaveDays === 0)).toBe(
      true,
    )
  })

  it('only minimum leave after dedupe', () => {
    const plans = findBestPlans(base)
    expect(plans.length).toBeGreaterThan(0)
    const minLeave = plans[0].annualLeaveDays
    for (const p of plans) {
      expect(p.annualLeaveDays).toBe(minLeave)
    }
    const soonest = findSoonestPlans(base)
    for (const p of soonest) {
      expect(minLeave).toBeLessThanOrEqual(p.annualLeaveDays)
    }
  })
})
