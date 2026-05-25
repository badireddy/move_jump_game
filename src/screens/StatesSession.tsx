import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { QuizMode, SessionMode, StateItem } from '../types'
import { useStore } from '../state/store'
import { STATES, STATE_BY_ID } from '../content/usstates/states'
import { planSession, reviewIds } from '../srs/engine'
import { buildStateQuestion, type StateMode, type StateQuestion } from '../content/usstates/quiz'
import { UsMap } from '../components/UsMap'
import { explainWrong, mnemonicFor } from '../ai/client'
import { speak } from '../lib/audio'
import { bigCheer, cheer } from '../lib/celebrate'

const ALL_IDS = STATES.map((s) => s.id)

function correctLabel(mode: StateMode, item: StateItem): string {
  return mode === 'state-to-capital' ? item.capital : item.name
}
function optionLabel(mode: StateMode, opt: StateItem): string {
  return mode === 'state-to-capital' ? opt.capital : opt.name
}
function promptFor(mode: StateMode, item: StateItem): string {
  switch (mode) {
    case 'state-to-capital':
      return `What is the capital of ${item.name}?`
    case 'capital-to-state':
      return `${item.capital} is the capital of which state?`
    case 'locate-state':
      return `Tap ${item.name} on the map!`
  }
}

export function StatesSession({ onExit, mode = 'daily' }: { onExit: () => void; mode?: SessionMode }) {
  const current = useStore((s) => s.current())!
  const introduce = useStore((s) => s.introduce)
  const recordReview = useStore((s) => s.recordReview)
  const finishSession = useStore((s) => s.finishSession)
  const accent = current.profile.color

  const plan = useMemo(() => {
    const cards = current.cards.usstates ?? {}
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

  const [phase, setPhase] = useState<'teach' | 'quiz' | 'done'>(
    plan.teachIds.length > 0 ? 'teach' : 'quiz',
  )

  if (plan.teachIds.length === 0 && plan.quizIds.length === 0) {
    return <EmptyState mode={mode} onExit={onExit} />
  }

  if (phase === 'teach') {
    return (
      <TeachFlow
        ids={plan.teachIds}
        accent={accent}
        study={mode === 'study'}
        onTaught={(id) => introduce('usstates', id)}
        onDone={() => setPhase(mode === 'study' ? 'done' : 'quiz')}
      />
    )
  }

  if (phase === 'quiz') {
    return (
      <QuizFlow
        ids={plan.quizIds}
        accent={accent}
        onAnswer={(id, ev) => recordReview('usstates', id, ev)}
        onDone={(summary) => {
          finishSession({ topic: 'usstates', newLearned: plan.newLearned, ...summary })
          setPhase('done')
        }}
      />
    )
  }

  return <SessionDone mode={mode} newLearned={plan.newLearned} onExit={onExit} />
}

function TeachFlow({
  ids,
  accent,
  study = false,
  onTaught,
  onDone,
}: {
  ids: string[]
  accent: string
  study?: boolean
  onTaught: (id: string) => void
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const item = STATE_BY_ID[ids[i]]
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    onTaught(item.id)
    speak(`Let's explore ${item.name}! Its capital city is ${item.capital}.`)
    setTip(null)
    let alive = true
    mnemonicFor(item.id, `${item.capital} is the capital of the US state ${item.name}`).then((t) => {
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
      <Header title={`${study ? 'Review' : 'Learn'} · ${i + 1}/${ids.length}`} onExit={onDone} exitLabel={study ? 'Done' : 'Skip to quiz'} />
      <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-1 flex-col items-center gap-3 p-5">
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold">{item.name}</div>
          <div className="text-slate-300">
            Capital: <span className="font-bold text-white">{item.capital}</span>
          </div>
          <div className="text-xs text-slate-400">United States</div>
        </div>
        <button onClick={() => speak(`${item.name}. Its capital is ${item.capital}!`)} className="btn rounded-full bg-white/10 px-4 py-1.5 text-sm">
          🔊 Say it
        </button>
        <UsMap highlightCode={item.code} accent={accent} />
        {tip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-brand-500/15 px-4 py-2 text-center text-sm text-brand-100">
            💡 {tip}
          </motion.div>
        )}
      </motion.div>
      <button onClick={next} className="btn mt-4 bg-brand-600 py-4 font-display text-xl">
        {i + 1 < ids.length ? (study ? 'Next' : 'Got it! Next') : study ? 'Done' : "Let's quiz!"}
      </button>
    </div>
  )
}

interface Feedback {
  correct: boolean
  question: StateQuestion
  chosen?: StateItem
  explanation?: string | null
}

function QuizFlow({
  ids,
  accent,
  onAnswer,
  onDone,
}: {
  ids: string[]
  accent: string
  onAnswer: (id: string, ev: { t: number; correct: boolean; mode: QuizMode; chosenItemId?: string }) => void
  onDone: (summary: { reviewed: number; correct: number }) => void
}) {
  const queueRef = useRef<StateQuestion[]>(ids.map((id) => buildStateQuestion(id)))
  const requeued = useRef<Set<string>>(new Set())
  const [idx, setIdx] = useState(0)
  const tally = useRef({ reviewed: 0, correct: 0 })
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [wrongCode, setWrongCode] = useState<string | undefined>()

  const q = queueRef.current[idx]

  function answer(chosen: StateItem | undefined) {
    if (feedback) return
    const correct = chosen?.id === q.item.id
    tally.current.reviewed += 1
    if (correct) tally.current.correct += 1
    onAnswer(q.item.id, {
      t: Date.now(),
      correct,
      mode: q.mode,
      chosenItemId: !correct ? chosen?.id : undefined,
    })

    if (correct) {
      cheer()
      setFeedback({ correct, question: q, chosen })
    } else {
      if (q.mode === 'locate-state') setWrongCode(chosen?.code)
      if (!requeued.current.has(q.item.id)) {
        requeued.current.add(q.item.id)
        queueRef.current.push(buildStateQuestion(q.item.id, { allowMap: false }))
      }
      setFeedback({ correct, question: q, chosen, explanation: undefined })
      explainWrong(correctLabel(q.mode, q.item), chosen ? optionLabel(q.mode, chosen) : 'that').then((ex) =>
        setFeedback((f) => (f ? { ...f, explanation: ex } : f)),
      )
    }
  }

  function next() {
    setFeedback(null)
    setWrongCode(undefined)
    if (idx + 1 < queueRef.current.length) setIdx(idx + 1)
    else onDone({ ...tally.current })
  }

  const total = queueRef.current.length
  return (
    <div className="flex flex-1 flex-col">
      <Header title="" onExit={() => onDone({ ...tally.current })} exitLabel="End" />
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="flex flex-1 flex-col">
        <p className="font-display mb-3 text-center text-xl font-bold">{promptFor(q.mode, q.item)}</p>

        {q.mode === 'locate-state' ? (
          <UsMap interactive accent={accent} wrongCode={wrongCode} onPick={(s) => answer(s)} />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt) => {
              const isCorrect = feedback && opt.id === q.item.id
              const isChosenWrong = feedback && !feedback.correct && feedback.chosen?.id === opt.id
              return (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.97 }}
                  disabled={!!feedback}
                  onClick={() => answer(opt)}
                  className={`btn border px-4 py-4 text-left font-semibold ${
                    isCorrect
                      ? 'border-green-400 bg-green-500/20'
                      : isChosenWrong
                        ? 'border-red-400 bg-red-500/20'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  {optionLabel(q.mode, opt)}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className={`mt-4 rounded-2xl p-4 ${feedback.correct ? 'bg-green-600/30' : 'bg-red-600/25'}`}
          >
            <div className="font-display text-lg font-bold">
              {feedback.correct ? '🎉 Correct!' : `Not quite — it's ${correctLabel(q.mode, q.item)}`}
            </div>
            {!feedback.correct && feedback.explanation && (
              <div className="mt-1 text-sm text-slate-100">💡 {feedback.explanation}</div>
            )}
            <button onClick={next} className="btn mt-3 w-full bg-white/15 py-3 font-display text-lg">
              Continue
            </button>
          </motion.div>
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
        {mode === 'daily' ? 'Quest Complete!' : mode === 'study' ? 'All reviewed!' : 'Great review!'}
      </h2>
      <p className="text-slate-300">
        {mode === 'daily'
          ? `You learned ${newLearned} new ${newLearned === 1 ? 'state' : 'states'} and earned XP!`
          : mode === 'study'
            ? "Nice — you went back through everything you've learned."
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
      ? { icon: '🎉', title: 'No mistakes to practice!', sub: "You haven't missed anything yet. Keep it up!" }
      : mode === 'review'
        ? { icon: '📚', title: 'Nothing to review yet', sub: 'Play a session first, then come back to review it.' }
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

function Header({ title, onExit, exitLabel }: { title: string; onExit: () => void; exitLabel: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-display font-bold text-slate-300">{title}</span>
      <button onClick={onExit} className="text-sm text-slate-400">
        {exitLabel}
      </button>
    </div>
  )
}
