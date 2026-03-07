import type { ActorId } from '../data/steps'

type Position = { x: number; y: number }

type ConnectionDef = {
  from: ActorId
  to: ActorId
}

export const CONNECTIONS: ConnectionDef[] = [
  { from: 'bt', to: 'user' },
  { from: 'user', to: 'agent' },
  { from: 'agent', to: 'merchant' },
  { from: 'agent', to: 'network' },
  { from: 'bt', to: 'merchant' },
  { from: 'bt', to: 'network' },
]

type Props = {
  positions: Record<ActorId, Position>
  activeConnection: [ActorId, ActorId] | null
  activeActors: ActorId[]
}

export function ConnectionLine({ positions, activeConnection, activeActors }: Props) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#444" />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#A29BFE" />
        </marker>
      </defs>

      {CONNECTIONS.map(({ from, to }) => {
        const fromPos = positions[from]
        const toPos = positions[to]
        const isActive =
          activeConnection &&
          ((activeConnection[0] === from && activeConnection[1] === to) ||
           (activeConnection[0] === to && activeConnection[1] === from))
        const isRelated =
          activeActors.includes(from) && activeActors.includes(to)

        // Offset endpoints to account for node radius
        const dx = toPos.x - fromPos.x
        const dy = toPos.y - fromPos.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const nx = dx / len
        const ny = dy / len
        const r = 28 // node radius
        const x1 = fromPos.x + nx * r
        const y1 = fromPos.y + ny * r
        const x2 = toPos.x - nx * (r + 6)
        const y2 = toPos.y - ny * (r + 6)

        if (isActive) {
          return (
            <g key={`${from}-${to}`}>
              {/* Background line */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#A29BFE"
                strokeWidth="1.5"
                strokeOpacity="0.3"
                markerEnd="url(#arrowhead-active)"
              />
              {/* Animated traveling dash */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#A29BFE"
                strokeWidth="2"
                strokeDasharray="8 12"
                strokeOpacity="0.9"
                markerEnd="url(#arrowhead-active)"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="100"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          )
        }

        if (isRelated) {
          return (
            <line
              key={`${from}-${to}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#333"
              strokeWidth="1"
              strokeDasharray="4 4"
              markerEnd="url(#arrowhead)"
            />
          )
        }

        return (
          <line
            key={`${from}-${to}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#1a1a1a"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )
      })}
    </svg>
  )
}
