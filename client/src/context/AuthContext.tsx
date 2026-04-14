import { useState, useEffect, type ReactNode } from "react";
import type { Session } from "@heroiclabs/nakama-js";
import {
  signup as doSignup,
  login as doLogin,
  restoreSession,
  logout as doLogout,
} from "../services/authService";
import { getClient } from "../services/nakamaClient";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    restoreSession()
      .then(async (s) => {
        if (s) {
          setSession(s);
          // Fetch display name from server
          try {
            const client = getClient();
            const account = await client.getAccount(s);
            const name = account.user?.display_name || account.user?.username || null;
            setDisplayName(name);
            if (name) localStorage.setItem("display_name", name);
          } catch {
            setDisplayName(localStorage.getItem("display_name"));
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = async (email: string, password: string, username: string) => {
    const s = await doSignup(email, password, username);
    setSession(s);
    setDisplayName(username);
    localStorage.setItem("display_name", username);
  };

  const login = async (email: string, password: string) => {
    const s = await doLogin(email, password);
    setSession(s);
    // Fetch display name
    const client = getClient();
    const account = await client.getAccount(s);
    const name = account.user?.display_name || account.user?.username || "Player";
    setDisplayName(name);
    localStorage.setItem("display_name", name);
  };

  const logout = () => {
    doLogout();
    setSession(null);
    setDisplayName(null);
    localStorage.removeItem("display_name");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        userId: session?.user_id || null,
        username: displayName,
        isAuthenticated: !!session,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
