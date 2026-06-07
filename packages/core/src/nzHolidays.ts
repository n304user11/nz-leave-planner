import { dateInYear, nthWeekdayOfMonth } from './dates'
import { easterMonday, goodFriday } from './easter'
import { getMatarikiDate } from './matariki'
import { isMondayisable, mondayise } from './mondayisation'
import type { HolidayId, PublicHoliday, YearHolidaysResult } from './types'

type RawHoliday = { id: HolidayId; name: string; actualDate: string }

function buildRawHolidays(year: number): { raw: RawHoliday[]; warnings: string[] } {
  const warnings: string[] = []
  const raw: RawHoliday[] = [
    { id: 'new-years-day', name: "New Year's Day", actualDate: dateInYear(year, 1, 1) },
    {
      id: 'day-after-new-years',
      name: "Day after New Year's Day",
      actualDate: dateInYear(year, 1, 2),
    },
    { id: 'waitangi-day', name: 'Waitangi Day', actualDate: dateInYear(year, 2, 6) },
    { id: 'good-friday', name: 'Good Friday', actualDate: goodFriday(year) },
    { id: 'easter-monday', name: 'Easter Monday', actualDate: easterMonday(year) },
    { id: 'anzac-day', name: 'ANZAC Day', actualDate: dateInYear(year, 4, 25) },
    {
      id: 'kings-birthday',
      name: "King's Birthday",
      actualDate: nthWeekdayOfMonth(year, 6, 1, 1),
    },
    { id: 'labour-day', name: 'Labour Day', actualDate: nthWeekdayOfMonth(year, 10, 4, 1) },
    { id: 'christmas-day', name: 'Christmas Day', actualDate: dateInYear(year, 12, 25) },
    { id: 'boxing-day', name: 'Boxing Day', actualDate: dateInYear(year, 12, 26) },
  ]

  const matariki = getMatarikiDate(year)
  if (matariki) {
    raw.splice(7, 0, { id: 'matariki', name: 'Matariki', actualDate: matariki })
  } else {
    warnings.push('matariki_unavailable')
  }

  return { raw, warnings }
}

export function getNzHolidaysForYear(year: number): YearHolidaysResult {
  const { raw, warnings } = buildRawHolidays(year)
  const occupiedObserved = new Set<string>()

  const mondayisable = raw
    .filter((h) => isMondayisable(h.id))
    .sort((a, b) => a.actualDate.localeCompare(b.actualDate))

  const observedById = new Map<HolidayId, string>()
  for (const h of mondayisable) {
    observedById.set(h.id, mondayise(h.actualDate, occupiedObserved))
  }

  const holidays: PublicHoliday[] = raw.map((h) => ({
    id: h.id,
    name: h.name,
    actualDate: h.actualDate,
    observedDate: isMondayisable(h.id)
      ? observedById.get(h.id)!
      : h.actualDate,
  }))

  holidays.sort((a, b) => a.observedDate.localeCompare(b.observedDate))

  return { year, holidays, warnings }
}

export function getObservedHolidaySet(years: number[]): Set<string> {
  const set = new Set<string>()
  for (const year of years) {
    for (const h of getNzHolidaysForYear(year).holidays) {
      set.add(h.observedDate)
    }
  }
  return set
}

export function getHolidaysForYears(years: number[]): PublicHoliday[] {
  return years.flatMap((y) => getNzHolidaysForYear(y).holidays)
}
