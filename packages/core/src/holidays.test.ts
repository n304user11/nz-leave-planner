import { describe, expect, it } from 'vitest'
import { getNzHolidaysForYear } from './nzHolidays'

function observed(year: number, id: string): string {
  const h = getNzHolidaysForYear(year).holidays.find((x) => x.id === id)
  if (!h) throw new Error(`Missing ${id} in ${year}`)
  return h.observedDate
}

describe('NZ holidays observed dates', () => {
  it('2026 ANZAC and Boxing', () => {
    expect(observed(2026, 'anzac-day')).toBe('2026-04-27')
    expect(observed(2026, 'boxing-day')).toBe('2026-12-28')
  })

  it('2027 Waitangi and Boxing', () => {
    expect(observed(2027, 'waitangi-day')).toBe('2027-02-08')
    expect(observed(2027, 'boxing-day')).toBe('2027-12-28')
    expect(observed(2027, 'day-after-new-years')).toBe('2027-01-04')
  })

  it('2026 Good Friday Easter window', () => {
    expect(observed(2026, 'good-friday')).toBe('2026-04-03')
    expect(observed(2026, 'easter-monday')).toBe('2026-04-06')
  })
})
