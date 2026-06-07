import {
  addDays,
  compareDates,
  daysUntil,
  getWeekday,
  isWeekday,
  maxDate,
  minDate,
} from './dates'
import { getHolidaysForYears, getObservedHolidaySet } from './nzHolidays'
import type { HolidayAnchoredPlan, LeavePlan, PublicHoliday } from './types'

export const MIN_CONSECUTIVE_DAYS = 3
export const MAX_CONSECUTIVE_DAYS = 30
export const DEFAULT_CONSECUTIVE_DAYS = 5
export const TOP_PLAN_LIMIT = 3

function annualLeaveForWindow(
  startDate: string,
  consecutiveDays: number,
  holidays: Set<string>,
  extraOffDays: Set<string>,
): number {
  let leave = 0
  for (let i = 0; i < consecutiveDays; i++) {
    const d = addDays(startDate, i)
    if (isWeekday(d) && !holidays.has(d) && !extraOffDays.has(d)) {
      leave++
    }
  }
  return leave
}

function countDaysInWindow(
  startDate: string,
  consecutiveDays: number,
  predicate: (d: string) => boolean,
): number {
  let count = 0
  for (let i = 0; i < consecutiveDays; i++) {
    if (predicate(addDays(startDate, i))) count++
  }
  return count
}

function buildPlan(
  startDate: string,
  consecutiveDays: number,
  holidays: Set<string>,
  extraOffDays: Set<string>,
): LeavePlan {
  const endDate = addDays(startDate, consecutiveDays - 1)
  const annualLeaveDays = annualLeaveForWindow(
    startDate,
    consecutiveDays,
    holidays,
    extraOffDays,
  )
  const weekendDays = countDaysInWindow(startDate, consecutiveDays, (d) => !isWeekday(d))
  const publicHolidayDays = countDaysInWindow(
    startDate,
    consecutiveDays,
    (d) => holidays.has(d),
  )
  const customOffDayCount = countDaysInWindow(
    startDate,
    consecutiveDays,
    (d) => extraOffDays.has(d),
  )

  return {
    id: `${startDate}_${consecutiveDays}`,
    startDate,
    endDate,
    consecutiveDays,
    annualLeaveDays,
    weekendDays,
    publicHolidayDays,
    customOffDays: customOffDayCount,
  }
}

export type FindPlansOptions = {
  consecutiveDays: number
  today: string
  searchEndDate: string
  years: number[]
  extraOffDays?: string[]
  limit?: number
}

function enumeratePlans(options: FindPlansOptions): LeavePlan[] {
  const { consecutiveDays, today, searchEndDate, years, extraOffDays = [] } =
    options

  const holidays = getObservedHolidaySet(years)
  const extraSet = new Set(extraOffDays)
  const searchStart = maxDate(today, `${years[0]}-01-01`)
  const lastStart = addDays(searchEndDate, -(consecutiveDays - 1))

  if (compareDates(searchStart, lastStart) > 0) {
    return []
  }

  const plans: LeavePlan[] = []
  for (let start = searchStart; compareDates(start, lastStart) <= 0; start = addDays(start, 1)) {
    plans.push(buildPlan(start, consecutiveDays, holidays, extraSet))
  }

  return plans
}

function publicHolidaysInWindow(plan: LeavePlan, holidays: Set<string>): string[] {
  const dates: string[] = []
  for (let i = 0; i < plan.consecutiveDays; i++) {
    const d = addDays(plan.startDate, i)
    if (holidays.has(d)) dates.push(d)
  }
  return dates.sort()
}

/** Same holiday weekend cluster — sliding start ±1 day counts as one opportunity. */
export function opportunitySignature(plan: LeavePlan, holidays: Set<string>): string {
  const ph = publicHolidaysInWindow(plan, holidays)
  if (ph.length > 0) return `ph:${ph.join('|')}`

  const saturdays: string[] = []
  for (let i = 0; i < plan.consecutiveDays; i++) {
    const d = addDays(plan.startDate, i)
    if (getWeekday(d) === 6) saturdays.push(d)
  }
  return `we:${saturdays.sort().join('|')}`
}

function comparePlanQuality(a: LeavePlan, b: LeavePlan): number {
  if (a.annualLeaveDays !== b.annualLeaveDays) {
    return a.annualLeaveDays - b.annualLeaveDays
  }
  if (a.publicHolidayDays !== b.publicHolidayDays) {
    return b.publicHolidayDays - a.publicHolidayDays
  }
  return compareDates(a.startDate, b.startDate)
}

function pickBetterPlan(a: LeavePlan, b: LeavePlan): LeavePlan {
  return comparePlanQuality(a, b) <= 0 ? a : b
}

function pickSoonestInCluster(a: LeavePlan, b: LeavePlan): LeavePlan {
  const byStart = compareDates(a.startDate, b.startDate)
  if (byStart !== 0) return byStart <= 0 ? a : b
  return pickBetterPlan(a, b)
}

export function dedupeByOpportunity(
  plans: LeavePlan[],
  holidays: Set<string>,
  strategy: 'quality' | 'soonest' = 'quality',
): LeavePlan[] {
  const pick = strategy === 'soonest' ? pickSoonestInCluster : pickBetterPlan
  const bySig = new Map<string, LeavePlan>()
  for (const plan of plans) {
    const sig = opportunitySignature(plan, holidays)
    const existing = bySig.get(sig)
    bySig.set(sig, existing ? pick(existing, plan) : plan)
  }
  return [...bySig.values()]
}

function upcomingPlans(options: FindPlansOptions): LeavePlan[] {
  const { today } = options
  return enumeratePlans(options).filter(
    (p) => compareDates(p.startDate, today) >= 0,
  )
}

/** At least one observed national public holiday (weekday) in the window. */
export function planHasPublicHoliday(plan: LeavePlan): boolean {
  return plan.publicHolidayDays > 0
}

function sortPlansByStartThenQuality(plans: LeavePlan[]): LeavePlan[] {
  return [...plans].sort((a, b) => {
    const d = compareDates(a.startDate, b.startDate)
    return d !== 0 ? d : comparePlanQuality(a, b)
  })
}

/** Soonest distinct breaks that include at least one public holiday. */
export function findSoonestPublicHolidayPlans(options: FindPlansOptions): LeavePlan[] {
  const { years, limit = TOP_PLAN_LIMIT } = options
  const holidays = getObservedHolidaySet(years)
  const withHoliday = upcomingPlans(options).filter(planHasPublicHoliday)
  const deduped = dedupeByOpportunity(withHoliday, holidays, 'soonest')
  return sortPlansByStartThenQuality(deduped).slice(0, limit)
}

function planCoversDate(plan: LeavePlan, date: string): boolean {
  return compareDates(plan.startDate, date) <= 0 && compareDates(date, plan.endDate) <= 0
}

/** Best N-day window that includes `holiday.observedDate` (weekends count). */
function bestPlanForHoliday(
  holiday: PublicHoliday,
  options: FindPlansOptions,
  holidays: Set<string>,
  extraSet: Set<string>,
): LeavePlan | null {
  const { consecutiveDays, today, searchEndDate, years } = options
  const observed = holiday.observedDate

  if (compareDates(observed, today) < 0) return null

  const lastStart = addDays(searchEndDate, -(consecutiveDays - 1))
  const windowEarliestStart = addDays(observed, -(consecutiveDays - 1))
  const searchStart = maxDate(maxDate(today, windowEarliestStart), `${years[0]}-01-01`)
  const searchLatest = minDate(observed, lastStart)

  if (compareDates(searchStart, searchLatest) > 0) return null

  let best: LeavePlan | null = null
  for (
    let start = searchStart;
    compareDates(start, searchLatest) <= 0;
    start = addDays(start, 1)
  ) {
    const plan = buildPlan(start, consecutiveDays, holidays, extraSet)
    if (!planCoversDate(plan, observed)) continue
    if (!best || comparePlanQuality(plan, best) < 0) {
      best = plan
    }
  }

  return best
}

/**
 * For each upcoming public holiday, the best way to take N consecutive days off
 * that includes that holiday — bridging with weekends where it saves leave.
 */
export function findAnchoredPublicHolidayPlans(
  options: FindPlansOptions,
): HolidayAnchoredPlan[] {
  const { years, today, limit = TOP_PLAN_LIMIT, extraOffDays = [] } = options
  const holidays = getObservedHolidaySet(years)
  const extraSet = new Set(extraOffDays)

  const upcomingHolidays = getHolidaysForYears(years)
    .filter((h) => compareDates(h.observedDate, today) >= 0)
    .sort((a, b) => a.observedDate.localeCompare(b.observedDate))

  const results: HolidayAnchoredPlan[] = []
  for (const anchor of upcomingHolidays) {
    const plan = bestPlanForHoliday(anchor, options, holidays, extraSet)
    if (!plan) continue
    results.push({ anchor, plan })
    if (results.length >= limit) break
  }

  return results
}

/** @deprecated Use findAnchoredPublicHolidayPlans */
export function findBestPublicHolidayPlans(options: FindPlansOptions): LeavePlan[] {
  return findAnchoredPublicHolidayPlans(options).map((entry) => entry.plan)
}

/** Soonest distinct breaks by start date (deduped; prefers earliest start per holiday cluster). */
export function findSoonestPlans(options: FindPlansOptions): LeavePlan[] {
  const { years, limit = TOP_PLAN_LIMIT } = options
  const holidays = getObservedHolidaySet(years)
  const deduped = dedupeByOpportunity(upcomingPlans(options), holidays, 'soonest')

  const bestSigs = new Set(
    findBestPlans({ ...options, limit: TOP_PLAN_LIMIT * 10 }).map((p) =>
      opportunitySignature(p, holidays),
    ),
  )

  const byStart = sortPlansByStartThenQuality(deduped)

  const result: LeavePlan[] = []
  for (const plan of byStart) {
    if (result.length >= limit) break
    if (bestSigs.has(opportunitySignature(plan, holidays))) continue
    result.push(plan)
  }

  if (result.length < limit) {
    for (const plan of byStart) {
      if (result.length >= limit) break
      if (result.some((r) => r.id === plan.id)) continue
      result.push(plan)
    }
  }

  return result.slice(0, limit)
}

/** @deprecated Use findSoonestPlans */
export function findSuggestedPlans(options: FindPlansOptions): LeavePlan[] {
  return findSoonestPlans(options)
}

/** Minimum-leave opportunities (deduped), up to `limit`. */
export function findBestPlans(options: FindPlansOptions): LeavePlan[] {
  const { years, limit = TOP_PLAN_LIMIT } = options
  const holidays = getObservedHolidaySet(years)
  const deduped = dedupeByOpportunity(upcomingPlans(options), holidays, 'quality')

  if (deduped.length === 0) return []

  const minLeave = Math.min(...deduped.map((p) => p.annualLeaveDays))
  return deduped
    .filter((p) => p.annualLeaveDays === minLeave)
    .sort((a, b) => compareDates(a.startDate, b.startDate))
    .slice(0, limit)
}

/** @deprecated Use findSuggestedPlans */
export const NEAREST_PLAN_LIMIT = TOP_PLAN_LIMIT

export function findNearestPlans(options: FindPlansOptions): LeavePlan[] {
  return findSoonestPlans(options)
}

export function findNearestPlan(options: FindPlansOptions): LeavePlan | null {
  return findSoonestPlans(options)[0] ?? null
}

export function findNextPlanFrom(
  options: FindPlansOptions & { afterDate: string },
): LeavePlan | null {
  const plans = findBestPlans(options)
  return plans.find((p) => compareDates(p.startDate, options.afterDate) >= 0) ?? null
}

export { daysUntil }
