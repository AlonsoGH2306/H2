import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "../components/Brand";
import { IconArrowRight, IconCompass } from "../components/icons";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFoundPage() {
  usePageTitle("404 · Log Pose Console");
  const { status } = useAuth();
  const authenticated = status === "authenticated";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/[0.08]" />
        <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gold-400/[0.12]" />
        <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/[0.03] blur-2xl" />
      </div>

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Brand />
        {authenticated ? (
          <Link to="/dashboard" className="text-xs font-semibold text-slate-400 transition hover:text-gold-200">
            Volver a la consola
          </Link>
        ) : (
          <Link to="/login" className="text-xs font-semibold text-slate-400 transition hover:text-gold-200">
            Iniciar sesión
          </Link>
        )}
      </header>

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/[0.04]">
          <span className="absolute inset-2 rounded-full border border-dashed border-gold-400/20" />
          <IconCompass className="h-10 w-10 text-gold-300/70" />
        </div>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.44em] text-gold-400/70">Error 404</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-parchment-50 sm:text-5xl">
          Esta isla no aparece en el mapa.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
          La ruta que buscas no existe en esta consola. Puede que el enlace esté incompleto o que el
          cartel haya cambiado de coordenadas.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to={authenticated ? "/dashboard" : "/login"} className="btn-primary">
            {authenticated ? "Volver al dashboard" : "Ir al login"}
            <IconArrowRight className="h-4 w-4" />
          </Link>
          {authenticated && (
            <Link to="/wanted" className="btn-ghost">
              Abrir Se Busca
            </Link>
          )}
        </div>
      </main>

      <footer className="relative mx-auto w-full max-w-7xl px-5 pb-8 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 sm:px-8">
        Guild de Cazarrecompensas · Log Pose Console
      </footer>
    </div>
  );
}
