import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LogPoseBadge, Pill, StatusBadge } from "../components/Badges";
import { EmptyState, ErrorPanel, Skeleton, Spinner } from "../components/Feedback";
import { IconArrowRight, IconCompass, IconMapPin, IconRefresh, IconShip } from "../components/icons";
import { useApiQuery } from "../hooks/useApiQuery";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchDashboard, fetchLogPose, getReverseMountainUrl } from "../lib/api";
import { scrollInstantly } from "../lib/scroll";
import {
  formatBounty,
  formatCompactBounty,
  formatDateTime,
  formatNumber,
  formatRelative,
  FRUIT_LABELS,
  FRUIT_ORDER,
  STATUS_LABELS,
} from "../lib/format";
import type { DashboardSummary, LogPose, WantedStatus } from "../types/api";

const STATUS_ORDER: readonly WantedStatus[] = ["AT_LARGE", "CAPTURED", "MISSING"];

const statusBarStyles: Record<WantedStatus, string> = {
  AT_LARGE: "bg-crimson-500",
  CAPTURED: "bg-emerald-500",
  MISSING: "bg-violet-500",
};

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="panel p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 font-display text-3xl leading-none text-parchment-50">{value}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando dashboard">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function LogPoseCard({ logPose, loading, error, onRetry }: {
  logPose: LogPose | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading && !logPose) {
    return (
      <div className="panel flex min-h-[260px] flex-col items-center justify-center gap-4 p-6">
        <Spinner label="Consultando el Log Pose" />
      </div>
    );
  }

  if (error && !logPose) {
    return (
      <div className="panel min-h-[260px] p-5">
        <ErrorPanel compact title="Log Pose no disponible" message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!logPose) return null;

  const unlocked = logPose.status === "UNLOCKED";
  const reverseMountainUrl = getReverseMountainUrl();

  return (
    <div className="panel relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-gold-400/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full border border-dashed border-gold-400/15" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">Instrumento de navegación</p>
          <h2 className="mt-2 font-display text-2xl text-parchment-50">Log Pose</h2>
        </div>
        <LogPoseBadge status={logPose.status} />
      </div>

      <div className="relative mt-6 flex items-center gap-5">
        <div className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border ${unlocked ? "border-sea-400/35 bg-sea-400/[0.06]" : "border-gold-400/25 bg-gold-400/[0.05]"}`}>
          <span className={`absolute inset-2 rounded-full border border-dashed ${unlocked ? "border-sea-400/30" : "border-gold-400/20"}`} />
          <span className={`absolute inset-5 rounded-full border ${unlocked ? "border-sea-400/20" : "border-gold-400/15"}`} />
          <IconCompass className={`relative h-9 w-9 ${unlocked ? "text-sea-300" : "text-gold-300/70"}`} />
          {!unlocked && <span className="absolute h-2 w-2 rounded-full bg-crimson-500 shadow-[0_0_12px_rgba(184,58,58,0.9)]" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-slate-300">{logPose.message}</p>
          {logPose.unlockedAt && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-sea-300/80">
              Obtenido el {formatDateTime(logPose.unlockedAt)}
            </p>
          )}
          {!unlocked && reverseMountainUrl && (
            <a
              href={reverseMountainUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-300 underline-offset-4 hover:underline"
            >
              Ir a Reverse Mountain
              <IconArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <p className="relative mt-5 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-slate-500">
        {unlocked
          ? "El Grand Line está desbloqueado para tu tripulación. La consola seguirá mostrando solo lo que la API entregue."
          : "Sin Log Pose no se abre el Grand Line. La inspección del CP3 se pide cuando el CP1 y el CP2 estén funcionando."}
      </p>
    </div>
  );
}

function StatusBreakdown({ summary }: { summary: DashboardSummary }) {
  const total = Math.max(summary.wanted.total, 1);
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Estado de los carteles</p>
          <h2 className="mt-2 font-display text-xl text-parchment-50">La flota, en una mirada</h2>
        </div>
        <Pill tone="gold">{formatNumber(summary.wanted.total)} en total</Pill>
      </div>

      <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/[0.05]" aria-hidden="true">
        {STATUS_ORDER.map((status) => {
          const count = summary.wanted.byStatus[status];
          const width = (count / total) * 100;
          return count > 0 ? (
            <span key={status} className={statusBarStyles[status]} style={{ width: `${width}%` }} />
          ) : null;
        })}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${statusBarStyles[status]}`} />
              <span className="text-[11px] text-slate-400">{STATUS_LABELS[status]}</span>
            </div>
            <p className="mt-2 font-display text-2xl text-parchment-100">{formatNumber(summary.wanted.byStatus[status])}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600">
              {Math.round((summary.wanted.byStatus[status] / total) * 100)}% del archivo
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Fruta del diablo</p>
        <div className="mt-3 space-y-2.5">
          {[...FRUIT_ORDER, "NONE" as const].map((fruit) => {
            const count = summary.wanted.byFruit[fruit];
            const width = (count / total) * 100;
            return (
              <div key={fruit} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[11px] text-slate-400">{FRUIT_LABELS[fruit]}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <span className="block h-full rounded-full bg-gold-400/70" style={{ width: `${width}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-slate-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopBounties({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Los más buscados</p>
          <h2 className="mt-2 font-display text-xl text-parchment-50">Recompensas que quitan el sueño</h2>
        </div>
        <Link to="/wanted" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-300 hover:text-gold-200">
          Ver todos
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 divide-y divide-white/[0.06]">
        {summary.topBounties.map((wanted, index) => (
          <Link
            key={wanted.id}
            to={`/wanted/${encodeURIComponent(wanted.id)}`}
            state={{ from: "/dashboard" }}
            className="group flex items-center gap-3 py-3.5 outline-none transition first:pt-1 last:pb-1 focus-visible:ring-2 focus-visible:ring-gold-300/60"
          >
            <span className="w-8 shrink-0 font-mono text-[10px] text-slate-600">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="truncate text-sm font-semibold text-slate-200 group-hover:text-gold-200">{wanted.name}</span>
                <span className="truncate text-xs text-slate-500">“{wanted.epithet}”</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[11px] text-gold-300/90">{formatBounty(wanted.bounty)}</span>
                <span className="text-[10px] text-slate-600">{wanted.crew.name}</span>
              </div>
            </div>
            <StatusBadge status={wanted.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function MostWantedCrew({ summary }: { summary: DashboardSummary }) {
  const crew = summary.crews.mostWanted;
  return (
    <div className="panel p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Tripulación más buscada</p>
      {crew ? (
        <>
          <div className="mt-4 flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 text-parchment-50"
              style={{ backgroundColor: crew.jollyRogerColor }}
              aria-hidden="true"
            >
              <IconShip className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl leading-tight text-parchment-50">{crew.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{crew.shipName}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">Miembros</dt>
              <dd className="mt-1 font-display text-xl text-parchment-100">{formatNumber(crew.memberCount)}</dd>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">Recompensa</dt>
              <dd className="mt-1 font-display text-xl text-gold-200">{formatCompactBounty(crew.totalBounty)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
          <p className="text-sm text-slate-400">Aún no hay una tripulación con recompensas.</p>
          <p className="mt-1 text-[11px] text-slate-600">Cuando el archivo tenga carteles, aquí aparecerá la más buscada.</p>
        </div>
      )}
      <p className="mt-5 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-slate-500">
        {summary.crews.total} tripulaciones registradas en el archivo de la Guild.
      </p>
    </div>
  );
}

export function DashboardPage() {
  usePageTitle("Dashboard · Log Pose Console");
  const { team } = useAuth();

  useEffect(() => {
    scrollInstantly(0);
  }, []);

  const summaryQuery = useApiQuery<DashboardSummary>((signal) => fetchDashboard(signal), []);
  const logPoseQuery = useApiQuery<LogPose>((signal) => fetchLogPose(signal), []);

  const summary = summaryQuery.data;
  const logPose = logPoseQuery.data;
  const isLoading = summaryQuery.loading && !summary;

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="gold">East Blue</Pill>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
              {team?.code ?? summary?.team.code ?? "—"}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight text-parchment-50 sm:text-4xl">
            Bitácora de {summary?.team.name ?? team?.name ?? "la tripulación"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            El archivo de la Guild, resumido para que sepan a quién buscar primero. Los datos salen
            directamente del servidor de la tripulación.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <IconRefresh className="h-3.5 w-3.5" />
            {summary ? `Actualizado ${formatRelative(summary.generatedAt)}` : "Consultando el archivo"}
          </span>
        </div>
      </header>

      {summaryQuery.error && (
        <ErrorPanel
          title="No pudimos abrir el resumen de la tripulación"
          message={summaryQuery.error.message}
          onRetry={summaryQuery.reload}
          retryAfterSeconds={summaryQuery.error.retryAfterSeconds}
          traceId={summaryQuery.error.traceId}
        />
      )}

      {isLoading && <DashboardSkeleton />}

      {!summaryQuery.error && summary && summary.wanted.total === 0 && (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <EmptyState
            title="El archivo de esta tripulación está vacío"
            message="Todavía no hay carteles de Se Busca en este workspace. Cuando la Guild publique el primer cartel, aparecerá aquí."
            icon={<IconMapPin className="h-6 w-6" />}
            action={
              <Link to="/wanted" className="btn-primary">
                Explorar Se Busca
                <IconArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <LogPoseCard
            logPose={logPose}
            loading={logPoseQuery.loading}
            error={logPoseQuery.error?.message ?? null}
            onRetry={logPoseQuery.reload}
          />
        </div>
      )}

      {!summaryQuery.error && summary && summary.wanted.total > 0 && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de la tripulación">
            <KpiCard
              label="Carteles en el archivo"
              value={formatNumber(summary.wanted.total)}
              detail={`${formatNumber(summary.wanted.byStatus.AT_LARGE)} prófugos siguen en el mar.`}
            />
            <KpiCard
              label="Recompensa acumulada"
              value={formatCompactBounty(summary.wanted.totalBounty)}
              detail="Suma de todas las recompensas del workspace."
            />
            <KpiCard
              label="Recompensa promedio"
              value={formatCompactBounty(summary.wanted.averageBounty)}
              detail="Promedio calculado por el servidor."
            />
            <KpiCard
              label="Tripulaciones"
              value={formatNumber(summary.crews.total)}
              detail={summary.crews.mostWanted ? `La más buscada: ${summary.crews.mostWanted.name}.` : "Sin tripulación destacada."}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <StatusBreakdown summary={summary} />
            <div className="grid gap-4">
              <LogPoseCard
                logPose={logPose}
                loading={logPoseQuery.loading}
                error={logPoseQuery.error?.message ?? null}
                onRetry={logPoseQuery.reload}
              />
              <MostWantedCrew summary={summary} />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <TopBounties summary={summary} />
            <div className="panel flex flex-col justify-between gap-6 p-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">El siguiente paso</p>
                <h2 className="mt-2 font-display text-2xl text-parchment-50">Que el Log Pose no mienta.</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Filtra, ordena y abre cada cartel. La URL guarda el rumbo exacto: puedes recargar,
                  compartirla o volver atrás sin perder la página.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-300/25 bg-gold-300/[0.06] font-mono text-[9px] text-gold-200">
                    01
                  </span>
                  Busca por nombre o epíteto.
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-300/25 bg-gold-300/[0.06] font-mono text-[9px] text-gold-200">
                    02
                  </span>
                  Cruza estado, tripulación y fruta.
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-300/25 bg-gold-300/[0.06] font-mono text-[9px] text-gold-200">
                    03
                  </span>
                  Abre el cartel y vuelve al mismo punto.
                </div>
              </div>
              <Link
                to="/wanted"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold-300/30 bg-gold-300/[0.07] px-4 py-3 text-sm font-semibold text-gold-200 transition hover:border-gold-300/50 hover:bg-gold-300/[0.12]"
              >
                Abrir el archivo de Se Busca
                <IconArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <p className="text-right font-mono text-[9px] uppercase tracking-[0.18em] text-slate-700">
            Resumen generado el {formatDateTime(summary.generatedAt)}
          </p>
        </>
      )}
    </div>
  );
}
