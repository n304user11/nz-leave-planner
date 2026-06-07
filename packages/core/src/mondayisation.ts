import { addDays, getWeekday } from './dates'
import type { HolidayId } from './types'

export const MONDAYISABLE_IDS: ReadonlySet<HolidayId> = new Set([
  'new-years-day',
  'day-after-new-years',
  'waitangi-day',
  'anzac-day',
  'christmas-day',
  'boxing-day',
])

export function mondayise(
  actualDate: string,
  occupiedObserved: Set<string>,
): string {
  const dow = getWeekday(actualDate)
  if (dow >= 1 && dow <= 5) {
    occupiedObserved.add(actualDate)
    return actualDate
  }

  let candidate =
    dow === 6 ? addDays(actualDate, 2) : addDays(actualDate, 1)

  while (occupiedObserved.has(candidate)) {
    candidate = addDays(candidate, 1)
  }

  occupiedObserved.add(candidate)
  return candidate
}

export function isMondayisable(id: HolidayId): boolean {
  return MONDAYISABLE_IDS.has(id)
}
