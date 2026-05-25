import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SessionMode } from '../types'
import { useStore } from '../state/store'
import { SPELLING_WORDS, SPELLING_BY_ID } from '../content/spelling/words'
import { planSession, reviewIds } from '../srs/engine'
import { mnemonicFor } from '../ai/client'
import { speak } from '../lib/audio'
import { bigCheer, cheer } from '../lib/celebrate'

const ALL_IDS = SPELLING_WORDS.map((w) => w.id)

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function SpellingSession({ onExit, mode = 'daily' }: { onExit: () => void; mode?: SessionMode }) {
  const current = useStore((s) => s.current())!
  const introduce = useStore((s) => s.introduce)
  const recordReview = useStore((s) => s.recordReview)
  const finishSession = useStore((s) => s.finishSession)

  const plan = useMemo(() => {
    const cards = current.cards.spelling ?? {}
    if (mode === 'daily') {
      const p = planSession(cards, ALL_IDS, Date.now(), { maxNew: 5, maxReview: 12 })
      return { teachIds: p.newIds, quizIds: [...p.newIds, ...p.reviewIds], newLearned: p.newIds.length }
    }
    if (mode === 'study') {
      return { teachIds: reviewIds(cards, { max: 200 }), quizIds: [] as string[], newLearned: 0 }
    }
    const ids = reviewIds(cards, { mistakesOnly: mode === 'mistakes', max: 20 })
    return { teachIds: [] as string[], quizIds: ids, newLearned: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [phase, setPhase] = useState<'teach' | 'quiz' | 'done'>(plan.teachIds.length > 0 ? 'teach' : 'quiz')

  if (plan.teachIds.length === 0 && plan.quizIds.length === 0) {
    return <EmptyState mode={mode} onExit={onExit} />
  }

  if (phase === 'teach') {
    return (
      <TeachFlow
        ids={plan.teachIds}
        study={mode === 'study'}
        onHome={onExit}
        onTaught={(id) => introduce('spelling', id)}
        onDone={() => setPhase(mode === 'study' ? 'done' : 'quiz')}
      />
    )
  }

  if (phase === 'quiz') {
    return (
      <QuizFlow
        ids={plan.quizIds}
        onHome={onExit}
        onAnswer={(id, correct) => recordReview('spelling', id, { t: Date.now(), correct, mode: 'spell-word' })}
        onDone={(summary) => {
          finishSession({ topic: 'spelling', newLearned: plan.newLearned, ...summary })
          setPhase('done')
        }}
      />
    )
  }

  return <SessionDone mode={mode} newLearned={plan.newLearned} onExit={onExit} />
}

function TeachFlow({
  ids,
  study = false,
  onHome,
  onTaught,
  onDone,
}: {
  ids: string[]
  study?: boolean
  onHome: () => void
  onTaught: (id: string) => void
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const item = SPELLING_BY_ID[ids[i]]
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    onTaught(item.id)
    speak(`Your word is, ${item.word}. ${item.definition} For example. ${item.example}`)
    setTip(null)
    let alive = true
    mnemonicFor(item.id, `a tip to remember how to spell the word "${item.word}"`).then((t) => {
      if (alive) setTip(t)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  function next() {
    if (i + 1 < ids.length) setI(i + 1)
    else onDone()
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`${study ? 'Review' : 'Learn'} · ${i + 1}/${ids.length}`} onHome={onHome} onExit={onDone} exitLabel={study ? 'Done' : 'Skip to quiz'} />
      <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
        <div className="font-display text-4xl font-extrabold tracking-wide">{item.word}</div>
        <button onClick={() => speak(item.word)} className="btn rounded-full bg-white/10 px-4 py-1.5 text-sm">
          🔊 Hear it
        </button>
        <p className="text-slate-300">{item.definition}</p>
        <p className="text-sm italic text-slate-400">“{item.example}”</p>
        {tip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-brand-500/15 px-4 py-2 text-sm text-brand-100">
            💡 {tip}
          </motion.div>
        )}
      </motion.div>
      <button onClick={next} className="btn mt-4 bg-brand-600 py-4 font-display text-xl">
        {i + 1 < ids.length ? (study ? 'Next' : 'Got it! Next') : study ? 'Done' : "Let's spell!"}
      </button>
    </div>
  )
}

interface Feedback {
  correct: boolean
  word: string
  typed: string
}

function QuizFlow({
  ids,
  onHome,
  onAnswer,
  onDone,
}: {
  ids: string[]
  onHome: () => void
  onAnswer: (id: string, correct: boolean) => void
  onDone: (summary: { reviewed: number; correct: number }) => void
}) {
  const queueRef = useRef<string[]>([...ids])
  const requeued = useRef<Set<string>>(new Set())
  const [idx, setIdx] = useState(0)
  const tally = useRef({ reviewed: 0, correct: 0 })
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const item = SPELLING_BY_ID[queueRef.current[idx]]

  // Read the word aloud and focus the box each time a new word comes up.
  useEffect(() => {
    speak(item.word)
    setValue('')
    setFeedback(null)
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  function check() {
    if (feedback || !value.trim()) return
    const correct = normalize(value) === normalize(item.word)
    tally.current.reviewed += 1
    if (correct) tally.current.correct += 1
    onAnswer(item.id, correct)
    if (correct) {
      cheer()
    } else if (!requeued.current.has(item.id)) {
      requeued.current.add(item.id)
      queueRef.current.push(item.id)
    }
    setFeedback({ correct, word: item.word, typed: value.trim() })
  }

  function next() {
    if (idx + 1 < queueRef.current.length) setIdx(idx + 1)
    else onDone({ ...tally.current })
  }

  const total = queueRef.current.length
  return (
    <div className="flex flex-1 flex-col">
      <Header title="" onHome={onHome} onExit={() => onDone({ ...tally.current })} exitLabel="End" />
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 pt-4">
        <p className="font-display text-xl font-bold">Spell the word you hear!</p>
        <div className="flex gap-2">
          <button onClick={() => speak(item.word)} className="btn rounded-full bg-white/10 px-5 py-3 text-lg">
            🔊 Hear word
          </button>
          <button onClick={() => speak(item.example)} className="btn rounded-full bg-white/10 px-5 py-3 text-lg">
            🗣️ In a sentence
          </button>
        </div>
        <p className="px-4 text-center text-sm text-slate-400">Hint: {item.definition}</p>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (feedback ? next() : check())
          }}
          disabled={!!feedback}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="type it here"
          className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-display text-2xl tracking-wide outline-none focus:border-brand-400"
        />
      </div>

      <AnimatePresence>
        {feedback ? (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className={`mt-4 rounded-2xl p-4 ${feedback.correct ? 'bg-green-600/30' : 'bg-red-600/25'}`}
          >
            <div className="font-display text-lg font-bold">
              {feedback.correct ? '🎉 Correct!' : 'Not quite!'}
            </div>
            <div className="mt-1 text-sm text-slate-100">
              {feedback.correct ? (
                <>It's spelled <span className="font-bold tracking-wide">{feedback.word}</span>.</>
              ) : (
                <>
                  You wrote <span className="line-through">{feedback.typed}</span>. It's spelled{' '}
                  <span className="font-bold tracking-widest">{feedback.word}</span>.
                </>
              )}
            </div>
            <button onClick={next} className="btn mt-3 w-full bg-white/15 py-3 font-display text-lg">
              Continue
            </button>
          </motion.div>
        ) : (
          <button
            onClick={check}
            disabled={!value.trim()}
            className={`btn mt-4 py-4 font-display text-xl ${value.trim() ? 'bg-brand-600' : 'bg-white/10 text-slate-500'}`}
          >
            Check
          </button>
        )}
      </AnimatePresence>
    </div>
  )
}

function SessionDone({ mode, newLearned, onExit }: { mode: SessionMode; newLearned: number; onExit: () => void }) {
  useEffect(() => {
    bigCheer()
  }, [])
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl">{mode === 'study' ? '📚' : '🏆'}</div>
      <h2 className="font-display text-3xl font-extrabold">
        {mode === 'daily' ? 'Spelling Star!' : mode === 'study' ? 'All reviewed!' : 'Great spelling!'}
      </h2>
      <p className="text-slate-300">
        {mode === 'daily'
          ? `You learned ${newLearned} new ${newLearned === 1 ? 'word' : 'words'} and earned XP!`
          : mode === 'study'
            ? "Nice — you went back through your words."
            : 'Every practice makes it stick. You earned XP!'}
      </p>
      <button onClick={onExit} className="btn bg-brand-600 px-8 py-3 font-display text-lg">
        Back home
      </button>
    </div>
  )
}

function EmptyState({ mode, onExit }: { mode: SessionMode; onExit: () => void }) {
  const msg =
    mode === 'mistakes'
      ? { icon: '🎉', title: 'No mistakes to practice!', sub: "You haven't missed any words yet. Keep it up!" }
      : mode === 'review'
        ? { icon: '📚', title: 'Nothing to review yet', sub: 'Play a session first, then come back to review.' }
        : { icon: '🌟', title: 'All caught up!', sub: 'Nothing to review right now. Come back later for more!' }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl">{msg.icon}</div>
      <h2 className="font-display text-2xl font-extrabold">{msg.title}</h2>
      <p className="text-slate-300">{msg.sub}</p>
      <button onClick={onExit} className="btn bg-brand-600 px-8 py-3 font-display text-lg">
        Back home
      </button>
    </div>
  )
}

function Header({ title, onHome, onExit, exitLabel }: { title: string; onHome: () => void; onExit: () => void; exitLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <button onClick={onHome} className="flex items-center gap-1 text-sm font-semibold text-slate-300" aria-label="Back to home">
        <span className="text-lg leading-none">←</span> Home
      </button>
      <span className="flex-1 text-center font-display font-bold text-slate-400">{title}</span>
      <button onClick={onExit} className="text-sm text-slate-400">
        {exitLabel}
      </button>
    </div>
  )
}
