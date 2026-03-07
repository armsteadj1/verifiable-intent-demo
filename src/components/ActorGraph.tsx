import type { ActorId } from '../data/steps'
import { ActorNode } from './ActorNode'
import { ConnectionLine } from './ConnectionLine'

type Position = { x: number; y: number }

const POSITIONS: Record<ActorId, Position> = {
  bt: { x: 100, y: 70 },
  user: { x: 280, y: 70 },
  agent: { x: 190, y: 160 },
  merchant: { x: 280, y: 250 },
  network: { x: 100, y: 250 },
}

type Props = {
  activeActors: ActorId[]
  activeConnection: [ActorId, ActorId] | null
  allGlow?: boolean
}

export function ActorGraph({ activeActors, activeConnection, allGlow }: Props) {
  return (
    <div className="relative bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg" style={{ width: 380, height: 320 }}>
      <ConnectionLine
        positions={POSITIONS}
        activeConnection={activeConnection}
        activeActors={activeActors}
      />
      {(Object.keys(POSITIONS) as ActorId[]).map(id => (
        <ActorNode
          key={id}
          id={id}
          isActive={activeActors.includes(id)}
          allGlow={allGlow}
          position={POSITIONS[id]}
        />
      ))}
    </div>
  )
}
