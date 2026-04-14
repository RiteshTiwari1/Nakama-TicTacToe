interface TimerProps {
  seconds: number;
}

export default function Timer({ seconds }: TimerProps) {
  const percentage = (seconds / 30) * 100;
  const color =
    seconds > 15 ? "bg-lime-300" : seconds > 7 ? "bg-orange-300" : "bg-red-400";

  return (
    <div className="w-full max-w-[340px] mx-auto rounded-2xl bg-black/25 p-3 ring-1 ring-white/10">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-zinc-400 uppercase tracking-wider">Server turn clock</span>
        <span
          className={`text-lg font-mono font-bold ${
            seconds > 15 ? "text-lime-200" : seconds > 7 ? "text-orange-200" : "text-red-300 animate-pulse"
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
