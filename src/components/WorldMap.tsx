import { memo } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import worldTopo from 'world-atlas/countries-110m.json'
import type { CountryItem } from '../types'
import { countryByMapName } from '../content/geography/countries'

interface WorldMapProps {
  highlightIso2?: string // filled in the accent colour (teach / correct)
  wrongIso2?: string // flashed red (a wrong tap)
  onPick?: (country: CountryItem | undefined, mapName: string) => void
  interactive?: boolean
  accent?: string
}

function WorldMapBase({ highlightIso2, wrongIso2, onPick, interactive = false, accent = '#a78bfa' }: WorldMapProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-slate-900/40">
      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 195 }} width={800} height={520}>
        <ZoomableGroup center={[10, 10]} zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={worldTopo as object}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = (geo.properties as { name: string }).name
                const country = countryByMapName(name)
                const iso2 = country?.iso2
                const isHighlight = iso2 && iso2 === highlightIso2
                const isWrong = iso2 && iso2 === wrongIso2
                const fill = isWrong ? '#ef4444' : isHighlight ? accent : '#334155'
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={interactive ? () => onPick?.(country, name) : undefined}
                    style={{
                      default: { fill, stroke: '#0f172a', strokeWidth: 0.4, outline: 'none' },
                      hover: {
                        fill: interactive ? '#64748b' : fill,
                        stroke: '#0f172a',
                        strokeWidth: 0.4,
                        outline: 'none',
                        cursor: interactive ? 'pointer' : 'default',
                      },
                      pressed: { fill: accent, outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}

export const WorldMap = memo(WorldMapBase)
