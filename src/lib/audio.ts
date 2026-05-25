// Read-aloud support using the browser's built-in speech synthesis. Helps an
// early reader (age ~7-9) and powers the spelling-bee mode later. No cost.

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}): void {
  if (!speechAvailable()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = opts.rate ?? 0.95
  u.pitch = opts.pitch ?? 1.05
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}
