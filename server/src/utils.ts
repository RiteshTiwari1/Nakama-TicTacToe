const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function checkWinner(board: number[]): { winner: number; combo: number[] } | null {
  for (var i = 0; i < WIN_LINES.length; i++) {
    var line = WIN_LINES[i];
    var a = board[line[0]];
    var b = board[line[1]];
    var c = board[line[2]];
    if (a !== 0 && a === b && b === c) {
      return { winner: a, combo: line };
    }
  }
  return null;
}

function isBoardFull(board: number[]): boolean {
  for (var i = 0; i < board.length; i++) {
    if (board[i] === 0) return false;
  }
  return true;
}

function isValidMove(
  board: number[],
  position: number,
  playerId: string,
  currentTurn: string,
  phase: string
): boolean {
  if (phase !== "playing") return false;
  if (playerId !== currentTurn) return false;
  if (position < 0 || position > 8) return false;
  if (board[position] !== 0) return false;
  return true;
}

function getPlayerMark(state: GameState, userId: string): number {
  for (var i = 0; i < state.players.length; i++) {
    if (state.players[i].presence.userId === userId) {
      return state.players[i].mark;
    }
  }
  return 0;
}

function getOtherPlayer(state: GameState, userId: string): PlayerState | null {
  for (var i = 0; i < state.players.length; i++) {
    if (state.players[i].presence.userId !== userId) {
      return state.players[i];
    }
  }
  return null;
}

function buildClientState(state: GameState): string {
  var clientPlayers: ClientPlayer[] = [];
  for (var i = 0; i < state.players.length; i++) {
    var p = state.players[i];
    clientPlayers.push({
      userId: p.presence.userId,
      displayName: p.displayName,
      mark: p.mark,
    });
  }

  var cs: ClientState = {
    board: state.board,
    players: clientPlayers,
    currentTurn: state.currentTurn,
    phase: state.phase,
    winner: state.winner,
    winningCombo: state.winningCombo,
    timedMode: state.timedMode,
    moveNumber: state.moveNumber,
    lastMove: state.lastMove,
  };

  return JSON.stringify(cs);
}
