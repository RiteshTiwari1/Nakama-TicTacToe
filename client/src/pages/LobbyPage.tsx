import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useMatch } from "../context/useMatch";
import Leaderboard from "../components/Leaderboard";

export default function LobbyPage() {
  const { username, logout } = useAuth();
  const {
    findRandomMatch,
    createNewMatch,
    joinMatchById,
    searching,
  } = useMatch();
  const navigate = useNavigate();

  const [timedMode, setTimedMode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleFindMatch = async () => {
    try {
      setError("");
      await findRandomMatch(timedMode);
      navigate("/game");
    } catch {
      setError("Failed to find match");
    }
  };

  const handleCreateRoom = async () => {
    try {
      setError("");
      setCreating(true);
      const matchId = await createNewMatch(timedMode);
      setCreatedMatchId(matchId);
    } catch {
      setError("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCode.trim();
    if (!code) {
      setError("Please enter a match ID");
      return;
    }
    try {
      setError("");
      await joinMatchById(code);
      navigate("/game");
    } catch {
      setError("Failed to join room. Check the match ID.");
    }
  };

  const handleCopyMatchId = () => {
    if (createdMatchId) {
      navigator.clipboard.writeText(createdMatchId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-200/80 mb-2">
              Server-authoritative
            </p>
            <h1 className="text-4xl font-black text-white leading-none">
              Gridlock <span className="text-orange-200">Arena</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Signed in as <span className="text-lime-200">{username}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Game Mode Toggle */}
        <div className="flex items-center justify-between bg-black/25 rounded-2xl px-4 py-3 mb-4 ring-1 ring-white/10">
          <div>
            <span className="text-sm text-zinc-100">Timed Mode</span>
            <p className="text-xs text-zinc-500">30s/turn, timeout enforced by Nakama</p>
          </div>
          <button
            onClick={() => setTimedMode(!timedMode)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              timedMode ? "bg-orange-300" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                timedMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleFindMatch}
            disabled={searching || !!createdMatchId}
            className="w-full py-4 bg-orange-300 hover:bg-orange-200 disabled:bg-zinc-700
              text-zinc-950 font-black rounded-2xl transition-colors text-lg shadow-xl shadow-orange-950/20
              disabled:cursor-not-allowed"
          >
            {searching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                Finding a random player...
              </span>
            ) : (
              "Find Random Match"
            )}
          </button>

          {!createdMatchId ? (
            <button
              onClick={handleCreateRoom}
              disabled={creating || searching}
              className="w-full py-3 bg-black/30 hover:bg-black/45 disabled:bg-black/20
                text-white font-semibold rounded-2xl transition-colors
                disabled:cursor-not-allowed border border-white/10"
            >
              {creating ? "Creating..." : "Create Room"}
            </button>
          ) : (
            <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
              <p className="text-sm text-zinc-400 mb-2">Share this Nakama match ID:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={createdMatchId}
                  className="flex-1 px-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl
                    text-white text-xs font-mono"
                />
                <button
                  onClick={handleCopyMatchId}
                  className="px-3 py-2 bg-lime-300 hover:bg-lime-200 rounded-xl text-zinc-950 text-sm font-bold transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2 animate-pulse">
                Waiting for opponent to join...
              </p>
              <button
                onClick={() => navigate("/game")}
                className="w-full mt-2 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white text-sm transition-colors"
              >
                Go to Game
              </button>
            </div>
          )}

          {/* Join Room */}
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter match ID to join..."
              className="flex-1 px-3 py-3 bg-black/30 border border-white/10 rounded-2xl
                text-white placeholder-zinc-500 text-sm focus:outline-none
                focus:border-orange-200 transition-colors"
            />
            <button
              onClick={handleJoinRoom}
              disabled={searching}
              className="px-5 py-3 bg-black/30 hover:bg-black/45 text-white rounded-2xl
                transition-colors font-medium border border-white/10"
            >
              Join
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Leaderboard */}
        <div className="bg-black/25 rounded-2xl p-4 border border-white/10">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
