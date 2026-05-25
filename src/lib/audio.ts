// Read-aloud support using the browser's built-in speech synthesis. Helps an
// early reader (age ~7-9) and powers the spelling-bee mode later. No cost.

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Warm, natural-sounding voices, best first. The flat robotic default on many
// devices is what makes read-aloud feel harsh, so we prefer a friendlier one
// when the device has it and fall back gracefully otherwise.
const PREFERRED_VOICES = [
  'Google US English',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Samantha',
  'Karen',
  'Tessa',
  'Moira',
]

const WARM_HINT = /natural|google|samantha|aria|jenny|karen|tessa|moira|female/i

let cachedVoice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  if (!speechAvailable()) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  for (const name of PREFERRED_VOICES) {
    const match = voices.find((v) => v.name === name)
    if (match) return match
  }
  const warmEn = voices.find((v) => v.lang?.startsWith('en') && WARM_HINT.test(v.name))
  if (warmEn) return warmEn
  return voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang?.startsWith('en')) ?? voices[0]
}

function ensureVoice(): SpeechSynthesisVoice | null {
  if (!cachedVoice) cachedVoice = pickVoice()
  return cachedVoice
}

if (speechAvailable()) {
  // Voices load asynchronously in Chrome/Edge; re-pick once they arrive.
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = pickVoice()
  })
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}): void {
  if (!speechAvailable()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = opts.rate ?? 0.9 // a touch slower: warmer and easier for a young reader
  u.pitch = opts.pitch ?? 1.1 // a touch higher: friendlier, less flat
  u.volume = 1
  u.lang = 'en-US'
  const v = ensureVoice()
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}
