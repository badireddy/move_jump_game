import type { QuizMode, StateItem } from '../../types'
import { STATES, STATE_BY_ID } from './states'

export type StateMode = Extract<QuizMode, 'state-to-capital' | 'capital-to-state' | 'locate-state'>

export interface StateQuestion {
  mode: StateMode
  item: StateItem
  options: StateItem[] // 4 options for multiple-choice modes; empty for map mode
}

// States big/clear enough to reliably tap on a phone. Keeps "locate-state"
// winnable — the tiny New England states are excluded.
const LOCATABLE = new Set([
  'CA', 'TX', 'FL', 'NY', 'AK', 'MT', 'NV', 'AZ', 'NM', 'CO', 'WY', 'OR', 'WA', 'UT', 'ID',
  'KS', 'NE', 'SD', 'ND', 'MN', 'IA', 'MO', 'OK', 'AR', 'LA', 'WI', 'MI', 'IL', 'IN', 'OH',
  'GA', 'TN', 'KY', 'NC', 'SC', 'VA', 'PA', 'AL', 'MS', 'WV', 'ME',
])

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function distractors(target: StateItem, count = 3): StateItem[] {
  return shuffle(STATES.filter((s) => s.id !== target.id)).slice(0, count)
}

const MC_MODES = ['state-to-capital', 'capital-to-state'] as const

function modeFor(item: StateItem, allowMap: boolean): StateMode {
  if (allowMap && LOCATABLE.has(item.code) && Math.random() < 0.35) return 'locate-state'
  return pick(MC_MODES)
}

export function buildStateQuestion(itemId: string, opts: { allowMap?: boolean } = {}): StateQuestion {
  const item = STATE_BY_ID[itemId]
  const mode = modeFor(item, opts.allowMap ?? true)
  if (mode === 'locate-state') return { mode, item, options: [] }
  const options = shuffle([item, ...distractors(item)])
  return { mode, item, options }
}
