const MS_PER_DAY = 86_400_000

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getToday(): string {
  return formatDate(new Date())
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

export function daysUntil(from: string, to: string): number {
  const a = parseDate(from)
  const b = parseDate(to)
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY)
}

export function getWeekday(dateStr: string): number {
  return parseDate(dateStr).getDay()
}

export function isWeekend(dateStr: string): boolean {
  const day = getWeekday(dateStr)
  return day === 0 || day === 6
}

export function isWeekday(dateStr: string): boolean {
  return !isWeekend(dateStr)
}

export function weekdayLabel(dateStr: string): string {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return labels[getWeekday(dateStr)]
}

export function dateInYear(year: number, month: number, day: number): string {
  return formatDate(new Date(year, month - 1, day))
}

/** nth weekday of month (n=1 first, n=4 fourth); weekday 0=Sun..6=Sat */
export function nthWeekdayOfMonth(
  year: number,
  month: number,
  n: number,
  weekday: number,
): string {
  let count = 0
  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getMonth() !== month - 1) break
    if (date.getDay() === weekday) {
      count++
      if (count === n) return formatDate(date)
    }
  }
  throw new Error(`No ${n}th weekday ${weekday} in ${year}-${month}`)
}

export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function maxDate(a: string, b: string): string {
  return compareDates(a, b) >= 0 ? a : b
}

export function minDate(a: string, b: string): string {
  return compareDates(a, b) <= 0 ? a : b
}
