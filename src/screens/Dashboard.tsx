import { useState } from 'react'
import { useStore } from '../state/store'
import { COUNTRY_BY_ID } from '../content/geography/countries'
import { difficultyScore, isMastered } from '../srs/engine'
import { getFamilyCode } from '../data/firebase'

export function Dashboard({ onBack }: { onBack: () => void }) {
  const family = useStore((s) => s.family)
  const storageKind = useStore((s) => s.storageKind)
  const [viewId, setViewId] = useState(family.profiles[0]?.profile.id)
  const p = family.profiles.find((x) => x.profile.id === viewId) ?? family.profiles[0]
  if (!p) return null

  const cards = Object.values(p.cards.geography)
  const reviewed = cards.filter((c) => c.reps > 0)
  const tricky = [...reviewed].sort((a, b) => difficultyScore(b) - difficultyScore(a)).slice(0, 8)
  const mastered = cards.filter(isMastered)
  const accuracy = p.stats.totalReviews ? Math.round((p.stats.totalCorrect / p.stats.totalReviews) * 100) : 0

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
        <Metric label="Accuracy" value={`${accuracy}%`} />
        <Metric label="Day streak" value={`${p.stats.streakDays} 🔥`} />
        <Metric label="Sessions" value={`${p.stats.sessionsCompleted}`} />
        <Metric label="Total answers" value={`${p.stats.totalReviews}`} />
        <Metric label="Countries learned" value={`${reviewed.length}`} />
        <Metric label="Mastered" value={`${mastered.length}`} />
      </div>

      <div className="card mt-4 p-4">
        <div className="mb-2 font-display font-bold">🧠 Finding it tricky</div>
        {tricky.length === 0 && <div className="text-sm text-slate-400">No data yet — play a session!</div>}
        {tricky.map((c) => {
          const item = COUNTRY_BY_ID[c.itemId]
          const acc = c.history.length ? Math.round((c.history.filter((h) => h.correct).length / c.history.length) * 100) : 0
          if (!item) return null
          return (
            <div key={c.itemId} className="flex items-center justify-between py-1.5 text-sm">
              <span>
                <span className="font-semibold">{item.name}</span>
                <span className="text-slate-400"> · {item.capital}</span>
              </span>
              <span className="text-slate-400">{acc}% · box {c.box}{c.lapses ? ` · ${c.lapses} slip` : ''}</span>
            </div>
          )
        })}
      </div>

      <div className="card mt-4 p-4 text-sm text-slate-300">
        <div className="font-display font-bold text-white">Sync</div>
        {storageKind === 'cloud' ? (
          <p className="mt-1">
            Cloud sync is on. Use this Family Code on another phone to share progress:{' '}
            <span className="font-mono font-bold text-brand-300">{getFamilyCode()}</span>
          </p>
        ) : (
          <p className="mt-1">Saving on this device only. Add Firebase keys to enable cross-phone sync (see README).</p>
        )}
      </div>
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
