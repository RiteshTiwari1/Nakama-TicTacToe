function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  initializer.registerMatch("tic_tac_toe", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal,
  });

  initializer.registerRpc("create_match", rpcCreateMatch);
  initializer.registerRpc("find_match", rpcFindMatch);

  setupLeaderboard(nk, logger);

  logger.info("TicTac Arena module loaded successfully!");
}

!InitModule && InitModule.bind(null);
