import type { ReactNode } from "react";
import type { CrewRole, FruitFilter, LogPoseStatus, WantedStatus } from "../types/api";
import { fruitLabel, roleLabel, statusLabel, threatLabel } from "../lib/format";

const statusStyles: Record<WantedStatus, string> = {
  AT_LARGE: "border-crimson-500/35 bg-crimson-500/10 text-rose-200",
  CAPTURED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  MISSING: "border-violet-400/30 bg-violet-400/10 text-violet-200",
};

const statusStylesPaper: Record<WantedStatus, string> = {
  AT_LARGE: "border-crimson-700/40 bg-crimson-700/10 text-crimson-800",
  CAPTURED: "border-emerald-800/35 bg-emerald-800/10 text-emerald-900",
  MISSING: "border-violet-900/30 bg-violet-900/10 text-violet-950",
};

export function StatusBadge({
  status,
  paper = false,
}: {
  status: WantedStatus;
  paper?: boolean;
}) {
  const styles = paper ? statusStylesPaper[status] : statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

export function LogPoseBadge({ status }: { status: LogPoseStatus }) {
  const unlocked = status === "UNLOCKED";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${
        unlocked
          ? "border-sea-400/35 bg-sea-400/10 text-sea-300"
          : "border-gold-400/30 bg-gold-400/[0.07] text-gold-300"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${unlocked ? "bg-sea-400" : "bg-gold-400"}`} />
      {unlocked ? "Log Pose activo" : "Log Pose bloqueado"}
    </span>
  );
}

export function FruitBadge({ fruit, paper = false }: { fruit: FruitFilter | null; paper?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
        paper ? "border-ink-900/15 bg-ink-900/[0.04] text-ink-900/70" : "border-white/10 bg-white/[0.03] text-slate-300"
      }`}
    >
      <span className={paper ? "text-crimson-800/70" : "text-gold-300"}>✦</span>
      {fruitLabel(fruit)}
    </span>
  );
}

export function RoleBadge({ role }: { role: CrewRole }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">
      {roleLabel(role)}
    </span>
  );
}

export function ThreatMeter({ level, paper = false }: { level: number; paper?: boolean }) {
  const safe = Math.max(1, Math.min(5, level));
  return (
    <div className="flex items-center gap-2" aria-label={threatLabel(safe)}>
      <div className="flex items-end gap-1" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={`w-1.5 rounded-sm ${index < safe ? (paper ? "bg-crimson-800" : "bg-gold-300") : paper ? "bg-ink-900/10" : "bg-white/10"}`}
            style={{ height: `${6 + index * 2}px` }}
          />
        ))}
      </div>
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.16em] ${paper ? "text-ink-800/60" : "text-slate-500"}`}
      >
        {threatLabel(safe)}
      </span>
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "sea" }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.03] text-slate-300",
    gold: "border-gold-400/25 bg-gold-400/[0.07] text-gold-200",
    sea: "border-sea-400/25 bg-sea-400/[0.07] text-sea-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
