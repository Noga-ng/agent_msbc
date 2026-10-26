import LoadingState from "../components/Loaders/LoadingState";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./UseAuth";

/** N'affiche jamais une page privée avant confirmation de session. */
export default function ProtectedRoute() {
  const { loading, authenticated } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState label="Vérification de votre session…" />;
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
