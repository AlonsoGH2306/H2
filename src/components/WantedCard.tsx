import { Link } from "react-router-dom";
import type { WantedSummary } from "../types/api";
import { formatBounty, formatDate, initials } from "../lib/format";
import { FruitBadge, StatusBadge, ThreatMeter } from "./Badges";
import { IconArrowRight, IconMapPin } from "./icons";

export function WantedCard({
  wanted,
  from,
  onOpen,
}: {
  wanted: WantedSummary;
  from: string;
  onOpen?: () => void;
}) {
  return (
    <Link
      to={`/wanted/${encodeURIComponent(wanted.id)}`}
      state={{ from }}
      onClick={onOpen}
      className="wanted-card group flex h-full flex-col outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.9)] focus-visible:ring-2 focus-visible:ring-gold-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.36em] text-crimson-800/75">Se Busca</p>
          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-ink-900/40">Guild de Cazarrecompensas</p>
        </div>
        <StatusBadge status={wanted.status} paper />
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink-900/25 bg-ink-900/[0.06]">
          <span className="absolute inset-1 rounded-full border border-dashed border-ink-900/20" />
          <span className="font-display text-xl text-ink-900/70">{initials(wanted.name)}</span>
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-display text-xl leading-tight text-ink-950">{wanted.name}</h2>
          <p className="mt-1 text-xs italic text-ink-900/60">“{wanted.epithet}”</p>
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-900/50">
            <IconMapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{wanted.lastSeenIsland}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 border-y border-ink-900/15 py-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-ink-900/45">Recompensa</p>
        <p className="mt-0.5 font-display text-2xl leading-none text-crimson-800">{formatBounty(wanted.bounty)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-full border border-ink-900/15 bg-ink-900/[0.04] px-2.5 py-1 text-[10px] text-ink-900/70">
          {wanted.crew.name}
        </span>
        <FruitBadge fruit={wanted.devilFruit?.type ?? null} paper />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div>
          <ThreatMeter level={wanted.threatLevel} paper />
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-900/35">
            Actualizado {formatDate(wanted.updatedAt)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-900/60 transition group-hover:text-crimson-800">
          Ver cartel
          <IconArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
