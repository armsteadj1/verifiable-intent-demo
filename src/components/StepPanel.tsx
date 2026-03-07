import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { Step } from '../data/steps'
import { DataDisplay } from './DataDisplay'

type Props = {
  step: Step
  stepNumber: number
  totalSteps: number
}

export function StepPanel({ step, stepNumber, totalSteps }: Props) {
  const [visible, setVisible] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => {
      // Smooth scroll every possible container to top
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // Also smooth scroll any overflow-auto ancestor
      let el: HTMLElement | null = scrollRef.current?.parentElement ?? null
      while (el) {
        if (el.scrollTop > 0) el.scrollTo({ top: 0, behavior: 'smooth' })
        el = el.parentElement
      }
      setVisible(true)
    }, 120)
    return () => clearTimeout(timer)
  }, [stepNumber])

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="text-[#636E72] text-xs font-mono mb-1">
          Step {stepNumber} of {totalSteps}
        </div>
        <h2 className="text-[#f0f0f0] font-mono font-semibold text-lg leading-tight">
          {step.title}
        </h2>
      </div>

      <p className="text-[#888] text-sm leading-relaxed mb-4 font-sans">
        {step.narrative}
      </p>

      <div className="border-t border-[#1a1a1a] mb-4" />

      <div
        ref={scrollRef}
        className={clsx(
          'flex-1 overflow-auto transition-opacity duration-150',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {step.demoBadge && (
          <div className="flex justify-end mb-2">
            <span className="text-[10px] font-mono text-[#3a3a3a] border border-[#1a1a1a] rounded px-2 py-0.5">
              DEMO · ephemeral keys
            </span>
          </div>
        )}

        <DataDisplay
          dataType={step.dataType}
          dataKey={step.dataKey}
          stepId={step.id}
        />

        {step.callout && (
          <div className="mt-4 bg-[#1a1a1a] border-l-2 border-[#A29BFE] rounded-r px-3 py-2 text-xs font-mono text-[#888]">
            <span className="text-[#A29BFE] mr-2">ℹ</span>
            {step.callout}
          </div>
        )}
      </div>
    </div>
  )
}
