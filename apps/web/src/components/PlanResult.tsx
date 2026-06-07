import { useState } from 'react'
import {
  addDays,
  daysUntil,
  getObservedHolidaySet,
  isWeekday,
  weekdayLabel,
} from '@nz-leave/core'
import type { HolidayAnchoredPlan, LeavePlan } from '@nz-leave/core'

type PlanResultProps = {
  today: string
  consecutiveDays: number
  bestPlans: LeavePlan[]
  soonestPlans: LeavePlan[]
  anchoredPublicHolidayPlans: HolidayAnchoredPlan[]
  selectedPlan: LeavePlan | null
  years: number[]
  onSelectPlan: (plan: LeavePlan) => void
}

type TabId = 'soonest' | 'publicHoliday' | 'best'

type DayKind = 'weekend' | 'holiday' | 'leave'

function dayKind(date: string, holidays: Set<string>): DayKind {
  if (holidays.has(date)) return 'holiday'
  if (!isWeekday(date)) return 'weekend'
  return 'leave'
}

function PlanBar({ plan, years }: { plan: LeavePlan; years: number[] }) {
  const holidays = getObservedHolidaySet(years)
  const days: { date: string; kind: DayKind }[] = []
  for (let i = 0; i < plan.consecutiveDays; i++) {
    const date = addDays(plan.startDate, i)
    days.push({ date, kind: dayKind(date, holidays) })
  }

  return (
    <div className="plan-bar" role="list" aria-label="Leave window">
      {days.map(({ date, kind }) => (
        <div
          key={date}
          role="listitem"
          className={`plan-bar-day plan-bar-day--${kind}`}
          title={`${date} (${weekdayLabel(date)})`}
        >
          <span className="plan-bar-label">{date.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

function PlanTable({
  plans,
  selectedPlanId,
  onSelectPlan,
  showDaysUntil,
  today,
}: {
  plans: LeavePlan[]
  selectedPlanId: string | undefined
  onSelectPlan: (plan: LeavePlan) => void
  showDaysUntil?: boolean
  today?: string
}) {
  if (plans.length === 0) {
    return <p className="hint">No options in this category.</p>
  }

  return (
    <div className="plan-table-wrap">
      <table className="plan-table">
        <thead>
          <tr>
            {showDaysUntil && today && <th>In</th>}
            <th>Start</th>
            <th>End</th>
            <th>Leave</th>
            <th>Pub. hol.</th>
            <th>Wknd</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => {
            const selected = plan.id === selectedPlanId
            const daysOut =
              showDaysUntil && today ? daysUntil(today, plan.startDate) : null
            return (
              <tr
                key={plan.id}
                className={selected ? 'plan-table-row--selected' : undefined}
                onClick={() => onSelectPlan(plan)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectPlan(plan)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
              >
                {daysOut !== null && (
                  <td className="plan-table-days-until">
                    {daysOut === 0 ? 'Today' : `${daysOut}d`}
                  </td>
                )}
                <td>{plan.startDate}</td>
                <td>{plan.endDate}</td>
                <td>{plan.annualLeaveDays}</td>
                <td>{plan.publicHolidayDays}</td>
                <td>{plan.weekendDays}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AnchoredHolidayTable({
  entries,
  selectedPlanId,
  today,
  onSelectPlan,
}: {
  entries: HolidayAnchoredPlan[]
  selectedPlanId: string | undefined
  today: string
  onSelectPlan: (plan: LeavePlan) => void
}) {
  if (entries.length === 0) {
    return <p className="hint">No upcoming public holidays in the search range.</p>
  }

  return (
    <div className="plan-table-wrap">
      <table className="plan-table">
        <thead>
          <tr>
            <th>Holiday</th>
            <th>In</th>
            <th>Start</th>
            <th>End</th>
            <th>Leave</th>
            <th>Wknd</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ anchor, plan }) => {
            const selected = plan.id === selectedPlanId
            const daysToHoliday = daysUntil(today, anchor.observedDate)
            const rowKey = `${anchor.id}_${anchor.observedDate}`
            return (
              <tr
                key={rowKey}
                className={selected ? 'plan-table-row--selected' : undefined}
                onClick={() => onSelectPlan(plan)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectPlan(plan)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
              >
                <td>
                  {anchor.name}{' '}
                  <span className="plan-table-holiday-date">
                    {anchor.observedDate} ({weekdayLabel(anchor.observedDate)})
                  </span>
                </td>
                <td className="plan-table-days-until">
                  {daysToHoliday === 0 ? 'Today' : `${daysToHoliday}d`}
                </td>
                <td>{plan.startDate}</td>
                <td>{plan.endDate}</td>
                <td>{plan.annualLeaveDays}</td>
                <td>{plan.weekendDays}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PlanResult({
  today,
  consecutiveDays,
  bestPlans,
  soonestPlans,
  anchoredPublicHolidayPlans,
  selectedPlan,
  years,
  onSelectPlan,
}: PlanResultProps) {
  const [tab, setTab] = useState<TabId>('soonest')

  if (
    soonestPlans.length === 0 &&
    anchoredPublicHolidayPlans.length === 0 &&
    bestPlans.length === 0
  ) {
    return (
      <section className="plan-result">
        <h2>Your getaway options</h2>
        <p className="hint">No matching break in this range — try more days or a later start.</p>
      </section>
    )
  }

  const bestTabLabel =
    bestPlans.length > 0
      ? `Best (${bestPlans[0].annualLeaveDays} leave)`
      : 'Best'

  return (
    <section className="plan-result card-festive">
      <h2>Your getaway options</h2>

      <div className="plan-tabs" role="tablist" aria-label="Leave option type">
        {soonestPlans.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'soonest'}
            className={`plan-tab${tab === 'soonest' ? ' plan-tab--active' : ''}`}
            onClick={() => setTab('soonest')}
          >
            Soonest
          </button>
        )}
        {anchoredPublicHolidayPlans.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'publicHoliday'}
            className={`plan-tab${tab === 'publicHoliday' ? ' plan-tab--active' : ''}`}
            onClick={() => setTab('publicHoliday')}
          >
            Public holiday
          </button>
        )}
        {bestPlans.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'best'}
            className={`plan-tab${tab === 'best' ? ' plan-tab--active' : ''}`}
            onClick={() => setTab('best')}
          >
            {bestTabLabel}
          </button>
        )}
      </div>

      <p className="hint plan-tab-hint">
        {tab === 'soonest'
          ? 'The next three chances to switch off — soonest first.'
          : tab === 'publicHoliday'
            ? `Best ${consecutiveDays}-day stretch around each upcoming holiday (weekends count!).`
            : `Top picks using the fewest annual leave days — maximum time off, minimum spend.`}
      </p>

      {tab === 'publicHoliday' ? (
        <AnchoredHolidayTable
          entries={anchoredPublicHolidayPlans}
          selectedPlanId={selectedPlan?.id}
          today={today}
          onSelectPlan={onSelectPlan}
        />
      ) : (
        <PlanTable
          plans={tab === 'soonest' ? soonestPlans : bestPlans}
          selectedPlanId={selectedPlan?.id}
          onSelectPlan={onSelectPlan}
          showDaysUntil={tab === 'soonest'}
          today={today}
        />
      )}

      {selectedPlan && (
        <>
          <p className="plan-selected-label">
            🎯 Your pick: {selectedPlan.startDate} – {selectedPlan.endDate}
          </p>
          <PlanBar plan={selectedPlan} years={years} />
        </>
      )}

      <div className="legend">
        <span className="legend-item legend-item--holiday">Public holiday</span>
        <span className="legend-item legend-item--weekend">Weekend</span>
        <span className="legend-item legend-item--leave">Annual leave</span>
      </div>
    </section>
  )
}
