export const AVATARS = ['🦊', '🐼', '🦄', '🐯', '🐙', '🦋', '🐢', '🦉', '🐝', '🐬', '🦖', '🐧']

export const COLORS = [
  '#f97316', // orange
  '#22c55e', // green
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#ec4899', // pink
  '#eab308', // yellow
]

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}
