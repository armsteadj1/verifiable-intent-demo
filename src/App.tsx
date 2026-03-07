import { useState, useEffect, useRef } from 'react'
import { CryptoProvider, useCrypto } from './context/CryptoContext'
import { Header } from './components/Header'
import { ActorGraph } from './components/ActorGraph'
import { StepPanel } from './components/StepPanel'
import { StepControls } from './components/StepControls'
import { LoadingScreen } from './components/LoadingScreen'
import { steps } from './data/steps'

function DemoApp() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const { ready } = useCrypto()
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = steps[currentStep - 1]
  const isDone = currentStep === steps.length
  const allGlow = isDone

  const goNext = () => {
    if (currentStep < steps.length) setCurrentStep(s => s + 1)
  }
  const goPrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1)
  }
  const toggleAutoPlay = () => setIsAutoPlay(p => !p)
  const restart = () => {
    setCurrentStep(1)
    setIsAutoPlay(false)
  }

  useEffect(() => {
    if (isAutoPlay && !isDone) {
      autoPlayRef.current = setInterval(() => {
        setCurrentStep(s => {
          if (s >= steps.length) {
            setIsAutoPlay(false)
            return s
          }
          return s + 1
        })
      }, 3000)
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current) }
  }, [isAutoPlay, isDone])

  if (!ready) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#090909] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left panel — Actor Graph */}
        <div className="lg:w-[420px] shrink-0 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#1a1a1a] bg-[#090909]">
          <ActorGraph
            activeActors={step.activeActors}
            activeConnection={step.activeConnection}
            allGlow={allGlow}
          />
          <div className="mt-4 text-xs font-mono text-[#3a3a3a] text-center">
            {step.activeActors.length === 5 && !step.activeConnection
              ? 'All parties active'
              : step.activeConnection
              ? `${step.activeConnection[0]} → ${step.activeConnection[1]}`
              : 'Initialization'}
          </div>
        </div>

        {/* Right panel — Step content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto p-6 overflow-x-hidden">
            <StepPanel
              step={step}
              stepNumber={currentStep}
              totalSteps={steps.length}
            />
          </div>

          {/* Controls */}
          <div className="border-t border-[#1a1a1a] p-4 bg-[#090909]">
            <StepControls
              currentStep={currentStep}
              totalSteps={steps.length}
              isAutoPlay={isAutoPlay}
              onPrev={goPrev}
              onNext={goNext}
              onToggleAutoPlay={toggleAutoPlay}
              onRestart={restart}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <CryptoProvider>
      <DemoApp />
    </CryptoProvider>
  )
}
