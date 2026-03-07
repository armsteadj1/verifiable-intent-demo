import { useState } from 'react'
import { useEffect } from 'react'

export function Header() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header className="border-b border-[#1a1a1a] bg-[#090909] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-mono font-semibold text-[#f0f0f0] tracking-wider text-sm">
            VERIFIABLE INTENT DEMO
          </h1>
          <span className="text-xs font-mono text-[#636E72] border border-[#1a1a1a] rounded px-2 py-0.5">
            Autonomous Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* BT Badge */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#6C5CE7] border border-[#6C5CE710] bg-[#6C5CE708] rounded px-2 py-1">
            <span className="text-base">💳</span>
            <span className="font-medium">Basis Theory</span>
          </div>

          {/* Help button */}
          <button
            onClick={() => setShowModal(true)}
            className="w-7 h-7 rounded-full border border-[#333] text-[#888] text-xs font-mono hover:border-[#555] hover:text-[#ccc] transition-colors flex items-center justify-center"
          >
            ?
          </button>
        </div>
      </header>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#111] border border-[#222] rounded-lg p-6 max-w-md mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-mono text-[#f0f0f0] font-semibold">About This Demo</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#888] hover:text-[#ccc] text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#888] font-sans leading-relaxed">
              <p>
                <strong className="text-[#f0f0f0]">Verifiable Intent</strong> is a protocol for AI agents to make purchases cryptographically — without exposing payment details to merchants or cart details to payment networks.
              </p>
              <p>
                This demo implements the <strong className="text-[#A29BFE]">Autonomous Mode</strong>: a 3-layer SD-JWT credential chain where the user sets constraints, the agent acts within them, and every step is cryptographically verifiable.
              </p>
              <p>
                All keypairs are real ES256 (P-256) credentials generated in your browser using the Web Crypto API. No data leaves your device.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
              <a
                href="https://verifiableintent.dev/spec/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#A29BFE] hover:text-[#C0B8FF] transition-colors"
              >
                verifiableintent.dev/spec/ →
              </a>
              <span className="text-xs font-mono text-[#636E72]">ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
