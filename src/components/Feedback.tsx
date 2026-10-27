import { useEffect, useState, type ReactNode } from "react";
import { IconRefresh } from "./icons";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.055] ${className}`} aria-hidden="true" />;
}

export function Spinner({ label = "Cargando" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-400" role="status">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/20 border-t-gold-300" />
      {label}
    </span>
  );
}

export function ErrorPanel({
  title = "No se pudo cargar la información",
  message,
  onRetry,
  retryAfterSeconds = null,
  compact = false,
  traceId = null,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryAfterSeconds?: number | null;
  compact?: boolean;
  traceId?: string | null;
}) {
  const [remaining, setRemaining] = useState(retryAfterSeconds ?? 0);

  useEffect(() => {
    setRemaining(retryAfterSeconds ?? 0);
    if (!retryAfterSeconds || retryAfterSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  const blocked = remaining > 0;

  return (
    <div
      role="alert"
      className={`flex flex-col gap-4 rounded-2xl border border-crimson-500/30 bg-crimson-500/[0.07] p-5 ${
        compact ? "sm:flex-row sm:items-center sm:justify-between" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-crimson-500/35 bg-crimson-500/10 font-mono text-sm text-rose-200">
          !
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rose-50">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-rose-100/70">{message}</p>
          {traceId && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-200/35">
              trace {traceId}
            </p>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={blocked}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:border-gold-300/50 hover:bg-gold-300/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <IconRefresh className="h-4 w-4" />
          {blocked ? `Reintentar en ${remaining}s` : "Reintentar"}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-500">
        {icon ?? <span className="font-mono text-lg">∅</span>}
      </span>
      <div>
        <p className="font-display text-xl text-parchment-100">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">{message}</p>
      </div>
      {action}
    </div>
  );
}

export function BootScreen({ label = "Restaurando el Log Pose" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink-950 px-6" role="status">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold-400/20">
        <span className="absolute inset-0 animate-ping rounded-full border border-gold-400/10" />
        <span className="h-14 w-14 animate-spin rounded-full border border-dashed border-gold-400/45" />
        <span className="absolute h-2.5 w-2.5 rounded-full bg-gold-300" />
      </div>
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold-400/70">{label}</p>
        <p className="mt-2 font-display text-lg text-parchment-100">La consola está leyendo la brújula…</p>
      </div>
    </div>
  );
}

export function SessionErrorScreen({
  message,
  onRetry,
  onLogout,
}: {
  message: string;
  onRetry: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-gold-400/75">Sesión</p>
        <h1 className="mt-3 font-display text-2xl text-parchment-50">No pudimos verificar tu sesión</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onRetry} className="btn-primary">
            <IconRefresh className="h-4 w-4" />
            Reintentar
          </button>
          <button type="button" onClick={onLogout} className="btn-ghost">
            Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
