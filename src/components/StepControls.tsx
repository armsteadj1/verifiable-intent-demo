import { useEffect, useCallback } from 'react'
import clsx from 'clsx'

type Props = {
  currentStep: number
  totalSteps: number
  isAutoPlay: boolean
  onPrev: () => void
  onNext: () => void
  onToggleAutoPlay: () => void
  onRestart: () => void
}

export function StepControls({
  currentStep,
  totalSteps,
  isAutoPlay,
  onPrev,
  onNext,
  onToggleAutoPlay,
  onRestart,
}: Props) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === 'ArrowLeft') onPrev()
    else if (e.key === 'ArrowRight') onNext()
    else if (e.key === ' ') {
      e.preventDefault()
      onToggleAutoPlay()
    }
  }, [onPrev, onNext, onToggleAutoPlay])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const isDone = currentStep === totalSteps

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dot indicators */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={clsx(
              'rounded-full transition-all duration-200',
              i < currentStep
                ? 'w-2 h-2 bg-[#A29BFE]'
                : i === currentStep - 1
                ? 'w-2.5 h-2.5 bg-[#A29BFE] shadow-[0_0_6px_#A29BFE]'
                : 'w-2 h-2 bg-[#222]'
            )}
          />
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={currentStep <= 1}
          className={clsx(
            'px-4 py-2 text-xs font-mono border rounded transition-colors',
            currentStep <= 1
              ? 'border-[#1a1a1a] text-[#333] cursor-not-allowed'
              : 'border-[#333] text-[#888] hover:border-[#555] hover:text-[#ccc]'
          )}
        >
          ← Prev
        </button>

        {isDone ? (
          <button
            onClick={onRestart}
            className="px-4 py-2 text-xs font-mono border border-[#A29BFE] text-[#A29BFE] rounded hover:bg-[#A29BFE] hover:text-black transition-colors"
          >
            ↺ Restart
          </button>
        ) : (
          <button
            onClick={onToggleAutoPlay}
            className={clsx(
              'px-4 py-2 text-xs font-mono border rounded transition-colors',
              isAutoPlay
                ? 'border-[#A29BFE] text-[#A29BFE] hover:bg-[#A29BFE20]'
                : 'border-[#333] text-[#888] hover:border-[#555] hover:text-[#ccc]'
            )}
          >
            {isAutoPlay ? '⏸ Pause' : '▶ Auto'}
          </button>
        )}

        <button
          onClick={onNext}
          disabled={currentStep >= totalSteps}
          className={clsx(
            'px-4 py-2 text-xs font-mono border rounded transition-colors',
            currentStep >= totalSteps
              ? 'border-[#1a1a1a] text-[#333] cursor-not-allowed'
              : 'border-[#333] text-[#888] hover:border-[#555] hover:text-[#ccc]'
          )}
        >
          Next →
        </button>
      </div>

      <div className="text-[#3a3a3a] text-xs font-mono">← → Space</div>
    </div>
  )
}
