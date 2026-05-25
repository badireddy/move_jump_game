import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './state/store'
import { ProfileSelect } from './screens/ProfileSelect'
import { Home } from './screens/Home'
import { GeographySession } from './screens/GeographySession'
import { StatesSession } from './screens/StatesSession'
import { Dashboard } from './screens/Dashboard'

type Screen = 'profiles' | 'home' | 'geography' | 'usstates' | 'dashboard'

export default function App() {
  const ready = useStore((s) => s.ready)
  const init = useStore((s) => s.init)
  const currentProfileId = useStore((s) => s.currentProfileId)
  const [screen, setScreen] = useState<Screen>('profiles')

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
              onPlayGeography={() => setScreen('geography')}
              onPlayStates={() => setScreen('usstates')}
              onOpenDashboard={() => setScreen('dashboard')}
              onSwitchProfile={() => setScreen('profiles')}
            />
          )}
          {!showProfiles && screen === 'geography' && <GeographySession onExit={() => setScreen('home')} />}
          {!showProfiles && screen === 'usstates' && <StatesSession onExit={() => setScreen('home')} />}
          {!showProfiles && screen === 'dashboard' && <Dashboard onBack={() => setScreen('home')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
