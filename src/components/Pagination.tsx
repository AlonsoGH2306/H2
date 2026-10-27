import type { PageSize } from "../types/api";
import { formatNumber } from "../lib/format";
import { IconChevronLeft, IconChevronRight } from "./icons";

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index);
  const pages = new Set<number>([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 0 && page < total).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let previous = -1;
  for (const page of sorted) {
    if (previous >= 0 && page - previous > 1) result.push("ellipsis");
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  disabled = false,
  onPageChange,
  onSizeChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  size: PageSize;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onSizeChange?: (size: PageSize) => void;
}) {
  const safeTotal = Math.max(totalPages, 1);
  const pages = pageWindow(page, safeTotal);
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex flex-col gap-3 border-t border-white/[0.07] px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500" aria-live="polite">
          {from}–{to} de {formatNumber(totalElements)} carteles
        </p>
        {onSizeChange && (
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Filas
            <select
              value={size}
              disabled={disabled}
              onChange={(event) => onSizeChange(Number(event.target.value) as PageSize)}
              aria-label="Carteles por página"
              className="rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-[11px] text-slate-200 outline-none transition focus:border-gold-300/50 disabled:opacity-45"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        )}
      </div>

      {totalPages > 0 && (
        <nav className="flex flex-wrap items-center gap-1" aria-label="Paginación de carteles">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 0}
            aria-label="Página anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition enabled:hover:border-gold-300/40 enabled:hover:text-gold-200 disabled:opacity-30"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((entry, index) =>
            entry === "ellipsis" ? (
              <span key={`gap-${index}`} className="px-1 font-mono text-xs text-slate-600">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                disabled={disabled}
                aria-current={entry === page ? "page" : undefined}
                aria-label={`Página ${entry + 1}`}
                className={`h-9 min-w-9 rounded-lg border px-2 font-mono text-xs transition ${
                  entry === page
                    ? "border-gold-300/45 bg-gold-300/10 text-gold-200"
                    : "border-white/10 text-slate-400 enabled:hover:border-white/25 enabled:hover:text-slate-100"
                } disabled:opacity-45`}
              >
                {entry + 1}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= safeTotal - 1}
            aria-label="Página siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition enabled:hover:border-gold-300/40 enabled:hover:text-gold-200 disabled:opacity-30"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
