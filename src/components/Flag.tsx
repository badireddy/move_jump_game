interface FlagProps {
  iso2: string
  className?: string
}

// Flags are served as crisp SVGs from flagcdn. The PWA caches them after first
// view; a later phase can bundle them locally for full offline support.
export function Flag({ iso2, className }: FlagProps) {
  return (
    <img
      src={`https://flagcdn.com/${iso2}.svg`}
      alt=""
      draggable={false}
      loading="lazy"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  )
}
