import  { useContext } from "react";
import { AuthContext, type AuthContextType } from "./AuthContext";

export function useAuth():AuthContextType{

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé dans AuthProvider"
    );
  }

  return context;
}