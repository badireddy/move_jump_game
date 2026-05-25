import { motion } from 'framer-motion'
import { useStore } from '../state/store'
import { TopBar } from '../components/TopBar'
import { COUNTRIES } from '../content/geography/countries'
import { topicProgress } from '../srs/engine'
import { BADGE_INFO } from '../content/badges'

interface HomeProps {
  onPlayGeography: () => void
  onOpenDashboard: () => void
  onSwitchProfile: () => void
}

const LOCKED_TOPICS = [
  { icon: '🔤', title: 'Spelling Bee', sub: 'Words & meanings' },
  { icon: '🦁', title: 'Nature', sub: 'Animals, birds & plants' },
  { icon: '🏛️', title: 'Greek Myths', sub: 'Gods, heroes & history' },
]

export function Home({ onPlayGeography, onOpenDashboard, onSwitchProfile }: HomeProps) {
  const current = useStore((s) => s.current())
  const family = useStore((s) => s.family)
  if (!current) return null

  const now = Date.now()
  const geo = topicProgress(current.cards.geography, COUNTRIES.length, now)
  const leaderboard = [...family.profiles].sort((a, b) => b.stats.xp - a.stats.xp)

  return (
    <div className="flex flex-1 flex-col">
      <TopBar profile={current} onSwitch={onSwitchProfile} />

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPlayGeography}
        className="card mt-2 overflow-hidden p-5 text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-brand-300">Today's Quest</div>
            <div className="font-display text-2xl font-extrabold">🌍 Geography</div>
            <div className="text-sm text-slate-300">Countries, capitals & flags</div>
          </div>
          <div className="rounded-full bg-brand-600 px-5 py-3 font-display text-lg font-bold">Play</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Learned" value={`${geo.introduced}/${geo.total}`} />
          <Stat label="Mastered" value={`${geo.mastered}`} />
          <Stat label="To review" value={`${geo.due}`} highlight={geo.due > 0} />
        </div>
      </motion.button>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {LOCKED_TOPICS.map((t) => (
          <div key={t.title} className="card flex items-center gap-3 p-4 opacity-60">
            <span className="text-3xl">{t.icon}</span>
            <div className="flex-1">
              <div className="font-display font-bold">{t.title}</div>
              <div className="text-xs text-slate-400">{t.sub}</div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Soon</span>
          </div>
        ))}
      </div>

      {leaderboard.length > 1 && (
        <div className="card mt-4 p-4">
          <div className="mb-2 font-display font-bold">🏆 Family Leaderboard</div>
          {leaderboard.map((p, i) => (
            <div key={p.profile.id} className="flex items-center gap-3 py-1.5">
              <span className="w-5 text-center font-bold text-slate-400">{i + 1}</span>
              <span className="text-2xl">{p.profile.avatar}</span>
              <span className="flex-1 font-semibold">{p.profile.name}</span>
              <span className="font-display font-bold text-brand-300">{p.stats.xp} XP</span>
            </div>
          ))}
        </div>
      )}

      {current.badges.length > 0 && (
        <div className="card mt-4 p-4">
          <div className="mb-2 font-display font-bold">Badges</div>
          <div className="flex flex-wrap gap-3">
            {current.badges.map((b) => (
              <div key={b} className="flex flex-col items-center" title={BADGE_INFO[b]?.title}>
                <span className="text-3xl">{BADGE_INFO[b]?.icon ?? '🏅'}</span>
                <span className="text-[10px] text-slate-400">{BADGE_INFO[b]?.title ?? b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onOpenDashboard} className="btn mt-4 mb-2 py-3 text-sm text-slate-300 underline-offset-2 hover:underline">
        Grown-up dashboard
      </button>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? 'bg-orange-500/20' : 'bg-white/5'}`}>
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  )
}
