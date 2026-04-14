var matchInit: nkruntime.MatchInitFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: { [key: string]: string }
): { state: nkruntime.MatchState; tickRate: number; label: string } {
  var timedMode = params["timedMode"] === "true";

  var state: GameState = {
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    players: [],
    currentTurn: "",
    phase: "waiting",
    winner: null,
    winningCombo: null,
    timedMode: timedMode,
    turnStartTick: 0,
    gameOverTick: 0,
    matchCreator: ctx.userId || "",
    moveNumber: 0,
    lastMove: null,
  };

  var label: MatchLabel = {
    open: true,
    timedMode: timedMode,
    playerCount: 0,
    creator: ctx.userId || "",
  };

  logger.info("Match created. Timed mode: %s", timedMode.toString());

  return {
    state: state,
    tickRate: TICK_RATE,
    label: JSON.stringify(label),
  };
};

var matchJoinAttempt: nkruntime.MatchJoinAttemptFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presence: nkruntime.Presence,
  metadata: { [key: string]: string }
): { state: nkruntime.MatchState; accept: boolean; rejectMessage?: string } {
  var s = state as GameState;

  if (s.phase !== "waiting") {
    return { state: s, accept: false, rejectMessage: "Match already in progress." };
  }

  if (s.players.length >= 2) {
    return { state: s, accept: false, rejectMessage: "Match is full." };
  }

  // Prevent same player joining twice
  for (var i = 0; i < s.players.length; i++) {
    if (s.players[i].presence.userId === presence.userId) {
      return { state: s, accept: false, rejectMessage: "Already in this match." };
    }
  }

  logger.info("Player %s attempting to join.", presence.userId);
  return { state: s, accept: true };
};

var matchJoin: nkruntime.MatchJoinFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): { state: nkruntime.MatchState } | null {
  var s = state as GameState;

  for (var i = 0; i < presences.length; i++) {
    var presence = presences[i];
    var account = nk.accountGetId(presence.userId);
    var displayName = account.user.displayName || account.user.username || presence.userId;
    var mark = s.players.length === 0 ? 1 : 2; // First player = X(1), Second = O(2)

    s.players.push({
      presence: presence,
      mark: mark,
      displayName: displayName,
    });

    logger.info("Player %s (%s) joined as %s", displayName, presence.userId, mark === 1 ? "X" : "O");
  }

  // Update label
  var label: MatchLabel = {
    open: s.players.length < 2,
    timedMode: s.timedMode,
    playerCount: s.players.length,
    creator: s.matchCreator,
  };
  dispatcher.matchLabelUpdate(JSON.stringify(label));

  // If 2 players, start the game
  if (s.players.length === 2) {
    s.phase = "playing";
    s.currentTurn = s.players[0].presence.userId; // X goes first
    s.turnStartTick = tick;
    logger.info("Game started! %s vs %s", s.players[0].displayName, s.players[1].displayName);
  }

  // Broadcast state to all
  dispatcher.broadcastMessage(OpCode.STATE_UPDATE, buildClientState(s));

  return { state: s };
};

var matchLeave: nkruntime.MatchLeaveFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  presences: nkruntime.Presence[]
): { state: nkruntime.MatchState } | null {
  var s = state as GameState;

  for (var i = 0; i < presences.length; i++) {
    var leftUserId = presences[i].userId;
    logger.info("Player %s left.", leftUserId);

    if (s.phase === "playing") {
      // Other player wins by forfeit
      var other = getOtherPlayer(s, leftUserId);
      if (other) {
        s.winner = other.presence.userId;
        s.phase = "ended";
        s.gameOverTick = tick;

        // Record results
        recordWin(nk, logger, other.presence.userId, other.displayName);
        var leftPlayer = findPlayer(s, leftUserId);
        if (leftPlayer) {
          recordLoss(nk, logger, leftUserId, leftPlayer.displayName);
        }

        dispatcher.broadcastMessage(
          OpCode.GAME_OVER,
          JSON.stringify({
            winner: s.winner,
            reason: "opponent_left",
            winningCombo: null,
          })
        );
      }
    }

    // Remove player
    var newPlayers: PlayerState[] = [];
    for (var j = 0; j < s.players.length; j++) {
      if (s.players[j].presence.userId !== leftUserId) {
        newPlayers.push(s.players[j]);
      }
    }
    s.players = newPlayers;
  }

  // If no players left, terminate
  if (s.players.length === 0) {
    return null;
  }

  // Update label
  var label: MatchLabel = {
    open: s.phase === "waiting" && s.players.length < 2,
    timedMode: s.timedMode,
    playerCount: s.players.length,
    creator: s.matchCreator,
  };
  dispatcher.matchLabelUpdate(JSON.stringify(label));

  return { state: s };
};

var matchLoop: nkruntime.MatchLoopFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  messages: nkruntime.MatchMessage[]
): { state: nkruntime.MatchState } | null {
  var s = state as GameState;

  // If game ended, wait for grace period then terminate
  if (s.phase === "ended") {
    if (tick - s.gameOverTick >= GAME_OVER_DELAY_TICKS) {
      return null; // terminate match
    }
    return { state: s };
  }

  // Process messages
  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];

    if (msg.opCode === OpCode.MOVE && s.phase === "playing") {
      var data: MoveMessage = JSON.parse(nk.binaryToString(msg.data));
      var senderId = msg.sender.userId;

      // Validate move
      if (!isValidMove(s.board, data.position, senderId, s.currentTurn, s.phase)) {
        dispatcher.broadcastMessage(
          OpCode.REJECTED,
          JSON.stringify({ reason: "Invalid move" }),
          [msg.sender]
        );
        continue;
      }

      // Apply move
      var mark = getPlayerMark(s, senderId);
      s.board[data.position] = mark;
      s.moveNumber++;
      s.lastMove = data.position;
      logger.info("Player %s placed %s at position %d", senderId, mark === 1 ? "X" : "O", data.position);

      // Check for winner
      var result = checkWinner(s.board);
      if (result) {
        s.phase = "ended";
        s.winner = senderId;
        s.winningCombo = result.combo;
        s.gameOverTick = tick;

        var loser = getOtherPlayer(s, senderId);
        var winnerPlayer = findPlayer(s, senderId);

        if (winnerPlayer) {
          recordWin(nk, logger, senderId, winnerPlayer.displayName);
        }
        if (loser) {
          recordLoss(nk, logger, loser.presence.userId, loser.displayName);
        }

        dispatcher.broadcastMessage(OpCode.STATE_UPDATE, buildClientState(s));
        dispatcher.broadcastMessage(
          OpCode.GAME_OVER,
          JSON.stringify({
            winner: s.winner,
            reason: "win",
            winningCombo: s.winningCombo,
          })
        );
        continue;
      }

      // Check for draw
      if (isBoardFull(s.board)) {
        s.phase = "ended";
        s.winner = null;
        s.gameOverTick = tick;

        for (var p = 0; p < s.players.length; p++) {
          recordDraw(nk, logger, s.players[p].presence.userId, s.players[p].displayName);
        }

        dispatcher.broadcastMessage(OpCode.STATE_UPDATE, buildClientState(s));
        dispatcher.broadcastMessage(
          OpCode.GAME_OVER,
          JSON.stringify({
            winner: null,
            reason: "draw",
            winningCombo: null,
          })
        );
        continue;
      }

      // Switch turn
      var otherPlayer = getOtherPlayer(s, senderId);
      if (otherPlayer) {
        s.currentTurn = otherPlayer.presence.userId;
        s.turnStartTick = tick;
      }

      // Broadcast updated state
      dispatcher.broadcastMessage(OpCode.STATE_UPDATE, buildClientState(s));
    }
  }

  // Timer enforcement (timed mode only)
  if (s.timedMode && s.phase === "playing") {
    var elapsed = tick - s.turnStartTick;

    // Broadcast timer sync every second
    if (elapsed % TICK_RATE === 0) {
      var remaining = TURN_TIMEOUT_SEC - Math.floor(elapsed / TICK_RATE);
      if (remaining < 0) remaining = 0;
      dispatcher.broadcastMessage(
        OpCode.TIMER_SYNC,
        JSON.stringify({ remainingSeconds: remaining, currentTurn: s.currentTurn })
      );
    }

    // Check timeout
    if (elapsed >= TURN_TIMEOUT_TICKS) {
      var timedOutPlayer = s.currentTurn;
      var winnerByTimeout = getOtherPlayer(s, timedOutPlayer);

      if (winnerByTimeout) {
        s.phase = "ended";
        s.winner = winnerByTimeout.presence.userId;
        s.gameOverTick = tick;

        recordWin(nk, logger, winnerByTimeout.presence.userId, winnerByTimeout.displayName);
        var loserPlayer = findPlayer(s, timedOutPlayer);
        if (loserPlayer) {
          recordLoss(nk, logger, timedOutPlayer, loserPlayer.displayName);
        }

        dispatcher.broadcastMessage(OpCode.STATE_UPDATE, buildClientState(s));
        dispatcher.broadcastMessage(
          OpCode.GAME_OVER,
          JSON.stringify({
            winner: s.winner,
            reason: "timeout",
            winningCombo: null,
          })
        );
      }
    }
  }

  return { state: s };
};

var matchTerminate: nkruntime.MatchTerminateFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  graceSeconds: number
): { state: nkruntime.MatchState } | null {
  logger.info("Match terminated.");
  return null;
};

var matchSignal: nkruntime.MatchSignalFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: nkruntime.MatchState,
  data: string
): { state: nkruntime.MatchState; data?: string } | null {
  return { state: state };
};

function findPlayer(state: GameState, userId: string): PlayerState | null {
  for (var i = 0; i < state.players.length; i++) {
    if (state.players[i].presence.userId === userId) {
      return state.players[i];
    }
  }
  return null;
}
