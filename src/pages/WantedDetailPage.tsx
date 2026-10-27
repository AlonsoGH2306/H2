import { useLayoutEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FruitBadge, Pill, RoleBadge, StatusBadge, ThreatMeter } from "../components/Badges";
import { EmptyState, ErrorPanel, Skeleton } from "../components/Feedback";
import {
  IconCalendar,
  IconChevronLeft,
  IconMapPin,
  IconRuler,
  IconShip,
  IconUser,
} from "../components/icons";
import { useApiQuery } from "../hooks/useApiQuery";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchWantedById } from "../lib/api";
import {
  formatBounty,
  formatDate,
  formatDateTime,
  formatRelative,
  initials,
  roleLabel,
  threatLabel,
} from "../lib/format";
import { safeRedirect } from "../lib/navigation";
import { scrollInstantly } from "../lib/scroll";
import type { WantedDetail } from "../types/api";

function PosterSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]" aria-busy="true" aria-label="Cargando cartel">
      <Skeleton className="h-[640px] rounded-sm" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function DetailMissing({ from }: { from: string }) {
  return (
    <div className="mx-auto max-w-xl py-12">
      <EmptyState
        title="Este cartel no está en el archivo"
        message="El identificador no existe en el workspace de la tripulación. Puede que el cartel haya sido retirado o que el enlace esté incompleto."
        icon={<IconUser className="h-6 w-6" />}
        action={
          <Link to={from} className="btn-primary">
            <IconChevronLeft className="h-4 w-4" />
            Volver al listado
          </Link>
        }
      />
    </div>
  );
}

function BountyHistory({ wanted }: { wanted: WantedDetail }) {
  const history = wanted.bountyHistory;
  return (
    <section className="panel p-6" aria-labelledby="bounty-history-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Historial de recompensas</p>
          <h2 id="bounty-history-title" className="mt-2 font-display text-xl text-parchment-50">
            Cómo subió el precio de su cabeza
          </h2>
        </div>
        <Pill tone="gold">{history.length} emisiones</Pill>
      </div>

      {history.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">La Guild todavía no registró cambios de recompensa.</p>
      ) : (
        <ol className="relative mt-6 space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-gradient-to-b before:from-gold-400/40 before:via-white/10 before:to-transparent">
          {history.map((entry, index) => {
            const isCurrent = index === history.length - 1;
            return (
              <li key={`${entry.issuedAt}-${entry.amount}`} className="relative pl-7">
                <span
                  className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                    isCurrent ? "border-gold-300 bg-gold-300/30" : "border-white/20 bg-ink-950"
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className={`font-display text-lg ${isCurrent ? "text-gold-200" : "text-parchment-100"}`}>
                    {formatBounty(entry.amount)}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
                    {formatDate(entry.issuedAt)}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isCurrent ? "Recompensa vigente" : `Emisión ${index + 1} del cartel`}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function WantedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as { from?: unknown } | null;
  const from = safeRedirect(state?.from, "/wanted");
  const detailQuery = useApiQuery<WantedDetail>(
    (signal) => (id ? fetchWantedById(id, signal) : Promise.reject(new Error("Falta el id del cartel"))),
    [id],
  );
  const wanted = detailQuery.data;

  usePageTitle(wanted ? `${wanted.name} · Se Busca` : "Cartel · Log Pose Console");

  useLayoutEffect(() => {
    scrollInstantly(0);
  }, [id]);

  if (!id) return <DetailMissing from={from} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={from}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-gold-300/35 hover:text-gold-200"
        >
          <IconChevronLeft className="h-4 w-4" />
          Volver al listado
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">
          Se Busca / {wanted?.name ?? "cartel"}
        </span>
      </div>

      {detailQuery.loading && <PosterSkeleton />}

      {!detailQuery.loading && detailQuery.error && detailQuery.error.status === 404 && (
        <DetailMissing from={from} />
      )}

      {!detailQuery.loading && detailQuery.error && detailQuery.error.status !== 404 && (
        <div className="mx-auto max-w-2xl py-8">
          <ErrorPanel
            title="No pudimos abrir este cartel"
            message={detailQuery.error.message}
            onRetry={detailQuery.reload}
            retryAfterSeconds={detailQuery.error.retryAfterSeconds}
            traceId={detailQuery.error.traceId}
          />
        </div>
      )}

      {wanted && (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start">
          <article className="wanted-poster relative overflow-hidden rounded-sm p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)] lg:sticky lg:top-24">
            <div className="pointer-events-none absolute inset-3 border border-ink-900/25" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-4 border border-ink-900/10" aria-hidden="true" />

            <div className="relative text-center">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.42em] text-crimson-800/75">
                Guild de Cazarrecompensas
              </p>
              <h1 className="mt-2 font-display text-4xl uppercase tracking-[0.12em] text-ink-950">Se Busca</h1>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.3em] text-ink-900/45">Recompensa en berries</p>

              <div className="relative mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full border-2 border-ink-900/30 bg-ink-900/[0.06]">
                <span className="absolute inset-2 rounded-full border border-dashed border-ink-900/20" />
                <span className="absolute inset-6 rounded-full border border-ink-900/10" />
                <span className="font-display text-5xl text-ink-900/55">{initials(wanted.name)}</span>
                <span className="absolute -bottom-1 rounded-full border border-ink-900/25 bg-parchment-100 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-900/65">
                  {wanted.status === "AT_LARGE" ? "Prófugo" : wanted.status === "CAPTURED" ? "Capturado" : "Desaparecido"}
                </span>
              </div>

              <h2 className="mt-5 font-display text-3xl leading-tight text-ink-950">{wanted.name}</h2>
              <p className="mt-1 text-sm italic text-ink-900/60">“{wanted.epithet}”</p>

              <div className="mt-4 border-y border-ink-900/20 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-ink-900/45">Recompensa</p>
                <p className="mt-1 font-display text-4xl leading-none text-crimson-800">{formatBounty(wanted.bounty)}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center rounded-full border border-ink-900/20 px-2.5 py-1 text-[10px] text-ink-900/65">
                  {wanted.crew.name}
                </span>
                <span className="inline-flex items-center rounded-full border border-ink-900/20 px-2.5 py-1 text-[10px] text-ink-900/65">
                  {roleLabel(wanted.role)}
                </span>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-ink-900/55">
                <IconMapPin className="h-3.5 w-3.5" />
                Visto por última vez en {wanted.lastSeen.island}
              </p>

              <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.18em] text-ink-900/35">
                Cartel actualizado el {formatDate(wanted.updatedAt)}
              </p>
            </div>
          </article>

          <div className="space-y-4">
            <section className="panel p-6" aria-labelledby="expediente-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Expediente</p>
                  <h2 id="expediente-title" className="mt-2 font-display text-2xl text-parchment-50">
                    Ficha del cazarrecompensas
                  </h2>
                </div>
                <StatusBadge status={wanted.status} />
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    <IconShip className="h-3.5 w-3.5" /> Tripulación
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold text-slate-200">{wanted.crew.name}</dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    <IconUser className="h-3.5 w-3.5" /> Puesto
                  </dt>
                  <dd className="mt-1.5">
                    <RoleBadge role={wanted.role} />
                  </dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">Fruta del diablo</dt>
                  <dd className="mt-1.5">
                    <FruitBadge fruit={wanted.devilFruit?.type ?? null} />
                  </dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">Nivel de amenaza</dt>
                  <dd className="mt-2">
                    <ThreatMeter level={wanted.threatLevel} />
                  </dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    <IconCalendar className="h-3.5 w-3.5" /> Edad
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold text-slate-200">{wanted.age} años</dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    <IconRuler className="h-3.5 w-3.5" /> Altura
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold text-slate-200">{wanted.heightCm} cm</dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Biografía</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{wanted.bio}</p>
              </div>
            </section>

            <section className="panel p-6" aria-labelledby="last-seen-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Última posición conocida</p>
                  <h2 id="last-seen-title" className="mt-2 font-display text-xl text-parchment-50">
                    {wanted.lastSeen.island}
                  </h2>
                </div>
                <Pill tone="sea">
                  <IconMapPin className="h-3 w-3" />
                  {formatRelative(wanted.lastSeen.seenAt)}
                </Pill>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                La Guild registró el avistamiento el {formatDateTime(wanted.lastSeen.seenAt)}. La información
                puede haber cambiado desde entonces: el cartel sigue vigente hasta que el servidor diga lo
                contrario.
              </p>
            </section>

            <BountyHistory wanted={wanted} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-200">¿Listo para volver al archivo?</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  El listado conserva filtros, página y posición de scroll.
                </p>
              </div>
              <Link to={from} className="btn-ghost">
                <IconChevronLeft className="h-4 w-4" />
                Volver al listado
              </Link>
            </div>

            <p className="text-right font-mono text-[9px] uppercase tracking-[0.18em] text-slate-700">
              {threatLabel(wanted.threatLevel)} · actualizado {formatDateTime(wanted.updatedAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
