import { getClient, getSession, getSocket } from "./nakamaClient";

export async function createMatch(timedMode: boolean): Promise<string> {
  const client = getClient();
  const session = getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await client.rpc(session, "create_match", { timedMode });
  const data = res.payload as unknown as { matchId: string };
  return data.matchId;
}

export async function findMatch(timedMode: boolean): Promise<string> {
  const client = getClient();
  const session = getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await client.rpc(session, "find_match", { timedMode });
  const data = res.payload as unknown as { matchId: string };
  return data.matchId;
}

export async function joinMatch(matchId: string) {
  const socket = getSocket();
  if (!socket) throw new Error("Socket not connected");

  return await socket.joinMatch(matchId);
}

export function sendMove(matchId: string, position: number): void {
  const socket = getSocket();
  if (!socket) throw new Error("Socket not connected");

  socket.sendMatchState(matchId, 1, JSON.stringify({ position }));
}

export async function leaveMatch(matchId: string): Promise<void> {
  const socket = getSocket();
  if (!socket) throw new Error("Socket not connected");

  await socket.leaveMatch(matchId);
}
