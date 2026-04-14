import { createContext } from "react";
import type { Session } from "@heroiclabs/nakama-js";

export interface AuthContextType {
  session: Session | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
