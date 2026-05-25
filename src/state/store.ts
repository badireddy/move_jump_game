import { create } from 'zustand'
import type { Profile, ProfileState, ReviewEvent, SrsCard, TopicId } from '../types'
import { createCard, review as srsReview } from '../srs/engine'
import {
  EMPTY_FAMILY,
  LocalStorageAdapter,
  profileById,
  upsertProfile,
  type FamilyData,
  type Storage,
} from '../data/storage'
import { createFirebaseAdapter, readFirebaseConfig } from '../data/firebase'

const XP_PER_CORRECT = 10
const XP_PER_NEW = 5
const XP_SESSION_BONUS = 20

export function levelForXp(xp: number): number {
  return 1 + Math.floor(xp / 100)
}

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

function emptyCards(): ProfileState['cards'] {
  return { geography: {}, usstates: {}, spelling: {}, nature: {}, mythology: {} }
}

export function newProfileState(profile: Profile): ProfileState {
  return {
    profile,
    stats: {
      xp: 0,
      level: 1,
      streakDays: 0,
      lastActiveDay: null,
      sessionsCompleted: 0,
      totalReviews: 0,
      totalCorrect: 0,
    },
    cards: emptyCards(),
    badges: [],
  }
}

export interface SessionSummary {
  topic: TopicId
  reviewed: number
  correct: number
  newLearned: number
}

interface AppState {
  ready: boolean
  storageKind: 'local' | 'cloud'
  family: FamilyData
  currentProfileId: string | null
  init: () => Promise<void>
  createProfile: (name: string, avatar: string, color: string) => Promise<string>
  selectProfile: (id: string) => void
  current: () => ProfileState | undefined
  introduce: (topic: TopicId, itemId: string) => void
  recordReview: (topic: TopicId, itemId: string, event: ReviewEvent) => void
  finishSession: (summary: SessionSummary) => void
}

let storage: Storage = new LocalStorageAdapter()

function persist(family: FamilyData) {
  void storage.save(family)
}

// Mutate the current profile immutably, persist, and update the store.
function mutateCurrent(get: () => AppState, set: (p: Partial<AppState>) => void, fn: (p: ProfileState) => ProfileState) {
  const { family, currentProfileId } = get()
  if (!currentProfileId) return
  const cur = profileById(family, currentProfileId)
  if (!cur) return
  const nextFamily = upsertProfile(family, fn(cur))
  persist(nextFamily)
  set({ family: nextFamily })
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  storageKind: 'local',
  family: EMPTY_FAMILY,
  currentProfileId: null,

  async init() {
    const cfg = readFirebaseConfig()
    if (cfg) {
      try {
        const cloud = await createFirebaseAdapter(cfg)
        // First time on the cloud: if the shared doc is empty but this device
        // has local progress, seed the cloud with it so existing profiles
        // (and their saved progress) carry over instead of starting blank.
        const remote = await cloud.load()
        if (remote.profiles.length === 0) {
          const local = await new LocalStorageAdapter().load()
          if (local.profiles.length > 0) await cloud.save(local)
        }
        storage = cloud
        storage.subscribe?.((data) => set({ family: data }))
      } catch (e) {
        console.warn('Cloud sync unavailable, falling back to local storage.', e)
        storage = new LocalStorageAdapter()
      }
    }
    const family = await storage.load()
    set({ family, ready: true, storageKind: storage.kind })
  },

  async createProfile(name, avatar, color) {
    const profile: Profile = {
      id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      avatar,
      color,
      createdAt: Date.now(),
    }
    const family = upsertProfile(get().family, newProfileState(profile))
    persist(family)
    set({ family, currentProfileId: profile.id })
    return profile.id
  },

  selectProfile(id) {
    set({ currentProfileId: id })
  },

  current() {
    const { family, currentProfileId } = get()
    return currentProfileId ? profileById(family, currentProfileId) : undefined
  },

  introduce(topic, itemId) {
    mutateCurrent(get, set, (p) => {
      const topicCards = p.cards[topic] ?? {}
      if (topicCards[itemId]) return p
      const card = createCard(itemId, Date.now())
      return { ...p, cards: { ...p.cards, [topic]: { ...topicCards, [itemId]: card } } }
    })
  },

  recordReview(topic, itemId, event) {
    mutateCurrent(get, set, (p) => {
      const topicCards = p.cards[topic] ?? {}
      const existing: SrsCard = topicCards[itemId] ?? createCard(itemId, event.t)
      const updated = srsReview(existing, event)
      return {
        ...p,
        cards: { ...p.cards, [topic]: { ...topicCards, [updated.itemId]: updated } },
        stats: {
          ...p.stats,
          totalReviews: p.stats.totalReviews + 1,
          totalCorrect: p.stats.totalCorrect + (event.correct ? 1 : 0),
        },
      }
    })
  },

  finishSession(summary) {
    mutateCurrent(get, set, (p) => {
      const gainedXp =
        summary.correct * XP_PER_CORRECT + summary.newLearned * XP_PER_NEW + XP_SESSION_BONUS
      const xp = p.stats.xp + gainedXp
      const today = todayStr()
      const last = p.stats.lastActiveDay
      let streakDays = p.stats.streakDays
      if (last !== today) {
        streakDays = last && dayDiff(last, today) === 1 ? streakDays + 1 : 1
      }
      const stats = {
        ...p.stats,
        xp,
        level: levelForXp(xp),
        streakDays,
        lastActiveDay: today,
        sessionsCompleted: p.stats.sessionsCompleted + 1,
      }
      return { ...p, stats, badges: computeBadges({ ...p, stats }) }
    })
  },
}))

function computeBadges(p: ProfileState): string[] {
  const badges = new Set(p.badges)
  if (p.stats.streakDays >= 3) badges.add('streak-3')
  if (p.stats.streakDays >= 7) badges.add('streak-7')
  if (p.stats.totalCorrect >= 50) badges.add('correct-50')
  if (p.stats.totalCorrect >= 200) badges.add('correct-200')
  const geoMastered = Object.values(p.cards.geography).filter((c) => c.box >= 4).length
  if (geoMastered >= 10) badges.add('geo-explorer')
  if (geoMastered >= 30) badges.add('geo-master')
  const stateMastered = Object.values(p.cards.usstates ?? {}).filter((c) => c.box >= 4).length
  if (stateMastered >= 10) badges.add('states-explorer')
  if (stateMastered >= 25) badges.add('states-master')
  return [...badges]
}
