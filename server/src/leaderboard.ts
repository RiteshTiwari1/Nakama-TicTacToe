function setupLeaderboard(nk: nkruntime.Nakama, logger: nkruntime.Logger): void {
  try {
    nk.leaderboardCreate(
      LEADERBOARD_ID,
      true, // authoritative
      nkruntime.SortOrder.DESCENDING,
      nkruntime.Operator.BEST
    );
    logger.info("Leaderboard created: %s", LEADERBOARD_ID);
  } catch (e) {
    logger.info("Leaderboard already exists or error: %v", e);
  }
}

function recordWin(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, username: string): void {
  var stats = getPlayerStats(nk, userId);
  stats.wins += 1;
  stats.currentStreak += 1;
  if (stats.currentStreak > stats.bestStreak) {
    stats.bestStreak = stats.currentStreak;
  }
  stats.score += WIN_SCORE;
  savePlayerStats(nk, userId, stats);

  nk.leaderboardRecordWrite(LEADERBOARD_ID, userId, username, stats.score);
  logger.info("Recorded win for %s, score: %d", username, stats.score);
}

function recordLoss(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, username: string): void {
  var stats = getPlayerStats(nk, userId);
  stats.losses += 1;
  stats.currentStreak = 0;
  savePlayerStats(nk, userId, stats);

  nk.leaderboardRecordWrite(LEADERBOARD_ID, userId, username, stats.score);
  logger.info("Recorded loss for %s", username);
}

function recordDraw(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, username: string): void {
  var stats = getPlayerStats(nk, userId);
  stats.draws += 1;
  stats.currentStreak = 0;
  stats.score += DRAW_SCORE;
  savePlayerStats(nk, userId, stats);

  nk.leaderboardRecordWrite(LEADERBOARD_ID, userId, username, stats.score);
  logger.info("Recorded draw for %s", username);
}

interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  score: number;
}

function getPlayerStats(nk: nkruntime.Nakama, userId: string): PlayerStats {
  var objects = nk.storageRead([
    { collection: "player_stats", key: "stats", userId: userId },
  ]);
  if (objects.length > 0 && objects[0].value) {
    return objects[0].value as PlayerStats;
  }
  return { wins: 0, losses: 0, draws: 0, currentStreak: 0, bestStreak: 0, score: 0 };
}

function savePlayerStats(nk: nkruntime.Nakama, userId: string, stats: PlayerStats): void {
  nk.storageWrite([
    {
      collection: "player_stats",
      key: "stats",
      userId: userId,
      value: stats,
      permissionRead: 2, // public read
      permissionWrite: 0, // server only write
    },
  ]);
}
