interface PlayerState {
  presence: nkruntime.Presence;
  mark: number; // 1 = X, 2 = O
  displayName: string;
}

interface GameState {
  board: number[];
  players: PlayerState[];
  currentTurn: string;
  phase: string; // 'waiting' | 'playing' | 'ended'
  winner: string | null;
  winningCombo: number[] | null;
  timedMode: boolean;
  turnStartTick: number;
  gameOverTick: number;
  matchCreator: string;
  moveNumber: number;
  lastMove: number | null;
}

interface MatchLabel {
  open: boolean;
  timedMode: boolean;
  playerCount: number;
  creator: string;
}

interface MoveMessage {
  position: number;
}

interface ClientState {
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

interface ClientPlayer {
  userId: string;
  displayName: string;
  mark: number;
}
