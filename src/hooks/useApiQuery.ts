import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError, toApiError, type ApiError } from "../lib/api";

interface QueryState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

/**
 * Consulta de un recurso con cancelación y protección contra respuestas
 * antiguas. Cada cambio en `deps` cancela la petición anterior y descarta
 * cualquier respuesta que llegue después.
 */
export function useApiQuery<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): QueryState<T> & { reload: () => void } {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    const controller = new AbortController();
    let active = true;

    setState({ data: null, error: null, loading: true });

    Promise.resolve()
      .then(() => loaderRef.current(controller.signal))
      .then((data) => {
        if (!active || seq !== requestSeq.current) return;
        setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!active || seq !== requestSeq.current || isAbortError(error)) return;
        setState({ data: null, error: toApiError(error), loading: false });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // `deps` define cuándo se repite la consulta; el loader se lee por ref.
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, reload };
}
