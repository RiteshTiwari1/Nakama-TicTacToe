import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { getSocket } from "../services/nakamaClient";
import {
  joinMatch as doJoinMatch,
  sendMove as doSendMove,
  leaveMatch as doLeaveMatch,
  createMatch as doCreateMatch,
  findMatch as doFindMatch,
} from "../services/matchService";
import type { GameState, GameOverData, TimerSyncData } from "../types/game";
import { OpCode } from "../types/game";
import { useAuth } from "./useAuth";
import { MatchContext } from "./matchContextValue";

export function MatchProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverData | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matchIdRef = useRef<string | null>(null);

  const myMark =
    gameState?.players.find((p) => p.userId === userId)?.mark ?? null;

  const isMyTurn = gameState?.currentTurn === userId && gameState?.phase === "playing";

  // Set up socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.onmatchdata = (matchData) => {
      const data = new TextDecoder().decode(matchData.data);

      switch (matchData.op_code) {
        case OpCode.STATE_UPDATE: {
          const state: GameState = JSON.parse(data);
          setGameState(state);
          break;
        }
        case OpCode.GAME_OVER: {
          const overData: GameOverData = JSON.parse(data);
          setGameOver(overData);
          break;
        }
        case OpCode.TIMER_SYNC: {
          const timerData: TimerSyncData = JSON.parse(data);
          setTimerSeconds(timerData.remainingSeconds);
          break;
        }
        case OpCode.REJECTED: {
          const rejection = JSON.parse(data);
          setError(rejection.reason);
          setTimeout(() => setError(null), 3000);
          break;
        }
      }
    };

    return () => {
      socket.onmatchdata = () => {};
    };
  }, [userId]);

  const joinMatchById = useCallback(async (id: string) => {
    try {
      setError(null);
      await doJoinMatch(id);
      setMatchId(id);
      matchIdRef.current = id;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join match");
    }
  }, []);

  const createNewMatch = useCallback(async (timedMode: boolean): Promise<string> => {
    setError(null);
    const id = await doCreateMatch(timedMode);
    await doJoinMatch(id);
    setMatchId(id);
    matchIdRef.current = id;
    return id;
  }, []);

  const findRandomMatch = useCallback(async (timedMode: boolean) => {
    try {
      setSearching(true);
      setError(null);
      const id = await doFindMatch(timedMode);
      await doJoinMatch(id);
      setMatchId(id);
      matchIdRef.current = id;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to find match");
    } finally {
      setSearching(false);
    }
  }, []);

  const makeMove = useCallback(
    (position: number) => {
      if (!matchIdRef.current) return;
      doSendMove(matchIdRef.current, position);
    },
    []
  );

  const resetMatch = useCallback(() => {
    setMatchId(null);
    matchIdRef.current = null;
    setGameState(null);
    setGameOver(null);
    setTimerSeconds(null);
    setSearching(false);
    setError(null);
  }, []);

  const leave = useCallback(async () => {
    if (matchIdRef.current) {
      try {
        await doLeaveMatch(matchIdRef.current);
      } catch {
        // ignore leave errors
      }
    }
    resetMatch();
  }, [resetMatch]);

  return (
    <MatchContext.Provider
      value={{
        matchId,
        gameState,
        gameOver,
        timerSeconds,
        myMark,
        isMyTurn,
        searching,
        error,
        joinMatchById,
        createNewMatch,
        findRandomMatch,
        makeMove,
        leave,
        resetMatch,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}
