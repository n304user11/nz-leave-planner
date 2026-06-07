import { describe, expect, it } from 'vitest'
import { getNextPublicHoliday, publicHolidayDaysUntil } from './countdown'

describe('getNextPublicHoliday', () => {
  it('returns the soonest observed holiday on or after today', () => {
    const holiday = getNextPublicHoliday('2026-06-04', [2026, 2027])
    expect(holiday).toBeDefined()
    expect(holiday!.id).toBe('matariki')
    expect(holiday!.observedDate).toBe('2026-07-10')
  })

  it('returns null when no holidays remain in range', () => {
    expect(getNextPublicHoliday('2028-01-01', [2026, 2027])).toBeNull()
  })
})

describe('publicHolidayDaysUntil', () => {
  it('counts days until the observed date', () => {
    const holiday = getNextPublicHoliday('2026-06-04', [2026, 2027])!
    expect(publicHolidayDaysUntil('2026-06-04', holiday)).toBe(36)
    expect(publicHolidayDaysUntil('2026-07-10', holiday)).toBe(0)
  })
})
