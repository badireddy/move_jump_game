import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './state/store'
import type { SessionMode } from './types'
import { ProfileSelect } from './screens/ProfileSelect'
import { Home } from './screens/Home'
import { GeographySession } from './screens/GeographySession'
import { StatesSession } from './screens/StatesSession'
import { SpellingSession } from './screens/SpellingSession'
import { Review } from './screens/Review'
import { Dashboard } from './screens/Dashboard'

type Screen = 'profiles' | 'home' | 'geography' | 'usstates' | 'spelling' | 'review' | 'dashboard'

export default function App() {
  const ready = useStore((s) => s.ready)
  const init = useStore((s) => s.init)
  const currentProfileId = useStore((s) => s.currentProfileId)
  const [screen, setScreen] = useState<Screen>('profiles')
  const [mode, setMode] = useState<SessionMode>('daily')

  const startSession = (topic: 'geography' | 'usstates' | 'spelling', m: SessionMode) => {
    setMode(m)
    setScreen(topic)
  }

  useEffect(() => {
    void init()
  }, [init])

  if (!ready) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="animate-pulse text-4xl">🌍</div>
      </div>
    )
  }

  const showProfiles = screen === 'profiles' || !currentProfileId

  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        <motion.div
          key={showProfiles ? 'profiles' : screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex flex-1 flex-col"
        >
          {showProfiles && <ProfileSelect onReady={() => setScreen('home')} />}
          {!showProfiles && screen === 'home' && (
            <Home
              onPlayGeography={() => startSession('geography', 'daily')}
              onPlayStates={() => startSession('usstates', 'daily')}
              onPlaySpelling={() => startSession('spelling', 'daily')}
              onOpenReview={() => setScreen('review')}
              onOpenDashboard={() => setScreen('dashboard')}
              onSwitchProfile={() => setScreen('profiles')}
            />
          )}
          {!showProfiles && screen === 'geography' && <GeographySession mode={mode} onExit={() => setScreen('home')} />}
          {!showProfiles && screen === 'usstates' && <StatesSession mode={mode} onExit={() => setScreen('home')} />}
          {!showProfiles && screen === 'spelling' && <SpellingSession mode={mode} onExit={() => setScreen('home')} />}
          {!showProfiles && screen === 'review' && <Review onStart={startSession} onBack={() => setScreen('home')} />}
          {!showProfiles && screen === 'dashboard' && <Dashboard onBack={() => setScreen('home')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
