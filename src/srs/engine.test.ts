import { describe, expect, it } from 'vitest'
import { createCard, difficultyScore, isDue, isMastered, planSession, review } from './engine'
import type { SrsCard } from '../types'

const T0 = 1_700_000_000_000
const ev = (t: number, correct: boolean) => ({ t, correct, mode: 'flag-to-country' as const })

describe('srs engine', () => {
  it('creates a fresh card due immediately in box 1', () => {
    const c = createCard('geo:FR', T0)
    expect(c.box).toBe(1)
    expect(isDue(c, T0)).toBe(true)
    expect(c.reps).toBe(0)
  })

  it('advances the box and pushes the due date out on a correct answer', () => {
    let c = createCard('geo:FR', T0)
    c = review(c, ev(T0, true))
    expect(c.box).toBe(2)
    expect(c.streak).toBe(1)
    expect(c.due).toBeGreaterThan(T0)
    expect(isDue(c, T0)).toBe(false)
  })

  it('resets to box 1 on a wrong answer', () => {
    let c = createCard('geo:FR', T0)
    c = review(c, ev(T0, true))
    c = review(c, ev(T0, true))
    expect(c.box).toBe(3)
    c = review(c, ev(T0, false))
    expect(c.box).toBe(1)
    expect(c.streak).toBe(0)
  })

  it('counts a lapse only when a mastered card is forgotten', () => {
    let c = createCard('geo:FR', T0)
    for (let i = 0; i < 3; i++) c = review(c, ev(T0, true)) // box 4 = mastered
    expect(isMastered(c)).toBe(true)
    c = review(c, ev(T0, false))
    expect(c.lapses).toBe(1)
  })

  it('ranks harder cards above easier ones', () => {
    const easy: SrsCard = { ...createCard('a', T0), box: 5, history: [ev(T0, true)] }
    const hard: SrsCard = { ...createCard('b', T0), box: 1, lapses: 3, history: [ev(T0, false)] }
    expect(difficultyScore(hard)).toBeGreaterThan(difficultyScore(easy))
  })

  it('plans a session with due reviews and fresh items', () => {
    const cards: Record<string, SrsCard> = {
      'geo:FR': { ...createCard('geo:FR', T0), due: T0 - 1000 }, // due
      'geo:DE': { ...createCard('geo:DE', T0), due: T0 + 9e9 }, // not due
    }
    const plan = planSession(cards, ['geo:FR', 'geo:DE', 'geo:IT', 'geo:ES'], T0, { maxNew: 2 })
    expect(plan.reviewIds).toContain('geo:FR')
    expect(plan.reviewIds).not.toContain('geo:DE')
    expect(plan.newIds).toEqual(['geo:IT', 'geo:ES'])
  })
})
