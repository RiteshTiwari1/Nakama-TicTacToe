import { useState, useEffect } from "react";
import { fetchLeaderboard, type LeaderboardRecord } from "../services/leaderboardService";

interface LeaderboardProps {
  refreshKey?: number | string;
}

export default function Leaderboard({ refreshKey }: LeaderboardProps) {
  const [records, setRecords] = useState<LeaderboardRecord[] | null>(null);

  useEffect(() => {
    fetchLeaderboard(10)
      .then(setRecords)
      .catch(() => setRecords([]));
  }, [refreshKey]);

  if (records === null) {
    return (
      <div className="text-center text-slate-500 py-4">Loading leaderboard...</div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-slate-500 py-4">No records yet. Play a game!</div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
        Leaderboard
      </h3>
      <div className="space-y-1">
        <div className="grid grid-cols-[32px_1fr_80px] gap-2 text-xs text-slate-500 uppercase tracking-wider px-2 pb-1">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Score</span>
        </div>
        {records.map((r, i) => (
          <div
            key={r.ownerId}
            className={`grid grid-cols-[32px_1fr_80px] gap-2 items-center px-2 py-2 rounded-lg
              ${i === 0 ? "bg-yellow-500/10 text-yellow-300" : ""}
              ${i === 1 ? "bg-slate-400/10 text-slate-300" : ""}
              ${i === 2 ? "bg-amber-700/10 text-amber-400" : ""}
              ${i > 2 ? "text-slate-400" : ""}
            `}
          >
            <span className="font-bold">{r.rank}</span>
            <span className="truncate">{r.username}</span>
            <span className="text-right font-mono">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
