import type { Continent, CountryItem } from '../../types'

// Curated starter set (~95 countries) with accurate capitals and ISO 3166-1
// alpha-2 codes (lowercase) used to render flags. Organised by continent so
// the game can teach one region at a time. Expanded toward all ~195 in a
// later phase. `mapName` is set only where the world map's label differs.
const raw: Omit<CountryItem, 'id'>[] = [
  // --- Europe ---
  { iso2: 'fr', name: 'France', capital: 'Paris', continent: 'Europe' },
  { iso2: 'de', name: 'Germany', capital: 'Berlin', continent: 'Europe' },
  { iso2: 'it', name: 'Italy', capital: 'Rome', continent: 'Europe' },
  { iso2: 'es', name: 'Spain', capital: 'Madrid', continent: 'Europe' },
  { iso2: 'pt', name: 'Portugal', capital: 'Lisbon', continent: 'Europe' },
  { iso2: 'gb', name: 'United Kingdom', capital: 'London', continent: 'Europe' },
  { iso2: 'ie', name: 'Ireland', capital: 'Dublin', continent: 'Europe' },
  { iso2: 'nl', name: 'Netherlands', capital: 'Amsterdam', continent: 'Europe' },
  { iso2: 'be', name: 'Belgium', capital: 'Brussels', continent: 'Europe' },
  { iso2: 'ch', name: 'Switzerland', capital: 'Bern', continent: 'Europe' },
  { iso2: 'at', name: 'Austria', capital: 'Vienna', continent: 'Europe' },
  { iso2: 'gr', name: 'Greece', capital: 'Athens', continent: 'Europe' },
  { iso2: 'no', name: 'Norway', capital: 'Oslo', continent: 'Europe' },
  { iso2: 'se', name: 'Sweden', capital: 'Stockholm', continent: 'Europe' },
  { iso2: 'fi', name: 'Finland', capital: 'Helsinki', continent: 'Europe' },
  { iso2: 'dk', name: 'Denmark', capital: 'Copenhagen', continent: 'Europe' },
  { iso2: 'is', name: 'Iceland', capital: 'Reykjavik', continent: 'Europe' },
  { iso2: 'pl', name: 'Poland', capital: 'Warsaw', continent: 'Europe' },
  { iso2: 'cz', name: 'Czechia', capital: 'Prague', continent: 'Europe', mapName: 'Czechia' },
  { iso2: 'hu', name: 'Hungary', capital: 'Budapest', continent: 'Europe' },
  { iso2: 'ro', name: 'Romania', capital: 'Bucharest', continent: 'Europe' },
  { iso2: 'ua', name: 'Ukraine', capital: 'Kyiv', continent: 'Europe' },
  { iso2: 'ru', name: 'Russia', capital: 'Moscow', continent: 'Europe' },
  { iso2: 'hr', name: 'Croatia', capital: 'Zagreb', continent: 'Europe' },
  { iso2: 'rs', name: 'Serbia', capital: 'Belgrade', continent: 'Europe' },
  { iso2: 'bg', name: 'Bulgaria', capital: 'Sofia', continent: 'Europe' },

  // --- Asia ---
  { iso2: 'cn', name: 'China', capital: 'Beijing', continent: 'Asia' },
  { iso2: 'jp', name: 'Japan', capital: 'Tokyo', continent: 'Asia' },
  { iso2: 'in', name: 'India', capital: 'New Delhi', continent: 'Asia' },
  { iso2: 'kr', name: 'South Korea', capital: 'Seoul', continent: 'Asia', mapName: 'South Korea' },
  { iso2: 'kp', name: 'North Korea', capital: 'Pyongyang', continent: 'Asia', mapName: 'North Korea' },
  { iso2: 'id', name: 'Indonesia', capital: 'Jakarta', continent: 'Asia' },
  { iso2: 'th', name: 'Thailand', capital: 'Bangkok', continent: 'Asia' },
  { iso2: 'vn', name: 'Vietnam', capital: 'Hanoi', continent: 'Asia' },
  { iso2: 'ph', name: 'Philippines', capital: 'Manila', continent: 'Asia' },
  { iso2: 'my', name: 'Malaysia', capital: 'Kuala Lumpur', continent: 'Asia' },
  { iso2: 'sg', name: 'Singapore', capital: 'Singapore', continent: 'Asia' },
  { iso2: 'pk', name: 'Pakistan', capital: 'Islamabad', continent: 'Asia' },
  { iso2: 'bd', name: 'Bangladesh', capital: 'Dhaka', continent: 'Asia' },
  { iso2: 'sa', name: 'Saudi Arabia', capital: 'Riyadh', continent: 'Asia' },
  { iso2: 'ir', name: 'Iran', capital: 'Tehran', continent: 'Asia' },
  { iso2: 'iq', name: 'Iraq', capital: 'Baghdad', continent: 'Asia' },
  { iso2: 'ae', name: 'United Arab Emirates', capital: 'Abu Dhabi', continent: 'Asia', mapName: 'United Arab Emirates' },
  { iso2: 'np', name: 'Nepal', capital: 'Kathmandu', continent: 'Asia' },
  { iso2: 'kz', name: 'Kazakhstan', capital: 'Astana', continent: 'Asia' },

  // --- Africa ---
  { iso2: 'eg', name: 'Egypt', capital: 'Cairo', continent: 'Africa' },
  { iso2: 'ng', name: 'Nigeria', capital: 'Abuja', continent: 'Africa' },
  { iso2: 'za', name: 'South Africa', capital: 'Pretoria', continent: 'Africa' },
  { iso2: 'ke', name: 'Kenya', capital: 'Nairobi', continent: 'Africa' },
  { iso2: 'et', name: 'Ethiopia', capital: 'Addis Ababa', continent: 'Africa' },
  { iso2: 'ma', name: 'Morocco', capital: 'Rabat', continent: 'Africa' },
  { iso2: 'dz', name: 'Algeria', capital: 'Algiers', continent: 'Africa' },
  { iso2: 'gh', name: 'Ghana', capital: 'Accra', continent: 'Africa' },
  { iso2: 'tz', name: 'Tanzania', capital: 'Dodoma', continent: 'Africa', mapName: 'Tanzania' },
  { iso2: 'ug', name: 'Uganda', capital: 'Kampala', continent: 'Africa' },
  { iso2: 'sn', name: 'Senegal', capital: 'Dakar', continent: 'Africa' },
  { iso2: 'tn', name: 'Tunisia', capital: 'Tunis', continent: 'Africa' },
  { iso2: 'ly', name: 'Libya', capital: 'Tripoli', continent: 'Africa' },
  { iso2: 'zw', name: 'Zimbabwe', capital: 'Harare', continent: 'Africa' },
  { iso2: 'mg', name: 'Madagascar', capital: 'Antananarivo', continent: 'Africa' },

  // --- North America ---
  { iso2: 'us', name: 'United States', capital: 'Washington, D.C.', continent: 'North America', mapName: 'United States of America' },
  { iso2: 'ca', name: 'Canada', capital: 'Ottawa', continent: 'North America' },
  { iso2: 'mx', name: 'Mexico', capital: 'Mexico City', continent: 'North America' },
  { iso2: 'cu', name: 'Cuba', capital: 'Havana', continent: 'North America' },
  { iso2: 'jm', name: 'Jamaica', capital: 'Kingston', continent: 'North America' },
  { iso2: 'gt', name: 'Guatemala', capital: 'Guatemala City', continent: 'North America' },
  { iso2: 'pa', name: 'Panama', capital: 'Panama City', continent: 'North America' },
  { iso2: 'cr', name: 'Costa Rica', capital: 'San José', continent: 'North America' },
  { iso2: 'hn', name: 'Honduras', capital: 'Tegucigalpa', continent: 'North America' },
  { iso2: 'do', name: 'Dominican Republic', capital: 'Santo Domingo', continent: 'North America', mapName: 'Dominican Rep.' },

  // --- South America ---
  { iso2: 'br', name: 'Brazil', capital: 'Brasília', continent: 'South America' },
  { iso2: 'ar', name: 'Argentina', capital: 'Buenos Aires', continent: 'South America' },
  { iso2: 'cl', name: 'Chile', capital: 'Santiago', continent: 'South America' },
  { iso2: 'pe', name: 'Peru', capital: 'Lima', continent: 'South America' },
  { iso2: 'co', name: 'Colombia', capital: 'Bogotá', continent: 'South America' },
  { iso2: 've', name: 'Venezuela', capital: 'Caracas', continent: 'South America' },
  { iso2: 'ec', name: 'Ecuador', capital: 'Quito', continent: 'South America' },
  { iso2: 'bo', name: 'Bolivia', capital: 'Sucre', continent: 'South America' },
  { iso2: 'py', name: 'Paraguay', capital: 'Asunción', continent: 'South America' },
  { iso2: 'uy', name: 'Uruguay', capital: 'Montevideo', continent: 'South America' },

  // --- Oceania ---
  { iso2: 'au', name: 'Australia', capital: 'Canberra', continent: 'Oceania' },
  { iso2: 'nz', name: 'New Zealand', capital: 'Wellington', continent: 'Oceania' },
  { iso2: 'fj', name: 'Fiji', capital: 'Suva', continent: 'Oceania' },
  { iso2: 'pg', name: 'Papua New Guinea', capital: 'Port Moresby', continent: 'Oceania' },
]

export const COUNTRIES: CountryItem[] = raw.map((c) => ({ ...c, id: `geo:${c.iso2.toUpperCase()}` }))

export const COUNTRY_BY_ID: Record<string, CountryItem> = Object.fromEntries(
  COUNTRIES.map((c) => [c.id, c]),
)

export const CONTINENTS: Continent[] = [
  'Europe',
  'Asia',
  'Africa',
  'North America',
  'South America',
  'Oceania',
]

export function countriesByContinent(continent: Continent): CountryItem[] {
  return COUNTRIES.filter((c) => c.continent === continent)
}

// Normalised matcher so a map feature label can be tied back to a country.
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

const NAME_INDEX: Record<string, CountryItem> = (() => {
  const idx: Record<string, CountryItem> = {}
  for (const c of COUNTRIES) {
    idx[normalizeName(c.name)] = c
    if (c.mapName) idx[normalizeName(c.mapName)] = c
  }
  return idx
})()

export function countryByMapName(name: string): CountryItem | undefined {
  return NAME_INDEX[normalizeName(name)]
}
