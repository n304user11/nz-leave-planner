import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_CONSECUTIVE_DAYS,
  MAX_CONSECUTIVE_DAYS,
  MIN_CONSECUTIVE_DAYS,
  addDays,
  breakDaysUntil,
  findAnchoredPublicHolidayPlans,
  findBestPlans,
  findSoonestPlans,
  getNextBreakPeriod,
  getNextPublicHoliday,
  getPlanningYears,
  getToday,
  publicHolidayDaysUntil,
  getNzHolidaysForYear,
} from '@nz-leave/core'
import type { LeavePlan } from '@nz-leave/core'
import { loadProfile, saveProfile } from '../lib/storage'

function clampDays(n: number): number {
  return Math.min(MAX_CONSECUTIVE_DAYS, Math.max(MIN_CONSECUTIVE_DAYS, n))
}

export function useLeavePlanner() {
  const today = getToday()
  const [years] = useState(() => getPlanningYears(today))
  const saved = loadProfile()

  const [consecutiveDays, setConsecutiveDays] = useState(
    clampDays(saved?.consecutiveDays ?? DEFAULT_CONSECUTIVE_DAYS),
  )
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    saved?.selectedPlanId ?? null,
  )

  const searchEndDate = `${years[1]}-12-31`

  const planOptions = useMemo(
    () => ({
      consecutiveDays,
      today,
      searchEndDate,
      years,
      extraOffDays: [] as string[],
    }),
    [consecutiveDays, today, searchEndDate, years],
  )

  const bestPlans = useMemo(
    () => findBestPlans({ ...planOptions, limit: 3 }),
    [planOptions],
  )

  const soonestPlans = useMemo(() => findSoonestPlans(planOptions), [planOptions])

  const anchoredPublicHolidayPlans = useMemo(
    () => findAnchoredPublicHolidayPlans(planOptions),
    [planOptions],
  )

  const selectedPlan = useMemo(() => {
    const candidates = [
      ...soonestPlans,
      ...anchoredPublicHolidayPlans.map((e) => e.plan),
      ...bestPlans,
    ]
    if (candidates.length === 0) return null
    const match = candidates.find((p) => p.id === selectedPlanId)
    if (match) return match
    return (
      soonestPlans[0] ??
      anchoredPublicHolidayPlans[0]?.plan ??
      bestPlans[0] ??
      null
    )
  }, [bestPlans, soonestPlans, anchoredPublicHolidayPlans, selectedPlanId])

  const persist = useCallback((days: number, planId: string | null) => {
    saveProfile({
      consecutiveDays: days,
      selectedPlanId: planId,
      customOffDays: [],
    })
  }, [])

  const handleDaysChange = (value: number) => {
    const next = clampDays(value)
    setConsecutiveDays(next)
    setSelectedPlanId(null)
    persist(next, null)
  }

  const handleSelectPlan = (plan: LeavePlan) => {
    setSelectedPlanId(plan.id)
    persist(consecutiveDays, plan.id)
  }

  const holidayResults = useMemo(
    () => years.map((y) => getNzHolidaysForYear(y)),
    [years],
  )

  const nextBreak = useMemo(() => getNextBreakPeriod(today, years), [today, years])

  const nextPublicHoliday = useMemo(
    () => getNextPublicHoliday(today, years),
    [today, years],
  )

  const publicHolidayCountdownDays = nextPublicHoliday
    ? publicHolidayDaysUntil(today, nextPublicHoliday)
    : null

  const breakCountdownDays = nextBreak ? breakDaysUntil(today, nextBreak) : null

  return {
    today,
    years,
    consecutiveDays,
    bestPlans,
    soonestPlans,
    anchoredPublicHolidayPlans,
    selectedPlan,
    holidayResults,
    nextBreak,
    breakCountdownDays,
    nextPublicHoliday,
    publicHolidayCountdownDays,
    handleDaysChange,
    handleSelectPlan,
    minDays: MIN_CONSECUTIVE_DAYS,
    maxDays: MAX_CONSECUTIVE_DAYS,
  }
}

export { addDays, getToday }
