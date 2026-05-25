import type { ReviewEvent, SrsCard } from '../types'

// Leitner intervals per box, in days. Box 1 is "soon" (re-seen next day or
// re-queued within the same session); higher boxes space further out.
export const BOX_INTERVALS_DAYS = [0, 1, 2, 4, 8, 16] as const
export const MAX_BOX = 5
export const MASTERY_BOX = 4 // box >= this counts as "mastered"
const DAY_MS = 24 * 60 * 60 * 1000
const HISTORY_CAP = 20

export function createCard(itemId: string, now: number): SrsCard {
  return {
    itemId,
    box: 1,
    due: now,
    reps: 0,
    lapses: 0,
    streak: 0,
    lastReviewed: null,
    introduced: now,
    history: [],
  }
}

function nextDue(box: number, now: number): number {
  const days = BOX_INTERVALS_DAYS[Math.min(box, MAX_BOX)]
  return now + days * DAY_MS
}

// Apply a single review result and return a new card (pure).
export function review(card: SrsCard, event: ReviewEvent): SrsCard {
  const wasMastered = card.box >= MASTERY_BOX
  let box: number
  let lapses = card.lapses
  let streak: number

  if (event.correct) {
    box = Math.min(card.box + 1, MAX_BOX)
    streak = card.streak + 1
  } else {
    box = 1
    streak = 0
    if (wasMastered) lapses += 1 // forgot something we thought was learned
  }

  return {
    ...card,
    box,
    streak,
    lapses,
    reps: card.reps + 1,
    lastReviewed: event.t,
    due: nextDue(box, event.t),
    history: [...card.history, event].slice(-HISTORY_CAP),
  }
}

export function isDue(card: SrsCard, now: number): boolean {
  return card.due <= now
}

export function isMastered(card: SrsCard): boolean {
  return card.box >= MASTERY_BOX
}

// A simple difficulty score: more lapses and a low box = harder. Used to
// surface "what she finds hard" and to prioritise remediation.
export function difficultyScore(card: SrsCard): number {
  const accuracy = card.reps === 0 ? 1 : card.history.filter((h) => h.correct).length / card.history.length
  return card.lapses * 2 + (MAX_BOX - card.box) + (1 - accuracy) * 3
}

export interface SessionPlan {
  reviewIds: string[] // due cards, hardest first
  newIds: string[] // items to introduce this session
}

// Build a session: all due reviews (capped), then a batch of brand-new items.
export function planSession(
  cards: Record<string, SrsCard>,
  allItemIds: string[],
  now: number,
  opts: { maxNew?: number; maxReview?: number } = {},
): SessionPlan {
  const maxNew = opts.maxNew ?? 6
  const maxReview = opts.maxReview ?? 15

  const due = Object.values(cards)
    .filter((c) => isDue(c, now))
    .sort((a, b) => difficultyScore(b) - difficultyScore(a))
    .slice(0, maxReview)
    .map((c) => c.itemId)

  const seen = new Set(Object.keys(cards))
  const fresh = allItemIds.filter((id) => !seen.has(id)).slice(0, maxNew)

  return { reviewIds: due, newIds: fresh }
}

// True if the learner has ever missed this card — slipped on a mastered one,
// or got it wrong at any point in its recent history.
export function hasMistake(card: SrsCard): boolean {
  return card.lapses > 0 || card.history.some((h) => !h.correct)
}

// Free review: already-introduced cards, hardest first, independent of the due
// schedule — so the learner can practise anything they've seen, any time
// (including last session or a few days back). With `mistakesOnly`, narrows to
// cards they've gotten wrong before.
export function reviewIds(
  cards: Record<string, SrsCard>,
  opts: { mistakesOnly?: boolean; max?: number } = {},
): string[] {
  let list = Object.values(cards)
  if (opts.mistakesOnly) list = list.filter(hasMistake)
  return list
    .sort((a, b) => difficultyScore(b) - difficultyScore(a))
    .slice(0, opts.max ?? 30)
    .map((c) => c.itemId)
}

export interface TopicProgress {
  total: number
  introduced: number
  mastered: number
  due: number
}

export function topicProgress(
  cards: Record<string, SrsCard>,
  totalItems: number,
  now: number,
): TopicProgress {
  const values = Object.values(cards)
  return {
    total: totalItems,
    introduced: values.length,
    mastered: values.filter(isMastered).length,
    due: values.filter((c) => isDue(c, now)).length,
  }
}
