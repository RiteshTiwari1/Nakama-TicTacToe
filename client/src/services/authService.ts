import { getClient, setSession, createSocket, clearSession, disconnectSocket } from "./nakamaClient";
import { Session } from "@heroiclabs/nakama-js";

// Extracts a readable string from any Nakama SDK error
function extractErrorText(error: unknown): string {
  const parts: string[] = [];

  if (error instanceof Error) parts.push(error.message);
  if (typeof error === "string") parts.push(error);

  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    for (const key of ["message", "body", "statusText", "error", "msg", "reason"]) {
      if (e[key]) parts.push(String(e[key]));
    }
    try { parts.push(JSON.stringify(error)); } catch { /* ignore */ }
  }

  return parts.join(" ");
}

export async function signup(email: string, password: string, displayName: string): Promise<Session> {
  const client = getClient();

  let session: Session;
  try {
    // Don't pass username — let Nakama auto-generate one
    // Email is the unique identifier, displayName is just for show
    session = await client.authenticateEmail(email, password, true);
  } catch {
    // Any error during signup with existing email
    throw new Error("EMAIL_EXISTS:An account with this email already exists. Try logging in.");
  }

  // If session was not newly created, this email already had an account
  if (!session.created) {
    throw new Error("EMAIL_EXISTS:An account with this email already exists. Try logging in.");
  }

  // Set display name (not unique — multiple players can have same name)
  await client.updateAccount(session, { display_name: displayName });

  setSession(session);
  await createSocket();

  return session;
}

export async function login(email: string, password: string): Promise<Session> {
  const client = getClient();

  let session: Session;
  try {
    session = await client.authenticateEmail(email, password, false);
  } catch (e) {
    const text = extractErrorText(e).toLowerCase();

    if (text.includes("not found") || text.includes("identity not found")) {
      throw new Error("No account found with this email. Sign up first.");
    }
    throw new Error("Incorrect email or password. Please try again.");
  }

  setSession(session);
  await createSocket();

  return session;
}

export async function restoreSession(): Promise<Session | null> {
  const token = localStorage.getItem("nakama_token");
  const refreshToken = localStorage.getItem("nakama_refresh_token");

  if (!token || !refreshToken) {
    return null;
  }

  try {
    const client = getClient();
    let session = Session.restore(token, refreshToken);

    if (session.isexpired(Date.now() / 1000)) {
      try {
        session = await client.sessionRefresh(session);
        setSession(session);
      } catch {
        clearSession();
        return null;
      }
    }

    setSession(session);
    await createSocket();
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function logout(): void {
  disconnectSocket();
  clearSession();
}
