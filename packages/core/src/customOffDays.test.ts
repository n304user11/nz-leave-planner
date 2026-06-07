import { describe, expect, it } from 'vitest'
import { getNextBreakPeriod } from './countdown'
import { findBestPlans } from './optimizer'
import {
  customOffDayDates,
  expandMonthDayToYears,
  mergeCustomOffDaysIntoYearResults,
  migrateUserProfile,
} from './customOffDays'
import { getNzHolidaysForYear } from './nzHolidays'

describe('migrateUserProfile', () => {
  it('migrates legacy extraOffDays to customOffDays', () => {
    const profile = migrateUserProfile({
      consecutiveDays: 5,
      selectedPlanId: null,
      extraOffDays: ['2026-01-27'],
    })
    expect(profile.customOffDays).toHaveLength(1)
    expect(profile.customOffDays[0].observedDate).toBe('2026-01-27')
    expect(profile.customOffDays[0].kind).toBe('other')
  })
})

describe('mergeCustomOffDaysIntoYearResults', () => {
  it('merges custom days into the correct year sorted by date', () => {
    const national = [getNzHolidaysForYear(2026)]
    const merged = mergeCustomOffDaysIntoYearResults(national, [
      {
        id: 'a1',
        name: 'Auckland Anniversary',
        observedDate: '2026-01-27',
        kind: 'anniversary',
      },
    ])
    expect(merged[0].customCount).toBe(1)
    expect(merged[0].nationalCount).toBe(11)
    const custom = merged[0].holidays.find((h) => h.source === 'custom')
    expect(custom?.name).toBe('Auckland Anniversary')
    const dates = merged[0].holidays.map((h) => h.observedDate)
    expect([...dates].sort()).toEqual(dates)
  })
})

describe('expandMonthDayToYears', () => {
  it('creates one entry per planning year', () => {
    const days = expandMonthDayToYears('03-15', [2026, 2027], 'birthday')
    expect(days).toHaveLength(2)
    expect(days[0].name).toBe('Birthday')
    expect(days[0].observedDate).toBe('2026-03-15')
    expect(days[1].observedDate).toBe('2027-03-15')
  })
})

describe('optimizer with custom off days', () => {
  it('reduces annual leave when a weekday is custom off', () => {
    const base = {
      consecutiveDays: 4,
      today: '2026-06-01',
      searchEndDate: '2027-12-31',
      years: [2026, 2027] as number[],
      limit: 20,
    }
    const without = findBestPlans(base)
    const withCustom = findBestPlans({
      ...base,
      extraOffDays: customOffDayDates([
        {
          id: 'x',
          name: 'Extra',
          observedDate: '2026-07-09',
          kind: 'anniversary',
        },
      ]),
    })
    const minWithout = Math.min(...without.map((p) => p.annualLeaveDays))
    const minWith = Math.min(...withCustom.map((p) => p.annualLeaveDays))
    expect(minWith).toBeLessThanOrEqual(minWithout)
  })
})

describe('getNextBreakPeriod with custom off', () => {
  it('treats custom weekday as part of a break', () => {
    const period = getNextBreakPeriod('2026-01-26', [2026], [
      {
        id: 'a1',
        name: 'Auckland Anniversary',
        observedDate: '2026-01-27',
        kind: 'anniversary',
      },
    ])
    expect(period).not.toBeNull()
    expect(period!.holidayNames).toContain('Auckland Anniversary')
  })
})
