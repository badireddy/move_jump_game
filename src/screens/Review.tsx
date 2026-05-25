import { useStore } from '../state/store'
import type { SessionMode, SrsCard } from '../types'
import { COUNTRY_BY_ID } from '../content/geography/countries'
import { STATE_BY_ID } from '../content/usstates/states'
import { difficultyScore, hasMistake } from '../srs/engine'

type ReviewTopic = 'geography' | 'usstates'

interface ReviewProps {
  onStart: (topic: ReviewTopic, mode: SessionMode) => void
  onBack: () => void
}

interface TopicConf {
  id: ReviewTopic
  label: string
  cards: Record<string, SrsCard>
  lookup: (id: string) => { name: string; capital: string } | undefined
}

export function Review({ onStart, onBack }: ReviewProps) {
  const current = useStore((s) => s.current())
  if (!current) return null

  const topics: TopicConf[] = [
    { id: 'geography', label: '🌍 Geography', cards: current.cards.geography ?? {}, lookup: (id) => COUNTRY_BY_ID[id] },
    { id: 'usstates', label: '🇺🇸 US States', cards: current.cards.usstates ?? {}, lookup: (id) => STATE_BY_ID[id] },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between py-3">
        <h2 className="font-display text-2xl font-extrabold">Review &amp; Practice</h2>
        <button onClick={onBack} className="text-sm text-slate-400">Done</button>
      </div>
      <p className="mb-3 text-sm text-slate-300">
        Go back over anything you've learned — including older sessions — or drill the ones you've missed.
      </p>

      {topics.map((t) => (
        <TopicReview key={t.id} conf={t} onStart={onStart} />
      ))}
    </div>
  )
}

function TopicReview({ conf, onStart }: { conf: TopicConf; onStart: ReviewProps['onStart'] }) {
  const cards = Object.values(conf.cards)
  const learned = cards.length
  const mistakes = cards.filter(hasMistake).sort((a, b) => difficultyScore(b) - difficultyScore(a))

  return (
    <div className="card mb-3 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">{conf.label}</div>
        <div className="text-xs text-slate-400">{learned} learned · {mistakes.length} to fix</div>
      </div>

      {learned === 0 ? (
        <p className="text-sm text-slate-400">Nothing learned here yet — play a session first.</p>
      ) : (
        <>
          <button
            onClick={() => onStart(conf.id, 'study')}
            className="btn mb-2 w-full bg-white/10 py-2.5 font-semibold text-white"
          >
            📖 Go through the clues
          </button>
          <div className="flex gap-2">
            <button onClick={() => onStart(conf.id, 'review')} className="btn flex-1 bg-brand-600 py-2.5 font-semibold text-white">
              📝 Quiz all
            </button>
            <button
              disabled={mistakes.length === 0}
              onClick={() => onStart(conf.id, 'mistakes')}
              className={`btn flex-1 py-2.5 font-semibold ${mistakes.length ? 'bg-orange-500/80 text-white' : 'bg-white/10 text-slate-500'}`}
            >
              🎯 Mistakes{mistakes.length ? ` (${mistakes.length})` : ''}
            </button>
          </div>

          {mistakes.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Ones you've missed</div>
              {mistakes.slice(0, 10).map((c) => {
                const item = conf.lookup(c.itemId)
                if (!item) return null
                const acc = c.history.length
                  ? Math.round((c.history.filter((h) => h.correct).length / c.history.length) * 100)
                  : 0
                return (
                  <div key={c.itemId} className="flex items-center justify-between py-1.5 text-sm">
                    <span>
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-slate-400"> · {item.capital}</span>
                    </span>
                    <span className="text-slate-400">{acc}%{c.lapses ? ` · ${c.lapses} slip` : ''}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
