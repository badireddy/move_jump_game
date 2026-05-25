import confetti from 'canvas-confetti'

export function cheer(): void {
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, scalar: 0.9 })
}

export function bigCheer(): void {
  const end = Date.now() + 900
  const colors = ['#a78bfa', '#f472b6', '#fbbf24', '#34d399']
  ;(function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors })
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
