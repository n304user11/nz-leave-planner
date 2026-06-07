import { weekdayLabel } from '@nz-leave/core'
import type { YearHolidaysResult } from '@nz-leave/core'

type HolidayListProps = {
  results: YearHolidaysResult[]
}

export default function HolidayList({ results }: HolidayListProps) {
  return (
    <section className="holiday-list">
      <h2>NZ public holiday calendar</h2>
      {results.map((result) => (
        <details key={result.year} className="holiday-year">
          <summary className="holiday-year-summary">
            <span>{result.year}</span>
            <span className="holiday-year-count">{result.holidays.length} holidays</span>
          </summary>
          {result.warnings.includes('matariki_unavailable') && (
            <p className="warning">
              Matariki dates are not available for this year (not yet legislated beyond 2052).
            </p>
          )}
          <ul>
            {result.holidays.map((h) => (
              <li key={`${result.year}-${h.id}`}>
                <span className="holiday-name">{h.name}</span>
                <span className="holiday-date">
                  {h.actualDate === h.observedDate ? (
                    <>
                      {h.observedDate} ({weekdayLabel(h.observedDate)})
                    </>
                  ) : (
                    <>
                      actual {h.actualDate} ({weekdayLabel(h.actualDate)}) → observed{' '}
                      {h.observedDate} ({weekdayLabel(h.observedDate)})
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  )
}
