import { getClient, getSession } from "./nakamaClient";

const LEADERBOARD_ID = "global_leaderboard";

export interface LeaderboardRecord {
  ownerId: string;
  username: string;
  score: number;
  rank: number;
}

export async function fetchLeaderboard(limit: number = 10): Promise<LeaderboardRecord[]> {
  const client = getClient();
  const session = getSession();
  if (!session) throw new Error("Not authenticated");

  const result = await client.listLeaderboardRecords(session, LEADERBOARD_ID, undefined, limit);

  return (result.records || []).map((r, idx) => ({
    ownerId: r.owner_id!,
    username: (r.username as string) || "Unknown",
    score: Number(r.score) || 0,
    rank: Number(r.rank) || idx + 1,
  }));
}
