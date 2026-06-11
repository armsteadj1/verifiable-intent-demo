import { useState, useEffect, useRef } from 'react'
import { CryptoProvider, useCrypto } from './context/CryptoContext'
import { Header } from './components/Header'
import { ActorGraph } from './components/ActorGraph'
import { StepPanel } from './components/StepPanel'
import { StepControls } from './components/StepControls'
import { LoadingScreen } from './components/LoadingScreen'
import { machinePaymentSteps, steps } from './data/steps'

export type DemoMode = 'vi' | 'machine'

function getModeFromHash(): DemoMode {
  return window.location.hash === '#/machine-payments' ? 'machine' : 'vi'
}

function DemoApp() {
  const [mode, setMode] = useState<DemoMode>(getModeFromHash)
  const [currentStep, setCurrentStep] = useState(1)
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const { ready } = useCrypto()
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const activeSteps = mode === 'machine' ? machinePaymentSteps : steps
  const step = activeSteps[currentStep - 1]

  useEffect(() => {
    const onHashChange = () => {
      setMode(getModeFromHash())
      setCurrentStep(1)
      setIsAutoPlay(false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectMode = (nextMode: DemoMode) => {
    window.location.hash = nextMode === 'machine' ? '/machine-payments' : '/verifiable-intent'
    setMode(nextMode)
    setCurrentStep(1)
    setIsAutoPlay(false)
  }

  // Scroll right panel to top on step change
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep, mode])
  const isDone = currentStep === activeSteps.length
  const allGlow = isDone

  const goNext = () => {
    if (currentStep < activeSteps.length) setCurrentStep(s => s + 1)
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
          if (s >= activeSteps.length) {
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
  }, [isAutoPlay, isDone, activeSteps.length])

  if (!ready) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#090909] flex flex-col">
      <Header mode={mode} onModeChange={selectMode} />

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left panel — Actor Graph */}
        <div className="lg:w-[420px] shrink-0 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#1a1a1a] bg-[#090909]">
          <ActorGraph
            activeActors={step.activeActors}
            activeConnection={step.activeConnection}
            allGlow={allGlow}
            mode={mode}
          />
          <div className="mt-4 text-xs font-mono text-[#3a3a3a] text-center">
            {mode === 'machine'
              ? 'ASL → channel → VIU → settlement'
              : step.activeActors.length === 5 && !step.activeConnection
                ? 'All parties active'
                : step.activeConnection
                  ? `${step.activeConnection[0]} → ${step.activeConnection[1]}`
                  : 'Initialization'}
          </div>
        </div>

        {/* Right panel — Step content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div ref={panelRef} className="flex-1 overflow-auto overflow-x-hidden p-6">
            <StepPanel
              step={step}
              stepNumber={currentStep}
              totalSteps={activeSteps.length}
            />
          </div>

          {/* Controls */}
          <div className="border-t border-[#1a1a1a] p-4 bg-[#090909]">
            <StepControls
              currentStep={currentStep}
              totalSteps={activeSteps.length}
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
