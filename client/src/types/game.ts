export interface ClientPlayer {
  userId: string;
  displayName: string;
  mark: number; // 1 = X, 2 = O
}

export interface GameState {
  board: number[];
  players: ClientPlayer[];
  currentTurn: string;
  phase: string;
  winner: string | null;
  winningCombo: number[] | null;
  timedMode: boolean;
  moveNumber: number;
  lastMove: number | null;
}

export interface GameOverData {
  winner: string | null;
  reason: string;
  winningCombo: number[] | null;
}

export interface TimerSyncData {
  remainingSeconds: number;
  currentTurn: string;
}

export const OpCode = {
  MOVE: 1,
  STATE_UPDATE: 2,
  GAME_OVER: 3,
  TIMER_SYNC: 4,
  REJECTED: 5,
};
