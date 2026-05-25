import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../state/store'
import { AVATARS, COLORS, randomAvatar } from '../lib/avatars'

export function ProfileSelect({ onReady }: { onReady: () => void }) {
  const family = useStore((s) => s.family)
  const createProfile = useStore((s) => s.createProfile)
  const selectProfile = useStore((s) => s.selectProfile)
  const [adding, setAdding] = useState(family.profiles.length === 0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(randomAvatar())
  const [color, setColor] = useState(COLORS[0])

  function choose(id: string) {
    selectProfile(id)
    onReady()
  }

  async function create() {
    if (!name.trim()) return
    await createProfile(name.trim(), avatar, color)
    onReady()
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="text-center">
        <div className="text-5xl">🌍✨</div>
        <h1 className="font-display mt-2 text-3xl font-extrabold">LearnQuest</h1>
        <p className="text-slate-300">Who's playing today?</p>
      </div>

      {!adding && (
        <div className="grid grid-cols-2 gap-3">
          {family.profiles.map((p) => (
            <motion.button
              key={p.profile.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => choose(p.profile.id)}
              className="card flex flex-col items-center gap-1 p-5"
              style={{ borderColor: p.profile.color }}
            >
              <span className="text-4xl">{p.profile.avatar}</span>
              <span className="font-display font-bold">{p.profile.name}</span>
              <span className="text-xs text-slate-400">🔥 {p.stats.streakDays} · Lvl {p.stats.level}</span>
            </motion.button>
          ))}
          <button
            onClick={() => setAdding(true)}
            className="card flex min-h-[112px] flex-col items-center justify-center gap-1 p-5 text-slate-300"
          >
            <span className="text-3xl">＋</span>
            <span className="text-sm font-semibold">Add player</span>
          </button>
        </div>
      )}

      {adding && (
        <div className="card flex flex-col gap-4 p-5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={14}
            className="rounded-xl bg-white/10 px-4 py-3 text-center font-display text-lg outline-none ring-brand-400 focus:ring-2"
          />
          <div className="flex flex-wrap justify-center gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`rounded-xl p-1 text-3xl ${avatar === a ? 'bg-white/20 ring-2 ring-brand-400' : ''}`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button
            onClick={create}
            disabled={!name.trim()}
            className="btn bg-brand-600 py-3 font-display text-lg disabled:opacity-40"
          >
            Let's go!
          </button>
          {family.profiles.length > 0 && (
            <button onClick={() => setAdding(false)} className="text-sm text-slate-400">
              Back
            </button>
          )}
        </div>
      )}
    </div>
  )
}
