import type { ClientPlayer } from "../types/game";

interface PlayerInfoProps {
  player: ClientPlayer;
  isCurrentTurn: boolean;
  isYou: boolean;
}

export default function PlayerInfo({ player, isCurrentTurn, isYou }: PlayerInfoProps) {
  const markSymbol = player.mark === 1 ? "X" : "O";
  const markColor = player.mark === 1 ? "text-orange-200" : "text-lime-200";
  const borderColor = player.mark === 1 ? "border-orange-300/80" : "border-lime-300/80";

  return (
    <div
      className={`
        flex flex-col items-center gap-1 px-4 py-3 rounded-2xl
        transition-all duration-300
        ${isCurrentTurn ? `bg-white/10 border-2 ${borderColor} shadow-lg` : "bg-black/20 border-2 border-white/5"}
      `}
    >
      <span className={`text-2xl font-bold ${markColor}`}>{markSymbol}</span>
      <span className="text-sm text-zinc-100 truncate max-w-[100px]">
        {player.displayName}
      </span>
      {isYou && (
        <span className="text-[10px] text-orange-200 uppercase tracking-wider">(you)</span>
      )}
    </div>
  );
}
