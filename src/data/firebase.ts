import type { FamilyData, Storage } from './storage'
import { EMPTY_FAMILY } from './storage'

// Cloud sync via Firestore. Both phones share data by using the same
// "family code" (the Firestore document id). The Firebase SDK is imported
// lazily so the app has zero cloud cost/weight when running local-only.

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

const FAMILY_CODE_KEY = 'learnquest:familyCode'

export function getFamilyCode(): string {
  let code = localStorage.getItem(FAMILY_CODE_KEY)
  if (!code) {
    code = randomCode()
    localStorage.setItem(FAMILY_CODE_KEY, code)
  }
  return code
}

export function setFamilyCode(code: string): void {
  localStorage.setItem(FAMILY_CODE_KEY, code.trim().toUpperCase())
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

export function readFirebaseConfig(): FirebaseConfig | null {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return null
  return cfg as FirebaseConfig
}

export async function createFirebaseAdapter(config: FirebaseConfig): Promise<Storage> {
  const { initializeApp } = await import('firebase/app')
  const { getAuth, signInAnonymously } = await import('firebase/auth')
  const { getFirestore, doc, getDoc, setDoc, onSnapshot } = await import('firebase/firestore')

  const app = initializeApp(config)
  const auth = getAuth(app)
  await signInAnonymously(auth)
  const db = getFirestore(app)
  const ref = doc(db, 'families', getFamilyCode())

  return {
    kind: 'cloud',
    async load(): Promise<FamilyData> {
      const snap = await getDoc(ref)
      return snap.exists() ? (snap.data() as FamilyData) : EMPTY_FAMILY
    },
    async save(data: FamilyData): Promise<void> {
      await setDoc(ref, data)
    },
    subscribe(cb: (data: FamilyData) => void): () => void {
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) cb(snap.data() as FamilyData)
      })
    },
  }
}
