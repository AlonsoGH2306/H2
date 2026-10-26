import { Link } from "react-router-dom";
import { IconCompass } from "./icons";

export function LogPoseMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-2xl border border-gold-400/30 bg-gold-400/[0.08] text-gold-300 shadow-[0_0_40px_-18px_rgba(217,164,65,0.8)] ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-1 rounded-xl border border-gold-400/15" />
      <IconCompass className="relative h-[58%] w-[58%]" />
    </span>
  );
}

export function Brand({ to = "/dashboard", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gold-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
      aria-label="Log Pose Console, ir al dashboard"
    >
      <LogPoseMark className={compact ? "h-9 w-9" : "h-11 w-11"} />
      <span className="leading-none">
        <span className="block font-mono text-[9px] uppercase tracking-[0.38em] text-gold-400/80">
          Guild de Cazarrecompensas
        </span>
        <span className={`mt-1 block font-display tracking-wide text-parchment-50 ${compact ? "text-base" : "text-lg"}`}>
          Log Pose <span className="text-gold-300">Console</span>
        </span>
      </span>
    </Link>
  );
}
