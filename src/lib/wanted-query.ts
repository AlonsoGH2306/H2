import type {
  FruitFilter,
  PageSize,
  SortOption,
  WantedQuery,
  WantedStatus,
} from "../types/api";
import { PAGE_SIZES, SORT_OPTIONS, WANTED_STATUSES } from "./api";

export const DEFAULT_PAGE_SIZE: PageSize = 20;
export const DEFAULT_SORT: SortOption = "bounty,desc";
export const MAX_SEARCH_LENGTH = 100;
export const MAX_CREW_ID_LENGTH = 200;

export const FRUIT_FILTERS: readonly FruitFilter[] = ["PARAMECIA", "ZOAN", "LOGIA", "NONE"];

export interface ParsedWantedQuery {
  query: WantedQuery;
  repaired: boolean;
}

function isPageSize(value: number): value is PageSize {
  return PAGE_SIZES.includes(value as PageSize);
}

function isSort(value: string): value is SortOption {
  return SORT_OPTIONS.includes(value as SortOption);
}

function isStatus(value: string): value is WantedStatus {
  return WANTED_STATUSES.includes(value as WantedStatus);
}

function isFruit(value: string): value is FruitFilter {
  return FRUIT_FILTERS.includes(value as FruitFilter);
}

function readPage(raw: string | null): { value: number; repaired: boolean } {
  if (raw === null || raw.trim() === "") return { value: 0, repaired: false };
  if (!/^\d+$/.test(raw.trim())) return { value: 0, repaired: true };
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000) {
    return { value: 0, repaired: true };
  }
  return { value, repaired: false };
}

export function parseWantedQuery(searchParams: URLSearchParams): ParsedWantedQuery {
  let repaired = false;

  const page = readPage(searchParams.get("page"));
  repaired ||= page.repaired;

  const sizeRaw = searchParams.get("size");
  const sizeNumber = sizeRaw === null || sizeRaw.trim() === "" ? NaN : Number(sizeRaw);
  const size = isPageSize(sizeNumber) ? sizeNumber : DEFAULT_PAGE_SIZE;
  repaired ||= sizeRaw !== null && sizeRaw.trim() !== "" && !isPageSize(sizeNumber);

  const statusRaw = searchParams.get("status")?.trim() ?? "";
  const status = isStatus(statusRaw) ? statusRaw : null;
  repaired ||= statusRaw !== "" && !isStatus(statusRaw);

  const fruitRaw = searchParams.get("fruit")?.trim() ?? "";
  const fruit = isFruit(fruitRaw) ? fruitRaw : null;
  repaired ||= fruitRaw !== "" && !isFruit(fruitRaw);

  const sortRaw = searchParams.get("sort")?.trim() ?? "";
  const sort = isSort(sortRaw) ? sortRaw : DEFAULT_SORT;
  repaired ||= sortRaw !== "" && !isSort(sortRaw);

  const qRaw = searchParams.get("q") ?? "";
  let q = qRaw.trim();
  if (q.length > MAX_SEARCH_LENGTH) {
    q = q.slice(0, MAX_SEARCH_LENGTH);
    repaired = true;
  }
  if (q !== qRaw) repaired = true;

  const crewIdRaw = searchParams.get("crewId")?.trim() ?? "";
  let crewId: string | null = crewIdRaw.length > 0 ? crewIdRaw : null;
  if (crewId && crewId.length > MAX_CREW_ID_LENGTH) {
    crewId = null;
    repaired = true;
  }
  if (crewIdRaw !== "" && crewIdRaw !== crewId) repaired = true;

  return {
    query: { page: page.value, size, status, crewId, fruit, q, sort },
    repaired,
  };
}

export function serializeWantedQuery(query: WantedQuery): URLSearchParams {
  const search = new URLSearchParams();
  if (query.page > 0) search.set("page", String(query.page));
  if (query.size !== DEFAULT_PAGE_SIZE) search.set("size", String(query.size));
  if (query.status) search.set("status", query.status);
  if (query.crewId) search.set("crewId", query.crewId);
  if (query.fruit) search.set("fruit", query.fruit);
  if (query.q) search.set("q", query.q);
  if (query.sort !== DEFAULT_SORT) search.set("sort", query.sort);
  return search;
}

export function serializeWantedQueryKey(query: WantedQuery): string {
  return serializeWantedQuery(query).toString();
}

export function hasActiveFilters(query: WantedQuery): boolean {
  return Boolean(query.status || query.crewId || query.fruit || query.q);
}
