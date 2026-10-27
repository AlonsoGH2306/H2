import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorPanel, Skeleton } from "../components/Feedback";
import { IconClose, IconRefresh, IconSearch } from "../components/icons";
import { Pagination } from "../components/Pagination";
import { WantedCard } from "../components/WantedCard";
import { useApiQuery } from "../hooks/useApiQuery";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchCrews, fetchWanted } from "../lib/api";
import {
  formatNumber,
  FRUIT_LABELS,
  fruitLabel,
  STATUS_LABELS,
  SORT_LABELS,
} from "../lib/format";
import { currentPath } from "../lib/navigation";
import { scrollInstantly } from "../lib/scroll";
import {
  FRUIT_FILTERS,
  hasActiveFilters,
  parseWantedQuery,
  serializeWantedQuery,
  serializeWantedQueryKey,
} from "../lib/wanted-query";
import type { Crew, PageSize, WantedQuery, WantedStatus } from "../types/api";

const STATUS_OPTIONS: readonly WantedStatus[] = ["AT_LARGE", "CAPTURED", "MISSING"];

function WantedGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex h-[356px] flex-col rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="mt-5 flex gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-6 h-16" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-auto flex justify-between pt-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  disabled = false,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="field"
      >
        {children}
      </select>
    </div>
  );
}

export function WantedListPage() {
  usePageTitle("Se Busca · Log Pose Console");
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const parsed = useMemo(() => parseWantedQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  const query = parsed.query;
  const queryKey = serializeWantedQueryKey(query);
  const queryRef = useRef<WantedQuery>(query);
  queryRef.current = query;

  const location = useLocation();
  const listRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
  const [searchText, setSearchText] = useState(query.q);
  const debouncedSearch = useDebouncedValue(searchText, 400);

  const crewsQuery = useApiQuery<Crew[]>((signal) => fetchCrews(signal), []);
  const wantedQuery = useApiQuery((signal) => fetchWanted(query, signal), [queryKey]);
  const wanted = wantedQuery.data;

  // La URL es la fuente de verdad. Si trae valores fuera del contrato, se
  // reemplaza por una versión limpia sin romper la vista.
  useEffect(() => {
    if (!parsed.repaired) return;
    setSearchParams(serializeWantedQuery(query), { replace: true });
  }, [parsed.repaired, query, setSearchParams]);

  // La página pedida puede dejar de existir al cambiar filtros o al compartir
  // una URL vieja. El servidor devuelve totalPages; aquí corregimos el rumbo.
  useEffect(() => {
    if (!wanted) return;
    if (wanted.totalPages === 0 && query.page !== 0) {
      setSearchParams(serializeWantedQuery({ ...query, page: 0 }), { replace: true });
      return;
    }
    if (wanted.totalPages > 0 && query.page >= wanted.totalPages) {
      setSearchParams(serializeWantedQuery({ ...query, page: wanted.totalPages - 1 }), { replace: true });
    }
  }, [wanted, query, setSearchParams]);

  // Un crewId que no existe en el workspace deja una página vacía. Cuando ya
  // conocemos las tripulaciones, retiramos el filtro inválido.
  useEffect(() => {
    if (!crewsQuery.data || !query.crewId) return;
    if (!crewsQuery.data.some((crew) => crew.id === query.crewId)) {
      setSearchParams(serializeWantedQuery({ ...query, crewId: null, page: 0 }), { replace: true });
    }
  }, [crewsQuery.data, query, setSearchParams]);

  // Sincroniza el input cuando la URL cambia por atrás/adelante.
  useEffect(() => {
    setSearchText(query.q);
  }, [query.q]);

  // Debounce: una sola request después de que el usuario deja de escribir.
  useEffect(() => {
    const current = queryRef.current;
    const next = debouncedSearch.trim();
    if (next === current.q) return;
    setSearchParams(serializeWantedQuery({ ...current, q: next, page: 0 }), { replace: true });
  }, [debouncedSearch, setSearchParams]);

  // Al volver del detalle, restaura la posición exacta del listado antes de
  // que el navegador pinte la página.
  useLayoutEffect(() => {
    if (!wanted || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(`logpose:scroll:${location.pathname}${location.search}`);
      if (!raw) return;
      sessionStorage.removeItem(`logpose:scroll:${location.pathname}${location.search}`);
      const top = Number(raw);
      if (Number.isFinite(top) && top >= 0) {
        scrollInstantly(top);
      }
    } catch {
      // sessionStorage puede estar bloqueado; el listado sigue funcionando.
    }
  }, [wanted, location.pathname, location.search]);

  const scrollToResults = useCallback(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, []);

  const applyFilter = useCallback(
    (patch: Partial<WantedQuery>) => {
      const next = { ...queryRef.current, q: searchText.trim(), ...patch, page: 0 };
      setSearchParams(serializeWantedQuery(next));
      scrollToResults();
    },
    [searchText, setSearchParams, scrollToResults],
  );

  const goToPage = useCallback(
    (page: number) => {
      const next = { ...queryRef.current, page: Math.max(0, page) };
      setSearchParams(serializeWantedQuery(next));
      scrollToResults();
    },
    [setSearchParams, scrollToResults],
  );

  const changeSize = useCallback(
    (size: PageSize) => {
      setSearchParams(serializeWantedQuery({ ...queryRef.current, size, page: 0 }));
      scrollToResults();
    },
    [setSearchParams, scrollToResults],
  );

  const changeSort = useCallback(
    (sort: WantedQuery["sort"]) => {
      setSearchParams(serializeWantedQuery({ ...queryRef.current, sort, page: 0 }));
      scrollToResults();
    },
    [setSearchParams, scrollToResults],
  );

  const clearFilters = useCallback(() => {
    setSearchText("");
    setSearchParams(
      serializeWantedQuery({ ...queryRef.current, status: null, crewId: null, fruit: null, q: "", page: 0 }),
    );
    scrollToResults();
  }, [setSearchParams, scrollToResults]);

  const applySearch = useCallback(() => {
    const next = searchText.trim();
    if (next === queryRef.current.q) return;
    setSearchParams(serializeWantedQuery({ ...queryRef.current, q: next, page: 0 }), { replace: true });
    scrollToResults();
  }, [searchText, setSearchParams, scrollToResults]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch();
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchParams(serializeWantedQuery({ ...queryRef.current, q: "", page: 0 }), { replace: true });
  };

  const pageOutOfRange =
    wanted !== null &&
    ((wanted.totalPages === 0 && query.page > 0) ||
      (wanted.totalPages > 0 && query.page >= wanted.totalPages));

  const activeFilters = [
    query.status
      ? { key: "status" as const, label: STATUS_LABELS[query.status], clear: () => applyFilter({ status: null }) }
      : null,
    query.crewId
      ? {
          key: "crewId" as const,
          label: crewsQuery.data?.find((crew) => crew.id === query.crewId)?.name ?? "Tripulación",
          clear: () => applyFilter({ crewId: null }),
        }
      : null,
    query.fruit
      ? { key: "fruit" as const, label: FRUIT_LABELS[query.fruit], clear: () => applyFilter({ fruit: null }) }
      : null,
    query.q ? { key: "q" as const, label: `“${query.q}”`, clear: () => applyFilter({ q: "" }) } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-crimson-500/30 bg-crimson-500/[0.08] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-200">
              Archivo de la Guild
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">East Blue</span>
          </div>
          <h1 className="mt-3 font-display text-4xl leading-none text-parchment-50">Se Busca</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Cada cartel es una coordenada. Filtra, ordena y comparte el rumbo sin perder la página.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-right">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">Resultados</p>
            <p className="font-display text-2xl text-parchment-100">
              {wanted ? formatNumber(wanted.totalElements) : "—"}
            </p>
          </div>
          <span className="h-10 w-px bg-white/10" aria-hidden="true" />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">Página</p>
            <p className="font-display text-2xl text-parchment-100">
              {wanted ? `${query.page + 1} / ${Math.max(wanted.totalPages, 1)}` : "—"}
            </p>
          </div>
        </div>
      </header>

      <section className="panel p-4 sm:p-5" aria-label="Filtros de búsqueda">
        <form onSubmit={handleSearchSubmit} role="search" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="wanted-search" className="field-label">
              Buscar por nombre o epíteto
            </label>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="wanted-search"
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Ej. Akane, Ancla Roja…"
                maxLength={100}
                enterKeyHint="search"
                autoComplete="off"
                className="field pl-9 pr-10"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200"
                  aria-label="Limpiar búsqueda"
                >
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <FilterSelect
              id="filter-status"
              label="Estado"
              value={query.status ?? ""}
              onChange={(value) => applyFilter({ status: value ? (value as WantedStatus) : null })}
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="lg:col-span-2">
            <FilterSelect
              id="filter-crew"
              label="Tripulación"
              value={query.crewId ?? ""}
              onChange={(value) => applyFilter({ crewId: value || null })}
              disabled={crewsQuery.loading}
            >
              <option value="">Todas</option>
              {query.crewId && !crewsQuery.data?.some((crew) => crew.id === query.crewId) && (
                <option value={query.crewId}>Tripulación seleccionada</option>
              )}
              {crewsQuery.data?.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="lg:col-span-2">
            <FilterSelect
              id="filter-fruit"
              label="Fruta del diablo"
              value={query.fruit ?? ""}
              onChange={(value) => applyFilter({ fruit: value ? (value as WantedQuery["fruit"]) : null })}
            >
              <option value="">Todas</option>
              {FRUIT_FILTERS.map((fruit) => (
                <option key={fruit} value={fruit}>
                  {fruitLabel(fruit)}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="lg:col-span-2">
            <FilterSelect
              id="filter-sort"
              label="Ordenar por"
              value={query.sort}
              onChange={(value) => changeSort(value as WantedQuery["sort"])}
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FilterSelect>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
          {activeFilters.length > 0 ? (
            <>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">Filtros activos</span>
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={filter.clear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/25 bg-gold-300/[0.07] px-2.5 py-1 text-[11px] text-gold-200 transition hover:border-gold-300/45 hover:bg-gold-300/[0.12]"
                >
                  {filter.label}
                  <IconClose className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-[11px] font-semibold text-slate-400 underline-offset-4 transition hover:text-slate-100 hover:underline"
              >
                Limpiar todo
              </button>
            </>
          ) : (
            <p className="text-[11px] text-slate-600">
              Sin filtros activos. La URL guarda esta combinación para que puedas compartirla.
            </p>
          )}
        </div>

        {crewsQuery.error && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-crimson-500/20 bg-crimson-500/[0.05] px-3 py-2 text-[11px] text-rose-200/80">
            No se pudieron cargar las tripulaciones para el filtro.
            <button
              type="button"
              onClick={crewsQuery.reload}
              className="inline-flex items-center gap-1 font-semibold text-rose-100 underline-offset-2 hover:underline"
            >
              <IconRefresh className="h-3 w-3" />
              Reintentar
            </button>
          </div>
        )}
      </section>

      <section ref={listRef} className="scroll-mt-24" aria-busy={wantedQuery.loading}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600" aria-live="polite">
            {wantedQuery.loading
              ? "Consultando el archivo…"
              : wanted
                ? `${formatNumber(wanted.totalElements)} carteles en el archivo`
                : "Sin datos"}
          </p>
          {query.page > 0 && wanted && (
            <button
              type="button"
              onClick={() => goToPage(0)}
              className="text-[11px] text-slate-500 underline-offset-4 transition hover:text-slate-200 hover:underline"
            >
              Volver a la primera página
            </button>
          )}
        </div>

        <div className="min-h-[520px]">
          {wantedQuery.loading || pageOutOfRange ? (
            <WantedGridSkeleton count={8} />
          ) : wantedQuery.error ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="w-full max-w-xl">
                <ErrorPanel
                  title="El archivo no respondió"
                  message={wantedQuery.error.message}
                  onRetry={wantedQuery.reload}
                  retryAfterSeconds={wantedQuery.error.retryAfterSeconds}
                  traceId={wantedQuery.error.traceId}
                />
              </div>
            </div>
          ) : wanted && wanted.content.length === 0 ? (
            <EmptyState
              title={hasActiveFilters(query) ? "Ningún cartel coincide con ese rumbo" : "El archivo está vacío"}
              message={
                hasActiveFilters(query)
                  ? "Prueba con otro estado, otra tripulación o una búsqueda más corta. Los filtros se combinan entre sí."
                  : "Todavía no hay carteles de Se Busca en este workspace. La Guild los publicará pronto."
              }
              icon={<IconSearch className="h-6 w-6" />}
              action={
                hasActiveFilters(query) ? (
                  <button type="button" onClick={clearFilters} className="btn-ghost">
                    Limpiar filtros
                  </button>
                ) : undefined
              }
            />
          ) : wanted ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {wanted.content.map((item) => (
                <WantedCard
                  key={item.id}
                  wanted={item}
                  from={currentPath(location)}
                  onOpen={() => {
                    try {
                      sessionStorage.setItem(`logpose:scroll:${location.pathname}${location.search}`, String(window.scrollY));
                    } catch {
                      // Si el storage está bloqueado, el listado sigue funcionando.
                    }
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-2 min-h-[72px]">
          {wanted && !wantedQuery.loading && !wantedQuery.error && !pageOutOfRange && (
            <Pagination
              page={query.page}
              totalPages={wanted.totalPages}
              totalElements={wanted.totalElements}
              size={query.size}
              disabled={wantedQuery.loading}
              onPageChange={goToPage}
              onSizeChange={changeSize}
            />
          )}
        </div>
      </section>
    </div>
  );
}
