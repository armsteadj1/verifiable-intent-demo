export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#090909] flex flex-col items-center justify-center gap-4">
      <div className="font-mono text-[#A29BFE] text-sm animate-pulse">
        Generating ES256 keypairs...
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#A29BFE] animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <div className="text-xs font-mono text-[#3a3a3a] mt-2">
        Building credential chain...
      </div>
    </div>
  )
}
