import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CountryItem, QuizMode } from '../types'
import { useStore } from '../state/store'
import { COUNTRIES, COUNTRY_BY_ID } from '../content/geography/countries'
import { planSession } from '../srs/engine'
import { buildQuestion, type GeoQuestion } from '../content/geography/quiz'
import { Flag } from '../components/Flag'
import { WorldMap } from '../components/WorldMap'
import { explainWrong, mnemonicFor } from '../ai/client'
import { speak } from '../lib/audio'
import { bigCheer, cheer } from '../lib/celebrate'

const ALL_IDS = COUNTRIES.map((c) => c.id)

function correctLabel(mode: QuizMode, item: CountryItem): string {
  return mode === 'country-to-capital' ? item.capital : item.name
}
function optionLabel(mode: QuizMode, opt: CountryItem): string {
  return mode === 'country-to-capital' ? opt.capital : opt.name
}
function promptFor(mode: QuizMode, item: CountryItem): string {
  switch (mode) {
    case 'flag-to-country':
      return "Which country's flag is this?"
    case 'country-to-capital':
      return `What is the capital of ${item.name}?`
    case 'capital-to-country':
      return `${item.capital} is the capital of…?`
    case 'locate-on-map':
      return `Tap ${item.name} on the map!`
  }
}

export function GeographySession({ onExit }: { onExit: () => void }) {
  const current = useStore((s) => s.current())!
  const introduce = useStore((s) => s.introduce)
  const recordReview = useStore((s) => s.recordReview)
  const finishSession = useStore((s) => s.finishSession)
  const accent = current.profile.color

  // Plan once, at mount.
  const plan = useMemo(
    () => planSession(current.cards.geography, ALL_IDS, Date.now(), { maxNew: 5, maxReview: 12 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [phase, setPhase] = useState<'teach' | 'quiz' | 'done'>(
    plan.newIds.length > 0 ? 'teach' : 'quiz',
  )

  if (plan.newIds.length === 0 && plan.reviewIds.length === 0) {
    return <AllCaughtUp onExit={onExit} />
  }

  if (phase === 'teach') {
    return (
      <TeachFlow
        ids={plan.newIds}
        accent={accent}
        onTaught={(id) => introduce('geography', id)}
        onDone={() => setPhase('quiz')}
      />
    )
  }

  if (phase === 'quiz') {
    return (
      <QuizFlow
        ids={[...plan.newIds, ...plan.reviewIds]}
        accent={accent}
        onAnswer={(id, ev) => recordReview('geography', id, ev)}
        onDone={(summary) => {
          finishSession({ topic: 'geography', newLearned: plan.newIds.length, ...summary })
          setPhase('done')
        }}
      />
    )
  }

  return <SessionDone newLearned={plan.newIds.length} onExit={onExit} />
}

// --- Teach phase: introduce each new country with flag, capital, map & tip ---
function TeachFlow({
  ids,
  accent,
  onTaught,
  onDone,
}: {
  ids: string[]
  accent: string
  onTaught: (id: string) => void
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const item = COUNTRY_BY_ID[ids[i]]
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    onTaught(item.id)
    speak(`This is ${item.name}. Its capital is ${item.capital}.`)
    setTip(null)
    let alive = true
    mnemonicFor(item.id, `${item.capital} is the capital of ${item.name}`).then((t) => {
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
      <Header title={`Learn · ${i + 1}/${ids.length}`} onExit={onDone} exitLabel="Skip to quiz" />
      <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-1 flex-col items-center gap-3 p-5">
        <div className="overflow-hidden rounded-xl border border-white/20 shadow-lg">
          <Flag iso2={item.iso2} className="h-28 w-44" />
        </div>
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold">{item.name}</div>
          <div className="text-slate-300">
            Capital: <span className="font-bold text-white">{item.capital}</span>
          </div>
          <div className="text-xs text-slate-400">{item.continent}</div>
        </div>
        <button onClick={() => speak(`${item.name}. Capital, ${item.capital}.`)} className="btn rounded-full bg-white/10 px-4 py-1.5 text-sm">
          🔊 Say it
        </button>
        <WorldMap highlightIso2={item.iso2} accent={accent} />
        {tip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-brand-500/15 px-4 py-2 text-center text-sm text-brand-100">
            💡 {tip}
          </motion.div>
        )}
      </motion.div>
      <button onClick={next} className="btn mt-4 bg-brand-600 py-4 font-display text-xl">
        {i + 1 < ids.length ? 'Got it! Next' : "Let's quiz!"}
      </button>
    </div>
  )
}

// --- Quiz phase ---
interface Feedback {
  correct: boolean
  question: GeoQuestion
  chosen?: CountryItem
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
  const queueRef = useRef<GeoQuestion[]>(ids.map((id) => buildQuestion(id)))
  const requeued = useRef<Set<string>>(new Set())
  const [idx, setIdx] = useState(0)
  const tally = useRef({ reviewed: 0, correct: 0 })
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [wrongIso, setWrongIso] = useState<string | undefined>()

  const q = queueRef.current[idx]

  function answer(chosen: CountryItem | undefined) {
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
      if (q.mode === 'locate-on-map') setWrongIso(chosen?.iso2)
      // Re-queue a missed item once for extra reinforcement this session.
      if (!requeued.current.has(q.item.id)) {
        requeued.current.add(q.item.id)
        queueRef.current.push(buildQuestion(q.item.id, { allowMap: false }))
      }
      setFeedback({ correct, question: q, chosen, explanation: undefined })
      explainWrong(correctLabel(q.mode, q.item), chosen ? optionLabel(q.mode, chosen) : 'that').then((ex) =>
        setFeedback((f) => (f ? { ...f, explanation: ex } : f)),
      )
    }
  }

  function next() {
    setFeedback(null)
    setWrongIso(undefined)
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

        {q.mode === 'flag-to-country' && (
          <div className="mb-4 flex justify-center">
            <div className="overflow-hidden rounded-xl border border-white/20 shadow-lg">
              <Flag iso2={q.item.iso2} className="h-32 w-52" />
            </div>
          </div>
        )}

        {q.mode === 'locate-on-map' ? (
          <WorldMap interactive accent={accent} wrongIso2={wrongIso} onPick={(c) => answer(c)} />
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

function SessionDone({ newLearned, onExit }: { newLearned: number; onExit: () => void }) {
  useEffect(() => {
    bigCheer()
  }, [])
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl">🏆</div>
      <h2 className="font-display text-3xl font-extrabold">Quest Complete!</h2>
      <p className="text-slate-300">
        You learned {newLearned} new {newLearned === 1 ? 'place' : 'places'} and earned XP!
      </p>
      <button onClick={onExit} className="btn bg-brand-600 px-8 py-3 font-display text-lg">
        Back home
      </button>
    </div>
  )
}

function AllCaughtUp({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl">🌟</div>
      <h2 className="font-display text-2xl font-extrabold">All caught up!</h2>
      <p className="text-slate-300">Nothing to review right now. Come back later for more!</p>
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
