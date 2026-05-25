import type { ProfileState } from '../types'

// The whole persisted blob for one family (both players live here).
export interface FamilyData {
  version: number
  profiles: ProfileState[]
}

export const EMPTY_FAMILY: FamilyData = { version: 1, profiles: [] }

// Storage is an adapter so the rest of the app never knows or cares whether
// data lives in localStorage or the cloud. Cloud adapters may also push
// realtime updates through `subscribe`.
export interface Storage {
  readonly kind: 'local' | 'cloud'
  load(): Promise<FamilyData>
  save(data: FamilyData): Promise<void>
  subscribe?(cb: (data: FamilyData) => void): () => void
}

const LOCAL_KEY = 'learnquest:family'

export class LocalStorageAdapter implements Storage {
  readonly kind = 'local' as const

  async load(): Promise<FamilyData> {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (!raw) return EMPTY_FAMILY
      return JSON.parse(raw) as FamilyData
    } catch {
      return EMPTY_FAMILY
    }
  }

  async save(data: FamilyData): Promise<void> {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  }
}

export function profileById(data: FamilyData, id: string): ProfileState | undefined {
  return data.profiles.find((p) => p.profile.id === id)
}

export function upsertProfile(data: FamilyData, next: ProfileState): FamilyData {
  const profiles = data.profiles.some((p) => p.profile.id === next.profile.id)
    ? data.profiles.map((p) => (p.profile.id === next.profile.id ? next : p))
    : [...data.profiles, next]
  return { ...data, profiles }
}
