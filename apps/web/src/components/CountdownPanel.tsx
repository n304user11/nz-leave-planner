import { weekdayLabel } from '@nz-leave/core'
import type { BreakPeriod, PublicHoliday } from '@nz-leave/core'
import { getHolidayTheme } from '../lib/holidayThemes'

type CountdownPanelProps = {
  today: string
  nextBreak: BreakPeriod | null
  breakCountdownDays: number | null
  nextPublicHoliday: PublicHoliday | null
  publicHolidayCountdownDays: number | null
}

function formatRange(start: string, end: string): string {
  if (start === end) {
    return `${start} (${weekdayLabel(start)})`
  }
  return `${start} (${weekdayLabel(start)}) – ${end} (${weekdayLabel(end)})`
}

function countdownLabel(days: number | null | undefined, todayWord: string): string {
  if (days === 0) return todayWord
  if (days === 1) return '1 day'
  if (days != null) return `${days} days`
  return '—'
}

export default function CountdownPanel({
  today,
  nextBreak,
  breakCountdownDays,
  nextPublicHoliday,
  publicHolidayCountdownDays,
}: CountdownPanelProps) {
  const holidayTheme = nextPublicHoliday
    ? getHolidayTheme(nextPublicHoliday.id)
    : null

  return (
    <section className="countdown-panel" aria-label="Holiday countdown">
      <article className="countdown-card countdown-card--break">
        <div className="countdown-card-head">
          <span className="countdown-card-icon" aria-hidden="true">
            🌴
          </span>
          <h2>Next break</h2>
        </div>
        {nextBreak ? (
          <>
            <p className="countdown-value">
              {countdownLabel(breakCountdownDays, "You're off!")}
            </p>
            <p className="countdown-detail countdown-detail--celebrate">
              {nextBreak.dayCount}-day stretch · {formatRange(nextBreak.startDate, nextBreak.endDate)}
            </p>
            {nextBreak.holidayNames.length > 0 && (
              <p className="countdown-meta countdown-pills">
                {nextBreak.holidayNames.map((name) => (
                  <span key={name} className="festive-pill">
                    {name}
                  </span>
                ))}
              </p>
            )}
          </>
        ) : (
          <p className="countdown-meta">Nothing lined up just yet — pick a plan below.</p>
        )}
      </article>

      <article
        className={
          holidayTheme
            ? `countdown-card countdown-card--holiday holiday-theme holiday-theme--${holidayTheme.id}`
            : 'countdown-card countdown-card--holiday'
        }
      >
        {holidayTheme && (
          <div className="holiday-theme-bg" aria-hidden="true">
            {holidayTheme.decos.map((deco, i) => (
              <span
                key={`${deco}-${i}`}
                className={`holiday-theme-deco holiday-theme-deco--pos-${i % 5}`}
              >
                {deco}
              </span>
            ))}
          </div>
        )}

        <div className="holiday-theme-content">
          <div className="countdown-card-head">
            <span className="countdown-card-icon countdown-card-icon--hero" aria-hidden="true">
              {holidayTheme?.icon ?? '🎉'}
            </span>
            <div>
              <h2>{holidayTheme?.headline ?? 'Next public holiday'}</h2>
              {holidayTheme && (
                <p className="holiday-theme-tagline">{holidayTheme.tagline}</p>
              )}
            </div>
          </div>
          {nextPublicHoliday ? (
            <>
              <p className="countdown-value countdown-value--themed">
                {countdownLabel(publicHolidayCountdownDays, "It's today!")}
              </p>
              <p className="countdown-detail countdown-detail--celebrate">
                {nextPublicHoliday.observedDate} ({weekdayLabel(nextPublicHoliday.observedDate)})
              </p>
            </>
          ) : (
            <p className="countdown-meta">No public holiday left in this window.</p>
          )}
          <p className="countdown-meta countdown-today">Today · {today}</p>
        </div>
      </article>
    </section>
  )
}
