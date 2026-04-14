interface CellProps {
  value: number;
  index: number;
  onClick: (index: number) => void;
  disabled: boolean;
  isWinning: boolean;
  isLastMove?: boolean;
}

export default function Cell({ value, index, onClick, disabled, isWinning, isLastMove }: CellProps) {
  const symbol = value === 1 ? "X" : value === 2 ? "O" : "";
  const colorClass =
    value === 1 ? "text-cyan-400" : value === 2 ? "text-rose-400" : "";

  return (
    <button
      onClick={() => onClick(index)}
      disabled={disabled || value !== 0}
      className={`
        aspect-square flex items-center justify-center
        text-5xl sm:text-6xl font-bold
        border border-white/10 rounded-2xl
        transition-all duration-200
        ${colorClass}
        ${isWinning ? "bg-lime-300/20 scale-105 ring-2 ring-lime-300" : isLastMove ? "bg-orange-300/15 ring-1 ring-orange-300/70" : "bg-zinc-950/55"}
        ${!disabled && value === 0 ? "hover:bg-orange-300/10 hover:border-orange-200/40 cursor-pointer" : "cursor-default"}
        ${value !== 0 ? "animate-pop" : ""}
      `}
    >
      {symbol}
    </button>
  );
}
