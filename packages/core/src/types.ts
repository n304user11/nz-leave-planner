export type HolidayId =
  | 'new-years-day'
  | 'day-after-new-years'
  | 'waitangi-day'
  | 'good-friday'
  | 'easter-monday'
  | 'anzac-day'
  | 'kings-birthday'
  | 'matariki'
  | 'labour-day'
  | 'christmas-day'
  | 'boxing-day'

export type PublicHoliday = {
  id: HolidayId
  name: string
  actualDate: string
  observedDate: string
}

export type CustomOffDayKind = 'anniversary' | 'birthday' | 'other'

export type CustomOffDay = {
  id: string
  name: string
  observedDate: string
  kind: CustomOffDayKind
}

export type DisplayHoliday = {
  source: 'national' | 'custom'
  id: string
  name: string
  actualDate: string
  observedDate: string
  kind?: CustomOffDayKind
}

export type MergedYearHolidaysResult = {
  year: number
  holidays: DisplayHoliday[]
  nationalCount: number
  customCount: number
  warnings: string[]
}

export type YearHolidaysResult = {
  year: number
  holidays: PublicHoliday[]
  warnings: string[]
}

export type LeavePlan = {
  id: string
  startDate: string
  endDate: string
  consecutiveDays: number
  annualLeaveDays: number
  weekendDays: number
  publicHolidayDays: number
  customOffDays: number
}

/** Best N-day break anchored on one upcoming public holiday. */
export type HolidayAnchoredPlan = {
  anchor: PublicHoliday
  plan: LeavePlan
}

export type BreakPeriod = {
  startDate: string
  endDate: string
  dayCount: number
  holidayNames: string[]
}

export type VacationCountdown =
  | { status: 'upcoming'; daysUntil: number; plan: LeavePlan }
  | { status: 'starts-today'; plan: LeavePlan }
  | { status: 'in-progress'; daysRemaining: number; plan: LeavePlan }
  | { status: 'none'; message: string }

export type UserProfile = {
  consecutiveDays: number
  selectedPlanId: string | null
  customOffDays: CustomOffDay[]
  /** @deprecated Migrated to customOffDays on load */
  extraOffDays?: string[]
}
