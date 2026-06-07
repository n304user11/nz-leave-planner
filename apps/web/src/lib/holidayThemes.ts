import type { HolidayId } from '@nz-leave/core'

export type HolidayTheme = {
  id: HolidayId
  icon: string
  decos: string[]
  headline: string
  tagline: string
}

export const HOLIDAY_THEMES: Record<HolidayId, HolidayTheme> = {
  'new-years-day': {
    id: 'new-years-day',
    icon: '🎆',
    decos: ['🥳', '✨', '🍾', '🎇', '⭐'],
    headline: "New Year's Day",
    tagline: 'Fresh start energy — party hats optional.',
  },
  'day-after-new-years': {
    id: 'day-after-new-years',
    icon: '😴',
    decos: ['☕', '🛋️', '🌅', '💤'],
    headline: "Day after New Year's",
    tagline: 'Recovery mode: still counts as a day off.',
  },
  'waitangi-day': {
    id: 'waitangi-day',
    icon: '🇳🇿',
    decos: ['🌿', '⛵', '🌊', '✨'],
    headline: 'Waitangi Day',
    tagline: 'Summer at the beach — national day vibes.',
  },
  'good-friday': {
    id: 'good-friday',
    icon: '🐰',
    decos: ['🥚', '🌸', '🍫', '✝️'],
    headline: 'Good Friday',
    tagline: 'Long weekend loading — hot cross buns encouraged.',
  },
  'easter-monday': {
    id: 'easter-monday',
    icon: '🐣',
    decos: ['🥚', '🐰', '🌷', '🍫', '💐'],
    headline: 'Easter Monday',
    tagline: 'One more sleep-in before reality returns.',
  },
  'anzac-day': {
    id: 'anzac-day',
    icon: '🌺',
    decos: ['🕯️', '🌿', '⭐'],
    headline: 'ANZAC Day',
    tagline: 'Lest we forget — dawn service then a quiet day.',
  },
  'kings-birthday': {
    id: 'kings-birthday',
    icon: '👑',
    decos: ['🎩', '✨', '🫖', '🎉'],
    headline: "King's Birthday",
    tagline: 'Royal long weekend — crown yourself champion of rest.',
  },
  matariki: {
    id: 'matariki',
    icon: '✨',
    decos: ['🌟', '⭐', '🌙', '🔭', '✨'],
    headline: 'Matariki',
    tagline: 'Stars align — Māori New Year, maximum cosy.',
  },
  'labour-day': {
    id: 'labour-day',
    icon: '🌸',
    decos: ['🛠️', '☀️', '🏡', '🍖', '🌷'],
    headline: 'Labour Day',
    tagline: 'Spring long weekend — BBQ diplomacy starts now.',
  },
  'christmas-day': {
    id: 'christmas-day',
    icon: '🎄',
    decos: ['🎅', '❄️', '🎁', '⭐', '🔔'],
    headline: 'Christmas Day',
    tagline: 'Pavlova era activated — Santa approved.',
  },
  'boxing-day': {
    id: 'boxing-day',
    icon: '🎁',
    decos: ['📦', '🏖️', '🎉', '☀️', '🛍️'],
    headline: 'Boxing Day',
    tagline: 'Unwrap round two — beach or bargain hunt, you choose.',
  },
}

export function getHolidayTheme(id: HolidayId): HolidayTheme {
  return HOLIDAY_THEMES[id]
}
