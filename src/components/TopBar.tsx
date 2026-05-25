import type { ProfileState } from '../types'
import { levelForXp } from '../state/store'

export function TopBar({ profile, onSwitch }: { profile: ProfileState; onSwitch: () => void }) {
  const { stats } = profile
  const level = stats.level || levelForXp(stats.xp)
  const intoLevel = stats.xp % 100
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={onSwitch} className="btn flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
        <span className="text-2xl" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}>
          {profile.profile.avatar}
        </span>
        <span className="font-display text-sm font-bold">{profile.profile.name}</span>
      </button>

      <div className="flex-1">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-bold">Lvl {level}</span>
          <span>{intoLevel}/100 XP</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
            style={{ width: `${intoLevel}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1.5">
        <span className="text-lg">🔥</span>
        <span className="font-display font-bold text-orange-300">{stats.streakDays}</span>
      </div>
    </div>
  )
}
