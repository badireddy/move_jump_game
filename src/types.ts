export type TopicId = 'geography' | 'usstates' | 'spelling' | 'nature' | 'mythology'

// How a play session sources its items: the adaptive daily mix, a free review
// of everything learned, a focused practice of past mistakes, or a no-quiz
// study walk-through of the clues for everything learned.
export type SessionMode = 'daily' | 'review' | 'mistakes' | 'study'

export type QuizMode =
  | 'flag-to-country'
  | 'country-to-capital'
  | 'capital-to-country'
  | 'locate-on-map'
  | 'state-to-capital'
  | 'capital-to-state'
  | 'locate-state'
  | 'spell-word'

// A single learnable fact. Content is topic-specific and stored statically.
export interface CountryItem {
  id: string // stable id, e.g. "geo:FR"
  iso2: string // ISO 3166-1 alpha-2, lowercase, used for the flag svg
  name: string
  capital: string
  continent: Continent
  // Optional alias used to match this country to a map geography feature name.
  mapName?: string
}

export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania'

// A spelling-bee word: heard aloud, then typed. Definition and example are
// shown/spoken as hints (and disambiguate same-sounding words).
export interface SpellingItem {
  id: string // stable id, e.g. "spell:friend"
  word: string
  definition: string
  example: string
}

// A US state fact. No flag — states are taught by name, capital, and location.
export interface StateItem {
  id: string // stable id, e.g. "us:CA"
  code: string // USPS 2-letter code, e.g. "CA"
  name: string
  capital: string
  // Optional alias used to match this state to a map geography feature name.
  mapName?: string
}

// --- Spaced repetition ---
export interface SrsCard {
  itemId: string
  box: number // 1..5 (Leitner)
  due: number // epoch ms when this card is next due
  reps: number // total times reviewed
  lapses: number // times forgotten (correct -> wrong)
  streak: number // current correct streak
  lastReviewed: number | null
  introduced: number // when the learner first saw it (teach mode)
  history: ReviewEvent[]
}

export interface ReviewEvent {
  t: number
  correct: boolean
  mode: QuizMode
  // What the learner picked when wrong (for the struggle profile / AI hints).
  chosenItemId?: string
}

// --- Profiles & stats ---
export interface Profile {
  id: string
  name: string
  avatar: string // emoji
  color: string // tailwind-ish hex for accents
  createdAt: number
}

export interface ProfileStats {
  xp: number
  level: number
  streakDays: number
  lastActiveDay: string | null // YYYY-MM-DD
  sessionsCompleted: number
  totalReviews: number
  totalCorrect: number
}

// Everything we persist for a single profile.
export interface ProfileState {
  profile: Profile
  stats: ProfileStats
  // SRS cards keyed by itemId, scoped per topic.
  cards: Record<TopicId, Record<string, SrsCard>>
  badges: string[]
}
