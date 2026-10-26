import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, isAbortError, login as loginRequest, register as registerRequest, toApiError, type ApiError } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/session";
import type { Team, User } from "../types/api";

type AuthStatus = "loading" | "anonymous" | "authenticated" | "error";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  team: Team | null;
  restoreError: ApiError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (teamName: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  retryRestore: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [restoreError, setRestoreError] = useState<ApiError | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    setTeam(null);
    setRestoreError(null);
    setStatus("anonymous");
  }, []);

  // Restauración: el token guardado se valida contra /auth/me. Mientras
  // tanto la app muestra una pantalla de carga, nunca el login.
  useEffect(() => {
    if (!getToken()) {
      setUser(null);
      setTeam(null);
      setRestoreError(null);
      setStatus("anonymous");
      return;
    }

    const controller = new AbortController();
    let active = true;
    setStatus("loading");
    setRestoreError(null);

    fetchMe(controller.signal)
      .then((me) => {
        if (!active) return;
        setUser(me.user);
        setTeam(me.team);
        setStatus("authenticated");
      })
      .catch((cause: unknown) => {
        if (!active || isAbortError(cause)) return;
        const error = toApiError(cause);
        if (error.status === 401) {
          clearToken();
          setUser(null);
          setTeam(null);
          setStatus("anonymous");
          return;
        }
        setRestoreError(error);
        setStatus("error");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [restoreAttempt]);

  // Cualquier 401 de un endpoint protegido cierra la sesión local. La guarda
  // de ruta conserva la ubicación actual para volver después del login.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken();
      setUser(null);
      setTeam(null);
      setRestoreError(null);
      setStatus("anonymous");
    };
    window.addEventListener("logpose:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("logpose:unauthorized", handleUnauthorized);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const session = await loginRequest(email, password);
      setToken(session.token);
      setUser(session.user);
      setTeam(session.team);
      setRestoreError(null);
      setStatus("authenticated");
    } catch (cause: unknown) {
      throw toApiError(cause);
    }
  }, []);

  const signUp = useCallback(async (teamName: string, email: string, password: string) => {
    try {
      const session = await registerRequest(teamName, email, password);
      setToken(session.token);
      setUser(session.user);
      setTeam(session.team);
      setRestoreError(null);
      setStatus("authenticated");
    } catch (cause: unknown) {
      throw toApiError(cause);
    }
  }, []);

  const retryRestore = useCallback(() => setRestoreAttempt((value) => value + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, team, restoreError, signIn, signUp, signOut, retryRestore }),
    [status, user, team, restoreError, signIn, signUp, signOut, retryRestore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
