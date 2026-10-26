import type { ReactNode } from "react";
import { Brand, LogPoseMark } from "./Brand";
import { IconAnchor, IconMapPin, IconStamp } from "./icons";

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-gold-400/[0.06] blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[560px] w-[560px] rounded-full bg-sea-400/[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] px-10 py-10 lg:flex xl:px-14">
          <Brand compact />

          <div className="relative py-10">
            <div className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full border border-gold-400/10" aria-hidden="true">
              <span className="absolute inset-8 rounded-full border border-dashed border-gold-400/15" />
              <span className="absolute inset-20 rounded-full border border-gold-400/10" />
              <span className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-gold-400/15 to-transparent" />
              <span className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-gold-400/15 to-transparent" />
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-gold-400/75">East Blue · bitácora 001</p>
            <h1 className="mt-5 max-w-md font-display text-4xl leading-[1.08] text-parchment-50 xl:text-5xl">
              El mar no perdona a quien navega sin rumbo.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
              Registra tu tripulación, consulta los carteles de la Guild y mantén el Log Pose apuntando
              siempre a la próxima isla.
            </p>

            <div className="mt-10 grid max-w-md gap-3">
              {[
                { icon: <IconStamp className="h-4 w-4" />, title: "Carteles vivos", text: "Filtros, orden y paginación real del servidor." },
                { icon: <IconMapPin className="h-4 w-4" />, title: "Rumbo compartido", text: "Cada filtro vive en la URL que compartes." },
                { icon: <IconAnchor className="h-4 w-4" />, title: "Sesión de tripulación", text: "Una cuenta, todos los nakamas." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold-400/20 bg-gold-400/[0.06] text-gold-300">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="max-w-sm font-display text-sm italic text-slate-500">
            “El Log Pose no elige el camino. Solo te dice cuál es el siguiente.”
          </p>
        </aside>

        <section className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="mb-10 lg:hidden">
            <Brand compact />
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <LogPoseMark className="h-10 w-10" />
              <div className="h-px flex-1 bg-gradient-to-r from-gold-400/30 to-transparent" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-gold-400/75">{eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl text-parchment-50">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{subtitle}</p>

            <div className="mt-8">{children}</div>
            <div className="mt-8 text-sm text-slate-500">{footer}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
