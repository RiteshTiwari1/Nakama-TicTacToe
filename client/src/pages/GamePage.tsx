import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useMatch } from "../context/useMatch";
import Board from "../components/Board";
import PlayerInfo from "../components/PlayerInfo";
import Timer from "../components/Timer";

const MATCH_TIMEOUT_SEC = 30;

export default function GamePage() {
  const { userId } = useAuth();
  const {
    matchId,
    gameState,
    gameOver,
    timerSeconds,
    isMyTurn,
    makeMove,
    leave,
    error,
  } = useMatch();
  const navigate = useNavigate();
  const [waitSeconds, setWaitSeconds] = useState(MATCH_TIMEOUT_SEC);

  const handleLeave = async () => {
    await leave();
    navigate("/lobby");
  };

  useEffect(() => {
    if (gameOver) {
      navigate("/result", { replace: true });
    }
  }, [gameOver, navigate]);

  useEffect(() => {
    if (!matchId && !gameState) {
      navigate("/lobby", { replace: true });
    }
  }, [matchId, gameState, navigate]);

  // Countdown — when it hits 0, leave match and go back to lobby
  const isWaiting = gameState?.phase === "waiting";
  useEffect(() => {
    if (!isWaiting) {
      return;
    }

    const interval = setInterval(() => {
      setWaitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Leave match so no one joins a dead match, then redirect
          leave();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWaiting, leave]);

  if (gameOver) return null;

  if (!gameState || !matchId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Connecting to match...</p>
          <button
            onClick={handleLeave}
            className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (gameState.phase === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center w-full max-w-xs">
          <h2 className="text-xl font-bold text-white mb-2">Waiting for opponent</h2>
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 mb-1">Looking for a player...</p>
          <p className="text-sm text-slate-500 mb-4">
            Timeout in <span className="text-cyan-400 font-mono">{waitSeconds}s</span>
          </p>

          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(waitSeconds / MATCH_TIMEOUT_SEC) * 100}%` }}
            />
          </div>

          <button
            onClick={handleLeave}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const turnLabel = isMyTurn ? "Your Turn" : "Opponent's Turn";
  const myMark = gameState.players.find((p) => p.userId === userId)?.mark;
  const turnMark = gameState.currentTurn === userId ? myMark : (myMark === 1 ? 2 : 1);
  const turnSymbol = turnMark === 1 ? "X" : "O";
  const turnColor = turnMark === 1 ? "text-orange-200" : "text-lime-200";

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          {gameState.players.map((player) => (
            <PlayerInfo
              key={player.userId}
              player={player}
              isCurrentTurn={gameState.currentTurn === player.userId}
              isYou={player.userId === userId}
            />
          ))}
        </div>

        <div className="rounded-3xl bg-black/25 px-4 py-4 mb-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-200/80">
                Authoritative turn
              </p>
              <p className="text-zinc-400 mt-1">
                <span className={`text-xl font-black ${turnColor}`}>{turnSymbol}</span>
                <span className="ml-2">{turnLabel}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Move #{gameState.moveNumber}</p>
              <p className="text-xs text-zinc-500">
                {gameState.timedMode ? "Timed" : "Classic"} - server sync
              </p>
            </div>
          </div>
          <p className="font-mono text-[11px] text-zinc-600 truncate mt-3">{matchId}</p>
        </div>

        <Board
          board={gameState.board}
          onCellClick={makeMove}
          disabled={!isMyTurn || gameState.phase !== "playing"}
          winningCombo={gameState.winningCombo}
          lastMove={gameState.lastMove}
        />

        {gameState.timedMode && timerSeconds !== null && (
          <div className="mt-4">
            <Timer seconds={timerSeconds} />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mt-3">{error}</p>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleLeave}
            className="px-6 py-2 text-sm text-zinc-500 hover:text-red-300 transition-colors"
          >
            Leave Match
          </button>
        </div>
      </div>
    </div>
  );
}
