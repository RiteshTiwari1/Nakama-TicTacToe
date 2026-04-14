import { Client, Session, type Socket } from "@heroiclabs/nakama-js";
import { NAKAMA_HOST, NAKAMA_PORT, NAKAMA_KEY, NAKAMA_USE_SSL } from "../config/nakama";

let client: Client | null = null;
let session: Session | null = null;
let socket: Socket | null = null;

export function getClient(): Client {
  if (!client) {
    client = new Client(NAKAMA_KEY, NAKAMA_HOST, NAKAMA_PORT, NAKAMA_USE_SSL);
  }
  return client;
}

export function getSession(): Session | null {
  return session;
}

export function setSession(s: Session): void {
  session = s;
  localStorage.setItem("nakama_token", s.token);
  localStorage.setItem("nakama_refresh_token", s.refresh_token);
}

export function clearSession(): void {
  session = null;
  localStorage.removeItem("nakama_token");
  localStorage.removeItem("nakama_refresh_token");
}

export async function createSocket(): Promise<Socket> {
  if (socket) {
    return socket;
  }
  const c = getClient();
  socket = c.createSocket(NAKAMA_USE_SSL, false);
  if (session) {
    await socket.connect(session, true);
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect(false);
    socket = null;
  }
}
