import { dateInYear } from './dates'
import type {
  CustomOffDay,
  CustomOffDayKind,
  DisplayHoliday,
  MergedYearHolidaysResult,
  UserProfile,
  YearHolidaysResult,
} from './types'

const KIND_LABELS: Record<CustomOffDayKind, string> = {
  anniversary: 'Anniversary',
  birthday: 'Birthday',
  other: 'Custom day off',
}

export function defaultCustomOffDayName(kind: CustomOffDayKind): string {
  return KIND_LABELS[kind]
}

export function customOffDayDates(days: CustomOffDay[]): string[] {
  return days.map((d) => d.observedDate)
}

export function migrateUserProfile(data: Partial<UserProfile>): UserProfile {
  if (data.customOffDays && data.customOffDays.length > 0) {
    return {
      consecutiveDays: data.consecutiveDays ?? 5,
      selectedPlanId: data.selectedPlanId ?? null,
      customOffDays: data.customOffDays,
    }
  }

  const legacy = data.extraOffDays ?? []
  const customOffDays: CustomOffDay[] = legacy.map((date, i) => ({
    id: `legacy-${date}-${i}`,
    name: 'Custom day off',
    observedDate: date,
    kind: 'other' as CustomOffDayKind,
  }))

  return {
    consecutiveDays: data.consecutiveDays ?? 5,
    selectedPlanId: data.selectedPlanId ?? null,
    customOffDays,
  }
}

export function expandMonthDayToYears(
  monthDay: string,
  years: number[],
  kind: CustomOffDayKind = 'birthday',
  name?: string,
): CustomOffDay[] {
  const [month, day] = monthDay.split('-').map(Number)
  const label = name ?? defaultCustomOffDayName(kind)
  return years.map((year) => ({
    id: `${kind}-${year}-${monthDay}`,
    name: label,
    observedDate: dateInYear(year, month, day),
    kind,
  }))
}

export function mergeCustomOffDaysIntoYearResults(
  nationalResults: YearHolidaysResult[],
  customOffDays: CustomOffDay[],
): MergedYearHolidaysResult[] {
  const customByYear = new Map<number, DisplayHoliday[]>()
  for (const c of customOffDays) {
    const year = parseInt(c.observedDate.slice(0, 4), 10)
    const row: DisplayHoliday = {
      source: 'custom',
      id: c.id,
      name: c.name,
      actualDate: c.observedDate,
      observedDate: c.observedDate,
      kind: c.kind,
    }
    const list = customByYear.get(year) ?? []
    list.push(row)
    customByYear.set(year, list)
  }

  return nationalResults.map((result) => {
    const nationalRows: DisplayHoliday[] = result.holidays.map((h) => ({
      source: 'national' as const,
      id: h.id,
      name: h.name,
      actualDate: h.actualDate,
      observedDate: h.observedDate,
    }))
    const customRows = customByYear.get(result.year) ?? []
    const holidays = [...nationalRows, ...customRows].sort((a, b) =>
      a.observedDate.localeCompare(b.observedDate),
    )

    return {
      year: result.year,
      holidays,
      nationalCount: nationalRows.length,
      customCount: customRows.length,
      warnings: result.warnings,
    }
  })
}

export function createCustomOffDayId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
