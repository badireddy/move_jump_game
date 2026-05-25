import type { CountryItem, QuizMode } from '../../types'
import { COUNTRIES, COUNTRY_BY_ID } from './countries'

export type GeoMode = Extract<
  QuizMode,
  'flag-to-country' | 'country-to-capital' | 'capital-to-country' | 'locate-on-map'
>

export interface GeoQuestion {
  mode: GeoMode
  item: CountryItem
  options: CountryItem[] // 4 options for multiple-choice modes; empty for map mode
}

// Countries that are large/well-labelled enough to reliably tap on the world
// map. Used to keep "locate-on-map" winnable and not frustrating on a phone.
const LOCATABLE = new Set([
  'us', 'ca', 'mx', 'br', 'ar', 'cl', 'pe', 'co', 've', 'fr', 'de', 'it', 'es', 'pt', 'gb',
  'no', 'se', 'fi', 'pl', 'ua', 'ru', 'cn', 'jp', 'in', 'kr', 'kp', 'id', 'th', 'vn', 'sa',
  'ir', 'iq', 'kz', 'eg', 'ng', 'za', 'ke', 'et', 'ma', 'dz', 'ly', 'au', 'nz', 'pk', 'tr',
])

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 3 distractors, preferring the same continent so choices feel themed and fair.
function distractors(target: CountryItem, count = 3): CountryItem[] {
  const sameContinent = COUNTRIES.filter((c) => c.id !== target.id && c.continent === target.continent)
  const rest = COUNTRIES.filter((c) => c.id !== target.id && c.continent !== target.continent)
  return shuffle(sameContinent).concat(shuffle(rest)).slice(0, count)
}

const MC_MODES: GeoMode[] = ['flag-to-country', 'country-to-capital', 'capital-to-country']

function modeFor(item: CountryItem, allowMap: boolean): GeoMode {
  if (allowMap && LOCATABLE.has(item.iso2) && Math.random() < 0.3) return 'locate-on-map'
  return pick(MC_MODES)
}

export function buildQuestion(itemId: string, opts: { allowMap?: boolean } = {}): GeoQuestion {
  const item = COUNTRY_BY_ID[itemId]
  const mode = modeFor(item, opts.allowMap ?? true)
  if (mode === 'locate-on-map') return { mode, item, options: [] }
  const options = shuffle([item, ...distractors(item)])
  return { mode, item, options }
}

export function isLocatable(iso2: string): boolean {
  return LOCATABLE.has(iso2)
}
