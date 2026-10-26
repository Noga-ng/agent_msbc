import { createContext } from "react";
import type { DataSession } from "../Response";

export type AuthContextType = {
  user: DataSession | null;
  authenticated: boolean;
  loading: boolean;
  checkSession: () => Promise<boolean>;
  logout: (cin:string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);