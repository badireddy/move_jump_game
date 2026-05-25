import { memo } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import usTopo from 'us-atlas/states-10m.json'
import type { StateItem } from '../types'
import { stateByMapName } from '../content/usstates/states'

// us-atlas ships a topojson whose first object is `states`, which is the layer
// react-simple-maps renders by default (same pattern as WorldMap).
interface UsMapProps {
  highlightCode?: string // filled in the accent colour (teach / correct)
  wrongCode?: string // flashed red (a wrong tap)
  onPick?: (state: StateItem | undefined, mapName: string) => void
  interactive?: boolean
  accent?: string
}

function UsMapBase({ highlightCode, wrongCode, onPick, interactive = false, accent = '#a78bfa' }: UsMapProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-slate-900/40">
      <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 950 }} width={800} height={480}>
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={usTopo as object}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = (geo.properties as { name: string }).name
                const state = stateByMapName(name)
                const code = state?.code
                const isHighlight = code && code === highlightCode
                const isWrong = code && code === wrongCode
                const fill = isWrong ? '#ef4444' : isHighlight ? accent : '#334155'
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={interactive ? () => onPick?.(state, name) : undefined}
                    style={{
                      default: { fill, stroke: '#0f172a', strokeWidth: 0.5, outline: 'none' },
                      hover: {
                        fill: interactive ? '#64748b' : fill,
                        stroke: '#0f172a',
                        strokeWidth: 0.5,
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

export const UsMap = memo(UsMapBase)
