import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "./Brand";
import { IconLogout } from "./icons";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/wanted", label: "Se Busca" },
];

export function AppShell() {
  const { user, team, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-ink-950">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold-300 focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-950"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
          <Brand compact />

          <nav className="order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto" aria-label="Navegación principal">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-gold-300/10 text-gold-200"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400 md:inline-flex">
              {team?.code ?? "—"}
            </span>
            <span className="hidden max-w-[160px] truncate text-xs text-slate-400 sm:block" title={user?.name}>
              {user?.name ?? "Tripulación"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-crimson-500/40 hover:bg-crimson-500/10 hover:text-rose-200"
              aria-label="Cerrar sesión"
            >
              <IconLogout className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-1 px-4 pb-8 pt-4 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Guild de Cazarrecompensas · Log Pose Console</p>
        <p className="font-mono uppercase tracking-[0.18em]">East Blue · bitácora de la tripulación</p>
      </footer>
    </div>
  );
}
