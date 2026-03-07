import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useCrypto } from '../context/CryptoContext'
import type { SdJwtResult } from '../lib/sdJwt'
import { decodeJwtParts } from '../lib/crypto'

type Props = {
  dataType: string
  dataKey: string
  stepId: number
}

export function DataDisplay({ dataType, dataKey, stepId }: Props) {
  const crypto = useCrypto()

  const inner = (() => {
    switch (dataType) {
      case 'keys':
        return <KeysDisplay />
      case 'sd-jwt':
        return <SdJwtDisplay dataKey={dataKey} />
      case 'checklist':
        return <ChecklistDisplay dataKey={dataKey} stepId={stepId} />
      case 'split-table':
        return <SplitTableDisplay />
      case 'json':
        return <JsonSummaryDisplay crypto={crypto} />
      default:
        return <pre className="text-[#888] text-xs font-mono">No data</pre>
    }
  })()

  return (
    <div className="w-full max-w-full overflow-x-hidden [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_.break-all]:break-all">
      {inner}
    </div>
  )
}

// ─── Keys Display ────────────────────────────────────────────────────────────

function KeysDisplay() {
  const { keys, ready } = useCrypto()

  return (
    <div className="font-mono text-xs space-y-2">
      <div className="text-[#888] mb-3">All keys are ES256 (ECDSA P-256 + SHA-256) — ephemeral, generated in your browser</div>
      {ready && keys ? (
        <div className="space-y-2">
          {[
            { label: 'BT (Credential Provider)', kid: keys.credentialProvider.kid, color: '#6C5CE7' },
            { label: 'User', kid: keys.user.kid, color: '#74B9FF' },
            { label: 'AI Agent', kid: keys.agent.kid, color: '#A29BFE' },
            { label: 'Merchant', kid: keys.merchant.kid, color: '#55EFC4' },
          ].map(({ label, kid, color }) => (
            <div key={kid} className="flex items-center justify-between bg-[#111] border border-[#222] rounded px-3 py-2">
              <span style={{ color }} className="font-medium">{label}</span>
              <div className="flex items-center gap-3 text-[#888]">
                <span className="text-[#636E72]">EC P-256</span>
                <span>kid: <span className="text-[#55EFC4]">{kid}</span></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[#A29BFE] animate-pulse">Generating keypairs...</div>
      )}
      <div className="mt-3 text-[#636E72] border-t border-[#1a1a1a] pt-2">
        All keys are ephemeral — generated in your browser, never sent anywhere.<br />
        Algorithm: ES256 (ECDSA P-256 + SHA-256) — required by the VI spec.
      </div>
    </div>
  )
}

// ─── SD-JWT Display ──────────────────────────────────────────────────────────

type SdJwtTab = 'encoded' | 'decoded' | 'sd_hash'

function SdJwtDisplay({ dataKey }: { dataKey: string }) {
  const crypto = useCrypto()
  const [tab, setTab] = useState<SdJwtTab>('decoded')

  const credential = getCredential(crypto, dataKey)

  if (!crypto.ready || !credential) {
    return <div className="text-[#A29BFE] animate-pulse font-mono text-xs">Computing credential...</div>
  }

  const isPlainJwt = typeof credential === 'string'

  if (isPlainJwt) {
    return <PlainJwtDisplay jwt={credential} />
  }

  const sdJwt = credential as SdJwtResult

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#222]">
        {(['encoded', 'decoded', 'sd_hash'] as SdJwtTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-3 py-1.5 text-xs font-mono transition-colors',
              tab === t
                ? 'text-[#A29BFE] border-b-2 border-[#A29BFE] -mb-px'
                : 'text-[#888] hover:text-[#ccc]'
            )}
          >
            {t === 'sd_hash' ? 'sd_hash' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'encoded' && <EncodedTab encoded={sdJwt.encoded} />}
      {tab === 'decoded' && <DecodedTab jwt={sdJwt.jwt} disclosures={sdJwt.disclosures} />}
      {tab === 'sd_hash' && <SdHashTab sdHash={sdJwt.sdHash} />}
    </div>
  )
}

function PlainJwtDisplay({ jwt }: { jwt: string }) {
  const [tab, setTab] = useState<'encoded' | 'decoded'>('decoded')
  const parts = jwt.split('.')

  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-[#222]">
        {(['decoded', 'encoded'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-3 py-1.5 text-xs font-mono transition-colors',
              tab === t
                ? 'text-[#A29BFE] border-b-2 border-[#A29BFE] -mb-px'
                : 'text-[#888] hover:text-[#ccc]'
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'encoded' && (
        <div className="font-mono text-xs text-[#888] break-all bg-[#0d0d0d] p-3 rounded border border-[#1a1a1a] overflow-x-auto max-w-full">
          <span className="text-[#EB5757]">{parts[0]}</span>
          <span className="text-[#636E72]">.</span>
          <span className="text-[#74B9FF]">{parts[1].substring(0, 60)}...</span>
          <span className="text-[#636E72]">.</span>
          <span className="text-[#A29BFE]">{parts[2].substring(0, 20)}...</span>
        </div>
      )}
      {tab === 'decoded' && (() => {
        try {
          const { header, payload } = decodeJwtParts(jwt)
          return (
            <div className="space-y-2">
              <div className="text-[#636E72] text-xs font-mono mb-1">Header</div>
              <JsonBlock data={header} />
              <div className="text-[#636E72] text-xs font-mono mb-1 mt-2">Payload</div>
              <JsonBlock data={payload} />
            </div>
          )
        } catch {
          return <div className="text-[#888] text-xs">Could not decode JWT</div>
        }
      })()}
    </div>
  )
}

function EncodedTab({ encoded }: { encoded: string }) {
  const parts = encoded.split('~')
  const jwt = parts[0]
  const jwtParts = jwt.split('.')
  const disclosures = parts.slice(1)

  return (
    <div className="font-mono text-xs bg-[#0d0d0d] p-3 rounded border border-[#1a1a1a] space-y-2 overflow-x-auto max-w-full">
      <div className="break-all">
        <span className="text-[#EB5757]">{jwtParts[0]}</span>
        <span className="text-[#636E72]">.</span>
        <span className="text-[#74B9FF]">{jwtParts[1]?.substring(0, 80)}...</span>
        <span className="text-[#636E72]">.</span>
        <span className="text-[#A29BFE]">{jwtParts[2]?.substring(0, 20)}...</span>
      </div>
      {disclosures.length > 0 && (
        <div className="border-t border-[#1a1a1a] pt-2 space-y-1">
          {disclosures.map((d, i) => (
            <div key={i} className="text-[#636E72] break-all">
              ~<span className="text-[#55EFC4]">{d.substring(0, 40)}...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DecodedTab({ jwt, disclosures }: { jwt: string; disclosures: string[] }) {
  let header: Record<string, unknown> = {}
  let payload: Record<string, unknown> = {}

  try {
    const parts = decodeJwtParts(jwt)
    header = parts.header
    payload = parts.payload
  } catch {
    return <div className="text-[#888] text-xs font-mono">Could not decode JWT</div>
  }

  // Decode disclosures
  const decodedDisclosures: Array<{ key: string; value: unknown }> = []
  for (const d of disclosures) {
    try {
      const padded = d.replace(/-/g, '+').replace(/_/g, '/').padEnd(d.length + (4 - d.length % 4) % 4, '=')
      const json = JSON.parse(atob(padded))
      if (Array.isArray(json) && json.length >= 3) {
        decodedDisclosures.push({ key: json[1], value: json[2] })
      }
    } catch { /* skip */ }
  }

  return (
    <div className="space-y-3 font-mono text-xs">
      <div>
        <div className="text-[#636E72] mb-1">Header</div>
        <JsonBlock data={header} />
      </div>
      <div>
        <div className="text-[#636E72] mb-1">Payload (always visible)</div>
        <JsonBlock data={payload} highlightSd />
      </div>
      {decodedDisclosures.length > 0 && (
        <div>
          <div className="text-[#636E72] mb-1">
            Selectively disclosable claims
            <span className="ml-2 text-[#FD9644]">~{decodedDisclosures.length} disclosure{decodedDisclosures.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {decodedDisclosures.map(({ key, value }) => (
              <div key={key} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-2">
                <span className="text-[#A29BFE]">{key}</span>
                <span className="text-[#636E72]">: </span>
                <JsonInline value={value} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SdHashTab({ sdHash }: { sdHash?: string }) {
  return (
    <div className="font-mono text-xs space-y-3">
      <div className="text-[#888]">sd_hash computation:</div>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3 space-y-2">
        <div className="text-[#636E72]">sd_hash = B64U(SHA-256(serialized_credential))</div>
        <div className="mt-2 text-[#888]">Value:</div>
        {sdHash ? (
          <div className="text-[#55EFC4] break-all">{sdHash}</div>
        ) : (
          <div className="text-[#636E72]">(no sd_hash — root credential)</div>
        )}
      </div>
      <div className="text-[#636E72] text-xs">
        This hash cryptographically binds the chain. Tamper with any parent credential and this hash breaks.
      </div>
    </div>
  )
}

// ─── Checklist Display ───────────────────────────────────────────────────────

const MERCHANT_CHECKLIST = [
  { label: 'L1 signature valid (BT\'s key — JWKS endpoint)', ok: true },
  { label: 'L2 signed by key in L1 cnf.jwk (user\'s key)', ok: true },
  { label: 'L2 typ: kb-sd-jwt+kb ✓', ok: true },
  { label: 'sd_hash(L2) = hash(L1) ✓', ok: true },
  { label: 'L3b signed by key matching L2 mandate cnf.kid (agent\'s key)', ok: true },
  { label: 'L3b typ: kb-sd-jwt ✓', ok: true },
  { label: 'sd_hash(L3b) = hash(L2 base + checkout + item disclosures) ✓', ok: true },
  { label: 'L3b payload contains NO cnf claim ✓ (terminal delegation)', ok: true },
  { label: 'checkout_jwt contents match merchant\'s own catalog records', ok: true },
  { label: 'checkout_hash = B64U(SHA-256(checkout_jwt)) recomputed ✓', ok: true },
  { label: 'Credential not expired ✓', ok: true },
  { label: 'CHECKOUT VERIFIED', ok: true, final: true },
]

const NETWORK_CHECKLIST = [
  { label: 'L1 signature valid (BT\'s key)', ok: true },
  { label: 'L2 signed by key in L1 cnf.jwk ✓', ok: true },
  { label: 'L2 typ: kb-sd-jwt+kb ✓', ok: true },
  { label: 'sd_hash(L2) = hash(L1) ✓', ok: true },
  { label: 'L3a signed by key matching L2 mandate cnf.kid (agent\'s key)', ok: true },
  { label: 'L3a typ: kb-sd-jwt ✓', ok: true },
  { label: 'sd_hash(L3a) = hash(L2 base + payment + merchant disclosures) ✓', ok: true },
  { label: 'L3a payload contains NO cnf claim ✓', ok: true },
  { label: 'Amount: $199.00 ≤ ceiling $250.00 ✓', ok: true },
  { label: 'Currency: USD ✓', ok: true },
  { label: 'Merchant category: electronics ✓', ok: true },
  { label: 'Payee: electronics-store-demo (in allowed_merchants) ✓', ok: true },
  { label: 'One L3 per mandate pair — not replayed ✓', ok: true },
  { label: 'Credential not expired ✓', ok: true },
  { label: 'BT Vault: tok_demo_4242 → BT Vault → [Mastercard network] (PAN never exposed)', ok: true },
  { label: 'PAYMENT AUTHORIZED', ok: true, final: true },
]

type CheckItem = { label: string; ok: boolean; final?: boolean }

function ChecklistDisplay({ dataKey, stepId }: { dataKey: string; stepId: number }) {
  const items: CheckItem[] = dataKey === 'verifyMerchant' ? MERCHANT_CHECKLIST : NETWORK_CHECKLIST
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    setVisible(0)
    let current = 0
    const interval = setInterval(() => {
      current++
      setVisible(current)
      if (current >= items.length) clearInterval(interval)
    }, 100)
    return () => clearInterval(interval)
  }, [stepId, items.length])

  const title = dataKey === 'verifyMerchant'
    ? 'Verifying L3b (Checkout Mandate)...'
    : 'Verifying L3a (Payment Mandate)...'
  const summaryLabel = dataKey === 'verifyMerchant'
    ? ['What the merchant sees: cart contents ✓', 'What the merchant cannot see: payment details ✗']
    : ['What the network sees: payment details ✓', 'What the network cannot see: checkout contents ✗']

  return (
    <div className="font-mono text-xs space-y-1">
      <div className="text-[#888] mb-3">{title}</div>
      {items.slice(0, visible).map((item, i) => (
        <div
          key={i}
          className={clsx(
            'checklist-item flex items-start gap-2 py-0.5',
            item.final ? 'mt-3 pt-3 border-t border-[#222]' : ''
          )}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <span className="text-[#55EFC4] shrink-0">✅</span>
          <span className={item.final ? 'text-[#55EFC4] font-semibold' : 'text-[#ccc]'}>
            {item.label}
          </span>
        </div>
      ))}
      {visible >= items.length && (
        <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-1 text-[#888]">
          {summaryLabel.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  )
}

// ─── Split Table Display ─────────────────────────────────────────────────────

function SplitTableDisplay() {
  const rows = [
    { label: 'What they received', merchant: 'L3b', network: 'L3a' },
    { label: 'What they saw', merchant: 'cart contents', network: 'payment amount + method' },
    { label: 'What was hidden', merchant: 'payment details ✗', network: 'cart contents ✗' },
    { label: 'Who signed it', merchant: 'agent (verified)', network: 'agent (verified)' },
    { label: 'Chain rooted in', merchant: 'BT L1', network: 'BT L1' },
    { label: 'Card number seen', merchant: 'NO', network: 'NO (token only)' },
  ]

  return (
    <div className="font-mono text-xs space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#222]">
              <th className="text-left py-2 pr-4 text-[#636E72] font-normal w-1/3"></th>
              <th className="text-left py-2 px-3 text-[#55EFC4] font-medium">MERCHANT</th>
              <th className="text-left py-2 px-3 text-[#6C5CE7] font-medium">PAYMENT NETWORK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="border-b border-[#111] hover:bg-[#0d0d0d] transition-colors">
                <td className="py-2 pr-4 text-[#636E72]">{row.label}</td>
                <td className="py-2 px-3 text-[#ccc]">{row.merchant}</td>
                <td className="py-2 px-3 text-[#ccc]">{row.network}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3 space-y-1 text-[#888]">
        <div className="text-[#f0f0f0] font-medium mb-2">The card number (PAN) never left BT Vault.</div>
        <div>The agent never held it.</div>
        <div>The merchant never held it.</div>
        <div>The payment network received a token — BT resolved it.</div>
        <div className="mt-2 text-[#A29BFE]">One cryptographic chain. Zero leakage.</div>
      </div>
    </div>
  )
}

// ─── JSON Summary Display ────────────────────────────────────────────────────

function JsonSummaryDisplay({ crypto: _crypto }: { crypto: ReturnType<typeof useCrypto> }) {
  const summary = {
    status: 'COMPLETE',
    item: 'Sony WH-1000XM5',
    amount_charged_usd: 199.00,
    credential_chain: {
      L1: 'issued by BT Vault ✓',
      L2: 'signed by User ✓',
      L3a: 'signed by Agent → verified by Payment Network ✓',
      L3b: 'signed by Agent → verified by Merchant ✓',
    },
    selective_disclosure: {
      merchant_saw_payment_details: false,
      network_saw_checkout_details: false,
      agent_held_pan: false,
      merchant_held_pan: false,
    },
    pan_resolved_by: 'BT Vault',
    protocol: 'Verifiable Intent v0.1-draft',
  }

  return <JsonBlock data={summary} />
}

// ─── JSON Renderer ───────────────────────────────────────────────────────────

function JsonBlock({ data, highlightSd }: { data: unknown; highlightSd?: boolean }) {
  return (
    <pre className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3 overflow-x-auto text-xs leading-relaxed font-mono">
      <JsonValue value={data} indent={0} highlightSd={highlightSd} />
    </pre>
  )
}

function JsonValue({ value, indent, highlightSd }: { value: unknown; indent: number; highlightSd?: boolean }): JSX.Element {
  if (value === null) return <span className="text-[#74B9FF]">null</span>
  if (typeof value === 'boolean') return <span className="text-[#74B9FF]">{String(value)}</span>
  if (typeof value === 'number') return <span className="text-[#FD9644]">{value}</span>
  if (typeof value === 'string') {
    // Check if it looks like a base64url hash
    if (highlightSd && value.length > 40 && /^[A-Za-z0-9_-]+$/.test(value)) {
      return (
        <span className="text-[#636E72]">
          &quot;{value.substring(0, 20)}...&quot;
          <span className="ml-1 text-[#444] text-[10px]">ⓘ</span>
        </span>
      )
    }
    return <span className="text-[#55EFC4]">&quot;{value}&quot;</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-[#888]">[]</span>
    const pad = '  '.repeat(indent + 1)
    const closePad = '  '.repeat(indent)
    return (
      <>
        <span className="text-[#888]">[</span>
        {value.map((v, i) => (
          <span key={i}>
            {'\n'}{pad}
            <JsonValue value={v} indent={indent + 1} highlightSd={highlightSd} />
            {i < value.length - 1 && <span className="text-[#888]">,</span>}
          </span>
        ))}
        {'\n'}{closePad}<span className="text-[#888]">]</span>
      </>
    )
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return <span className="text-[#888]">{'{}'}</span>
    const pad = '  '.repeat(indent + 1)
    const closePad = '  '.repeat(indent)
    return (
      <>
        <span className="text-[#888]">{'{'}</span>
        {entries.map(([k, v], i) => {
          const isSdKey = k === '_sd'
          return (
            <span key={k}>
              {'\n'}{pad}
              <span className={isSdKey ? 'text-[#636E72]' : 'text-[#A29BFE]'}>
                &quot;{k}&quot;
              </span>
              <span className="text-[#888]">: </span>
              <JsonValue value={v} indent={indent + 1} highlightSd={highlightSd || isSdKey} />
              {i < entries.length - 1 && <span className="text-[#888]">,</span>}
            </span>
          )
        })}
        {'\n'}{closePad}<span className="text-[#888]">{'}'}</span>
      </>
    )
  }
  return <span className="text-[#888]">{String(value)}</span>
}

function JsonInline({ value }: { value: unknown }): JSX.Element {
  if (typeof value === 'string') return <span className="text-[#55EFC4]">&quot;{value}&quot;</span>
  if (typeof value === 'number') return <span className="text-[#FD9644]">{value}</span>
  if (typeof value === 'boolean') return <span className="text-[#74B9FF]">{String(value)}</span>
  return <span className="text-[#888]">{JSON.stringify(value)}</span>
}

// ─── Helper to get credential from context ────────────────────────────────────

function getCredential(crypto: ReturnType<typeof useCrypto>, dataKey: string): SdJwtResult | string | null {
  switch (dataKey) {
    case 'L1': return crypto.L1
    case 'L2': return crypto.L2
    case 'L3a': return crypto.L3a
    case 'L3b': return crypto.L3b
    case 'checkoutJwt': return crypto.checkoutJwt
    default: return null
  }
}
