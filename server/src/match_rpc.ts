var rpcCreateMatch: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  var input = JSON.parse(payload || "{}");
  var timedMode = input.timedMode ? "true" : "false";

  var matchId = nk.matchCreate("tic_tac_toe", { timedMode: timedMode });
  logger.info("Match created via RPC: %s (timed: %s)", matchId, timedMode);

  return JSON.stringify({ matchId: matchId });
};

var rpcFindMatch: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  var input = JSON.parse(payload || "{}");
  var timedMode = input.timedMode || false;

  var limit = 10;
  var isAuthoritative = true;
  var minSize = 1;
  var maxSize = 1;

  var matches = nk.matchList(limit, isAuthoritative, "", minSize, maxSize, "");

  for (var i = 0; i < matches.length; i++) {
    var match = matches[i];
    if (match.label) {
      var matchLabel: MatchLabel = JSON.parse(match.label);
      if (matchLabel.open && matchLabel.timedMode === timedMode) {
        if (matchLabel.creator !== ctx.userId) {
          logger.info("Found open match: %s", match.matchId);
          return JSON.stringify({ matchId: match.matchId });
        }
      }
    }
  }

  var timedStr = timedMode ? "true" : "false";
  var newMatchId = nk.matchCreate("tic_tac_toe", { timedMode: timedStr });
  logger.info("No open match found. Created new match: %s", newMatchId);

  return JSON.stringify({ matchId: newMatchId });
};
