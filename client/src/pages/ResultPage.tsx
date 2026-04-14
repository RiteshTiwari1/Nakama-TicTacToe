import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useMatch } from "../context/useMatch";
import Leaderboard from "../components/Leaderboard";

export default function ResultPage() {
  const { userId } = useAuth();
  const { gameOver, gameState, leave } = useMatch();
  const navigate = useNavigate();

  // If no game over data (e.g. page refresh), redirect to lobby
  useEffect(() => {
    if (!gameOver) {
      navigate("/lobby", { replace: true });
    }
  }, [gameOver, navigate]);

  if (!gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWinner = gameOver.winner === userId;
  const isDraw = gameOver.winner === null;

  let resultText = "";
  let resultColor = "";
  let resultSymbol = "";
  let scoreText = "";

  if (isDraw) {
    resultText = "DRAW";
    resultColor = "text-yellow-400";
    resultSymbol = "=";
    scoreText = "+50 pts";
  } else if (isWinner) {
    resultText = "WINNER!";
    resultColor = "text-green-400";
    const myMark = gameState?.players.find((p) => p.userId === userId)?.mark;
    resultSymbol = myMark === 1 ? "X" : "O";
    scoreText = "+200 pts";
  } else {
    resultText = "YOU LOST";
    resultColor = "text-red-400";
    const oppMark = gameState?.players.find((p) => p.userId !== userId)?.mark;
    resultSymbol = oppMark === 1 ? "X" : "O";
    scoreText = "+0 pts";
  }

  let reasonText = "";
  if (gameOver.reason === "timeout") reasonText = "Time ran out!";
  if (gameOver.reason === "opponent_left") reasonText = "Opponent disconnected";

  const handlePlayAgain = async () => {
    await leave();
    navigate("/lobby");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Result Symbol */}
        <div
          className={`text-8xl font-bold mb-2 ${
            resultSymbol === "X" ? "text-cyan-400" : resultSymbol === "O" ? "text-rose-400" : "text-yellow-400"
          }`}
        >
          {resultSymbol}
        </div>

        {/* Result Text */}
        <h1 className={`text-3xl font-bold ${resultColor} mb-1`}>{resultText}</h1>
        <p className={`text-lg ${resultColor} mb-1`}>{scoreText}</p>

        {reasonText && (
          <p className="text-sm text-slate-400 mb-4">{reasonText}</p>
        )}

        {/* Leaderboard */}
        <div className="bg-black/25 rounded-2xl p-4 border border-white/10 mt-6 mb-6 text-left">
          <Leaderboard refreshKey={`${gameOver.winner ?? "draw"}-${gameOver.reason}`} />
        </div>

        {/* Play Again */}
        <button
          onClick={handlePlayAgain}
          className="w-full py-3 bg-orange-300 hover:bg-orange-200 text-zinc-950 font-black rounded-2xl transition-colors text-lg"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
