import { addDays, compareDates, daysUntil, isWeekend, minDate } from './dates'
import { getHolidaysForYears } from './nzHolidays'
import type { BreakPeriod, CustomOffDay, PublicHoliday, VacationCountdown } from './types'
import type { LeavePlan } from './types'

function isOffDay(date: string, offDates: Set<string>): boolean {
  return isWeekend(date) || offDates.has(date)
}

function maxDateStr(a: string, b: string): string {
  return a >= b ? a : b
}

export function getNextBreakPeriod(
  today: string,
  years: number[],
  customOffDays: CustomOffDay[] = [],
): BreakPeriod | null {
  const holidays = getHolidaysForYears(years)
  const observedSet = new Set([
    ...holidays.map((h) => h.observedDate),
    ...customOffDays.map((c) => c.observedDate),
  ])
  const searchEnd = addDays(today, 400)

  let d = today
  while (compareDates(d, searchEnd) <= 0 && !isOffDay(d, observedSet)) {
    d = addDays(d, 1)
  }
  if (compareDates(d, searchEnd) > 0) return null

  const blockStart = d
  let blockEnd = d
  while (
    compareDates(addDays(blockEnd, 1), searchEnd) <= 0 &&
    isOffDay(addDays(blockEnd, 1), observedSet)
  ) {
    blockEnd = addDays(blockEnd, 1)
  }

  const names = collectBreakNames(holidays, customOffDays, blockStart, blockEnd)

  return {
    startDate: blockStart,
    endDate: blockEnd,
    dayCount: daysUntil(blockStart, blockEnd) + 1,
    holidayNames: names,
  }
}

function collectBreakNames(
  holidays: PublicHoliday[],
  customOffDays: CustomOffDay[],
  blockStart: string,
  blockEnd: string,
): string[] {
  const names = new Set<string>()
  for (const h of holidays) {
    const spanStart = minDate(h.actualDate, h.observedDate)
    const spanEnd = maxDateStr(h.actualDate, h.observedDate)
    if (compareDates(spanEnd, blockStart) >= 0 && compareDates(spanStart, blockEnd) <= 0) {
      names.add(h.name)
    }
  }
  for (const c of customOffDays) {
    if (
      compareDates(c.observedDate, blockStart) >= 0 &&
      compareDates(c.observedDate, blockEnd) <= 0
    ) {
      names.add(c.name)
    }
  }
  return [...names]
}

export function breakDaysUntil(today: string, breakPeriod: BreakPeriod): number {
  if (
    compareDates(today, breakPeriod.startDate) >= 0 &&
    compareDates(today, breakPeriod.endDate) <= 0
  ) {
    return 0
  }
  return daysUntil(today, breakPeriod.startDate)
}

export function getNextPublicHoliday(
  today: string,
  years: number[],
): PublicHoliday | null {
  const upcoming = getHolidaysForYears(years)
    .filter((h) => compareDates(h.observedDate, today) >= 0)
    .sort((a, b) => a.observedDate.localeCompare(b.observedDate))
  return upcoming[0] ?? null
}

export function publicHolidayDaysUntil(today: string, holiday: PublicHoliday): number {
  return daysUntil(today, holiday.observedDate)
}

export function getVacationCountdown(
  today: string,
  plan: LeavePlan | null,
): VacationCountdown {
  if (!plan) {
    return { status: 'none', message: 'No suitable leave window found in this period.' }
  }

  if (compareDates(today, plan.startDate) < 0) {
    return { status: 'upcoming', daysUntil: daysUntil(today, plan.startDate), plan }
  }

  if (today === plan.startDate) {
    return { status: 'starts-today', plan }
  }

  if (
    compareDates(today, plan.startDate) > 0 &&
    compareDates(today, plan.endDate) <= 0
  ) {
    return {
      status: 'in-progress',
      daysRemaining: daysUntil(today, plan.endDate),
      plan,
    }
  }

  return { status: 'none', message: 'Selected plan has ended. Pick another option.' }
}

export function getPlanningYears(today: string): [number, number] {
  const year = parseInt(today.slice(0, 4), 10)
  return [year, year + 1]
}
