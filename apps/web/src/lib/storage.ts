import { migrateUserProfile, type UserProfile } from '@nz-leave/core'

const STORAGE_KEY = 'nz-leave-planner-profile-v1'

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<UserProfile>
    return migrateUserProfile(data)
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function exportProfile(profile: UserProfile): void {
  const blob = new Blob([JSON.stringify(profile, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `nz-leave-planner-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function importProfileFromFile(file: File): Promise<UserProfile> {
  return file.text().then((text) => {
    const data = JSON.parse(text) as Partial<UserProfile>
    if (typeof data.consecutiveDays !== 'number') {
      throw new Error('Invalid profile file')
    }
    return migrateUserProfile(data)
  })
}
