import Cell from "./Cell";

interface BoardProps {
  board: number[];
  onCellClick: (index: number) => void;
  disabled: boolean;
  winningCombo: number[] | null;
  lastMove?: number | null;
}

export default function Board({ board, onCellClick, disabled, winningCombo, lastMove }: BoardProps) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[340px] mx-auto rounded-[2rem] bg-black/25 p-3 shadow-2xl shadow-black/30 ring-1 ring-white/10">
      {board.map((value, index) => (
        <Cell
          key={index}
          value={value}
          index={index}
          onClick={onCellClick}
          disabled={disabled}
          isWinning={winningCombo?.includes(index) || false}
          isLastMove={lastMove === index}
        />
      ))}
    </div>
  );
}
