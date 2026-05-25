import { useState } from 'react'
import { useStore } from '../state/store'
import type { SrsCard } from '../types'
import { COUNTRIES, COUNTRY_BY_ID, CONTINENTS, countriesByContinent } from '../content/geography/countries'
import { STATES, STATE_BY_ID } from '../content/usstates/states'
import { difficultyScore, isMastered } from '../srs/engine'
import { getFamilyCode, setFamilyCode } from '../data/firebase'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function accuracyOf(cards: SrsCard[]): number {
  let correct = 0
  let total = 0
  for (const c of cards) for (const h of c.history) { total++; if (h.correct) correct++ }
  return total ? Math.round((correct / total) * 100) : 0
}

export function Dashboard({ onBack }: { onBack: () => void }) {
  const family = useStore((s) => s.family)
  const storageKind = useStore((s) => s.storageKind)
  const [viewId, setViewId] = useState(family.profiles[0]?.profile.id)
  const [codeInput, setCodeInput] = useState('')
  const p = family.profiles.find((x) => x.profile.id === viewId) ?? family.profiles[0]
  if (!p) return null

  const geoCards = Object.values(p.cards.geography ?? {})
  const stateCards = Object.values(p.cards.usstates ?? {})
  const now = Date.now()

  // Answers in the last 7 days, across both topics.
  const weekReviews = [...geoCards, ...stateCards].reduce(
    (n, c) => n + c.history.filter((h) => h.t >= now - WEEK_MS).length,
    0,
  )

  // Hardest items across both topics, with the right lookup for each.
  const tricky = [
    ...geoCards.map((c) => ({ c, item: COUNTRY_BY_ID[c.itemId], icon: '🌍' })),
    ...stateCards.map((c) => ({ c, item: STATE_BY_ID[c.itemId], icon: '🇺🇸' })),
  ]
    .filter((x) => x.c.reps > 0 && x.item)
    .sort((a, b) => difficultyScore(b.c) - difficultyScore(a.c))
    .slice(0, 8)

  const geoByContinent = CONTINENTS.map((cont) => {
    const total = countriesByContinent(cont).length
    const cards = geoCards.filter((c) => COUNTRY_BY_ID[c.itemId]?.continent === cont)
    return { cont, total, introduced: cards.length, mastered: cards.filter(isMastered).length }
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between py-3">
        <h2 className="font-display text-2xl font-extrabold">Dashboard</h2>
        <button onClick={onBack} className="text-sm text-slate-400">Done</button>
      </div>

      {family.profiles.length > 1 && (
        <div className="mb-3 flex gap-2">
          {family.profiles.map((x) => (
            <button
              key={x.profile.id}
              onClick={() => setViewId(x.profile.id)}
              className={`btn rounded-full px-3 py-1.5 text-sm ${x.profile.id === p.profile.id ? 'bg-brand-600' : 'bg-white/10'}`}
            >
              {x.profile.avatar} {x.profile.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Overall accuracy" value={`${p.stats.totalReviews ? Math.round((p.stats.totalCorrect / p.stats.totalReviews) * 100) : 0}%`} />
        <Metric label="Day streak" value={`${p.stats.streakDays} 🔥`} />
        <Metric label="This week" value={`${weekReviews}`} />
        <Metric label="Sessions" value={`${p.stats.sessionsCompleted}`} />
      </div>

      <TopicCard
        icon="🌍"
        title="Geography"
        learned={geoCards.length}
        total={COUNTRIES.length}
        mastered={geoCards.filter(isMastered).length}
        accuracy={accuracyOf(geoCards)}
      />
      <div className="card -mt-1 mb-1 p-4 pt-2">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">By continent (mastered)</div>
        {geoByContinent.map((g) => (
          <div key={g.cont} className="flex items-center gap-2 py-1 text-sm">
            <span className="w-28 shrink-0 text-slate-300">{g.cont}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${g.total ? (g.mastered / g.total) * 100 : 0}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right text-slate-400">{g.mastered}/{g.total}</span>
          </div>
        ))}
      </div>

      <TopicCard
        icon="🇺🇸"
        title="US States"
        learned={stateCards.length}
        total={STATES.length}
        mastered={stateCards.filter(isMastered).length}
        accuracy={accuracyOf(stateCards)}
      />

      <div className="card mt-3 p-4">
        <div className="mb-2 font-display font-bold">🧠 Finding it tricky</div>
        {tricky.length === 0 && <div className="text-sm text-slate-400">No data yet — play a session!</div>}
        {tricky.map(({ c, item, icon }) => {
          const acc = c.history.length ? Math.round((c.history.filter((h) => h.correct).length / c.history.length) * 100) : 0
          return (
            <div key={c.itemId} className="flex items-center justify-between py-1.5 text-sm">
              <span>
                <span className="mr-1">{icon}</span>
                <span className="font-semibold">{item!.name}</span>
                <span className="text-slate-400"> · {item!.capital}</span>
              </span>
              <span className="text-slate-400">{acc}% · box {c.box}{c.lapses ? ` · ${c.lapses} slip` : ''}</span>
            </div>
          )
        })}
      </div>

      <div className="card mt-4 p-4 text-sm text-slate-300">
        <div className="font-display font-bold text-white">Sync</div>
        {storageKind === 'cloud' ? (
          <div className="mt-1 space-y-3">
            <p>
              Cloud sync is on. This device's Family Code:{' '}
              <span className="font-mono font-bold text-brand-300">{getFamilyCode()}</span>
            </p>
            <div>
              <label className="block text-xs text-slate-400">
                Add another phone or computer: enter that family's code to share the same progress.
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={12}
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 font-mono uppercase tracking-widest outline-none placeholder:tracking-normal placeholder:text-slate-500"
                />
                <button
                  onClick={() => {
                    const c = codeInput.trim()
                    if (c.length >= 6) {
                      setFamilyCode(c)
                      location.reload()
                    }
                  }}
                  className="btn rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white"
                >
                  Connect
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Use the same code everywhere. The page reloads to pull in the shared progress.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-1">Saving on this device only. Cloud sync turns on automatically once the Firebase config is set (see README).</p>
        )}
      </div>
    </div>
  )
}

function TopicCard({
  icon,
  title,
  learned,
  total,
  mastered,
  accuracy,
}: {
  icon: string
  title: string
  learned: number
  total: number
  mastered: number
  accuracy: number
}) {
  return (
    <div className="card mt-3 p-4">
      <div className="mb-2 font-display font-bold">{icon} {title}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Learned" value={`${learned}/${total}`} />
        <MiniStat label="Mastered" value={`${mastered}`} />
        <MiniStat label="Accuracy" value={`${accuracy}%`} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-2">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}
