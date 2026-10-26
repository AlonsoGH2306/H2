import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { BootScreen, SessionErrorScreen } from "../components/Feedback";
import { currentPath, safeRedirect } from "../lib/navigation";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, restoreError, retryRestore, signOut } = useAuth();
  const location = useLocation();

  if (status === "loading") return <BootScreen />;

  if (status === "error") {
    return (
      <SessionErrorScreen
        message={
          restoreError?.message ??
          "La consola no pudo comprobar tu sesión. Revisa tu conexión y vuelve a intentarlo."
        }
        onRetry={retryRestore}
        onLogout={signOut}
      />
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: currentPath(location) }} />;
  }

  return <>{children}</>;
}

export function RequireAnonymous({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <BootScreen label="Comprobando la sesión" />;
  if (status === "authenticated") {
    const state = location.state as { from?: unknown } | null;
    return <Navigate to={safeRedirect(state?.from)} replace />;
  }

  return <>{children}</>;
}
