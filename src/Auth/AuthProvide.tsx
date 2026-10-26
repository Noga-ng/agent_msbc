import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import type { DataSession, SessionResponse } from "../Response";
import http from "../service/Client";
import { AuthContext } from "./AuthContext";
import type { ResPost } from "../components/Inscriptions/Inputs/TypeInput";
import Swal from "sweetalert2";
import { endpointAuthSession, endPointLogout } from "../service/Setups/NormalizeEnv";

type AuthProviderProps = { children: ReactNode };

async function fetchSession(): Promise<DataSession | null> {
  
  if(!endpointAuthSession) 
    throw new Error(
  "impossible de activer la session car session endpoint est inaccessible. ",
  {cause:endpointAuthSession}
);
  
  const response = await http.get<SessionResponse>(`/${endpointAuthSession}`, {
    credentials: "include",
    cache: false,
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok)
    throw new Error("Impossible de vérifier la session auprès du serveur.");
  const result = response.data;
  return result?.status &&
    result.data &&
    Number.isFinite(Number(result.data.id))
    ? result.data
    : null;
}

export default function AuthProvider({
  children,
}: AuthProviderProps): ReactElement {
  const [user, setUser] = useState<DataSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkSession = useCallback(async (): Promise<boolean> => {
    // Une erreur réseau n'est pas une déconnexion. fetchSession() renvoie null
    // seulement si le serveur répond que la session n'est plus autorisée.
    const session = await fetchSession();
    setUser(session);
    return session !== null;
  }, []);

  const logout = useCallback(
    async (cin: string): Promise<void> => {
      if (!cin) {
        
        void Swal.fire({
          icon: "error",
          text: "Session invalide : impossible de confirmer la déconnexion.",
        });
        return;
      }
      try {
        if(!endPointLogout) 
          throw new Error('impossible de se deconnecter car l\'endpoint logout manquant',{cause:endPointLogout});
        const res = await http.post<ResPost<null>>(
          `/${endPointLogout}`,
          { logout: true, cin },
          { credentials: "include", retries: 0 },
        );

        if (!res.ok || !res.data?.status)
          throw new Error(
            res.data?.message || "Le serveur n'a pas confirmé la déconnexion.",
          );

        setUser(null);

        navigate("/login", { replace: true });
      } catch (error) {
        void Swal.fire({
          icon: "error",
          title: "Déconnexion non confirmée",
          text:
            error instanceof Error
              ? error.message
              : "Réessayez la déconnexion.",
        });
      }
    },
    [navigate],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await fetchSession();
        if (active) setUser(session);
      } catch (error) {
        if (active) {
          console.error("Initialisation de session impossible :", error);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unauthorized = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("auth:unauthorized", unauthorized);
    return () => window.removeEventListener("auth:unauthorized", unauthorized);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated: user !== null,
        loading,
        checkSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
