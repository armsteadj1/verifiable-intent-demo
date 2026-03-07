import { useState, useEffect } from 'react'
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
  const [key, setKey] = useState(stepNumber)

  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => {
      setKey(stepNumber)
      setVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [stepNumber])

  return (
    <div className="flex flex-col h-full">
      {/* Step header */}
      <div className="mb-4">
        <div className="text-[#636E72] text-xs font-mono mb-1">
          Step {stepNumber} of {totalSteps}
        </div>
        <h2 className="text-[#f0f0f0] font-mono font-semibold text-lg leading-tight">
          {step.title}
        </h2>
      </div>

      {/* Narrative */}
      <p className="text-[#888] text-sm leading-relaxed mb-4 font-sans">
        {step.narrative}
      </p>

      {/* Divider */}
      <div className="border-t border-[#1a1a1a] mb-4" />

      {/* Data display */}
      <div
        key={key}
        className={clsx(
          'flex-1 overflow-auto transition-opacity duration-150',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Demo badge */}
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

        {/* Callout */}
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
