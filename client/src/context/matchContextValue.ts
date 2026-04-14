import { createContext } from "react";
import type { GameOverData, GameState } from "../types/game";

export interface MatchContextType {
  matchId: string | null;
  gameState: GameState | null;
  gameOver: GameOverData | null;
  timerSeconds: number | null;
  myMark: number | null;
  isMyTurn: boolean;
  searching: boolean;
  error: string | null;
  joinMatchById: (matchId: string) => Promise<void>;
  createNewMatch: (timedMode: boolean) => Promise<string>;
  findRandomMatch: (timedMode: boolean) => Promise<void>;
  makeMove: (position: number) => void;
  leave: () => Promise<void>;
  resetMatch: () => void;
}

export const MatchContext = createContext<MatchContextType | null>(null);
