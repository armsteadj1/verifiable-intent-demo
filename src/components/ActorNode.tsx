import clsx from 'clsx'
import type { ActorId } from '../data/steps'
import type { DemoMode } from '../App'

type ActorConfig = {
  label: string
  sublabel: string
  icon: string
  color: string
  description: string
}

export const ACTOR_CONFIGS: Record<ActorId, ActorConfig> = {
  bt: {
    label: 'Credential Provider',
    sublabel: 'Basis Theory / Apple Pay',
    icon: '🔐',
    color: '#6C5CE7',
    description: 'Issues L1, hosts wallet, holds payment_instrument token. The root of the trust chain.',
  },
  user: {
    label: 'User',
    sublabel: 'You',
    icon: '👤',
    color: '#74B9FF',
    description: 'Creates L2, sets spend constraints, binds agent key, owns card',
  },
  agent: {
    label: 'Agent',
    sublabel: 'AI Shopping Agent',
    icon: '🤖',
    color: '#A29BFE',
    description: 'Creates L3a + L3b, acts within L2 constraints',
  },
  merchant: {
    label: 'Merchant',
    sublabel: 'Nike / Amazon',
    icon: '🛒',
    color: '#55EFC4',
    description: 'Receives L3b, verifies checkout mandate + delegation chain',
  },
  network: {
    label: 'Payment Network',
    sublabel: 'Visa / Mastercard',
    icon: '💳',
    color: '#6C5CE7',
    description: 'Receives L3a, verifies payment mandate + constraint satisfaction',
  },
}

const MACHINE_ACTOR_CONFIGS: Record<ActorId, ActorConfig> = {
  bt: {
    label: 'BT / PSP',
    sublabel: 'Control Layer',
    icon: '🔐',
    color: '#6C5CE7',
    description: 'Holds credentials, enforces policy, records audit, and abstracts settlement rails.',
  },
  user: {
    label: 'Business',
    sublabel: 'Spend Owner',
    icon: '🏢',
    color: '#74B9FF',
    description: 'Creates the authorized spend limit and delegates bounded authority to the agent.',
  },
  agent: {
    label: 'Agent',
    sublabel: 'Risk Research',
    icon: '🤖',
    color: '#A29BFE',
    description: 'Consumes paid resources and signs VIUs inside the ASL.',
  },
  merchant: {
    label: 'Merchant/API',
    sublabel: 'Supplier Data',
    icon: '📡',
    color: '#55EFC4',
    description: 'Returns 402 challenges, verifies VIUs locally, and redeems the latest cumulative tab.',
  },
  network: {
    label: 'Network',
    sublabel: 'Mastercard',
    icon: '💳',
    color: '#FD9644',
    description: 'Validates the authority chain and settlement guarantee at redemption time.',
  },
}

type Props = {
  id: ActorId
  isActive: boolean
  allGlow?: boolean
  position: { x: number; y: number }
  mode?: DemoMode
}

export function ActorNode({ id, isActive, allGlow, position, mode = 'vi' }: Props) {
  const config = mode === 'machine' ? MACHINE_ACTOR_CONFIGS[id] : ACTOR_CONFIGS[id]
  const active = isActive || allGlow

  return (
    <div
      className={clsx(
        'absolute flex flex-col items-center gap-1 transition-all duration-200 group',
        active ? 'opacity-100' : 'opacity-25',
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 px-2 py-1 text-xs rounded bg-[#1a1a1a] border border-[#333] text-[#888] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ maxWidth: 200 }}>
        {config.description}
      </div>

      {/* Node circle */}
      <div
        className={clsx(
          'w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all duration-300',
          allGlow && 'animate-pulse-glow',
        )}
        style={{
          borderColor: active ? config.color : '#222',
          boxShadow: active ? `0 0 ${allGlow ? '24px' : '12px'} ${config.color}40` : 'none',
          backgroundColor: '#111',
        }}
      >
        {config.icon}
      </div>

      {/* Label */}
      <div className="flex flex-col items-center gap-0.5" style={{ maxWidth: 90 }}>
        <span
          className="text-xs font-mono text-center leading-tight"
          style={{ color: active ? config.color : '#3a3a3a' }}
        >
          {config.label}
        </span>
        <span
          className="text-[10px] font-mono text-center leading-tight"
          style={{ color: active ? `${config.color}99` : '#2a2a2a' }}
        >
          {config.sublabel}
        </span>
      </div>
    </div>
  )
}
