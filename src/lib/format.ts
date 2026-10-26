import type { CrewRole, FruitFilter, FruitType, SortOption, WantedStatus } from "../types/api";

const numberFormatter = new Intl.NumberFormat("es-PE");
const currencyFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("es-PE", { numeric: "auto" });

export const STATUS_LABELS: Record<WantedStatus, string> = {
  AT_LARGE: "Prófugo",
  CAPTURED: "Capturado",
  MISSING: "Desaparecido",
};

export const FRUIT_LABELS: Record<FruitFilter, string> = {
  PARAMECIA: "Paramecia",
  ZOAN: "Zoan",
  LOGIA: "Logia",
  NONE: "Sin fruta",
};

export const ROLE_LABELS: Record<CrewRole, string> = {
  CAPTAIN: "Capitán",
  FIRST_MATE: "Primer oficial",
  NAVIGATOR: "Navegante",
  SNIPER: "Francotirador",
  COOK: "Cocinero",
  DOCTOR: "Médico",
  SHIPWRIGHT: "Carpintero",
  MUSICIAN: "Músico",
  ARCHAEOLOGIST: "Arqueólogo",
  HELMSMAN: "Timonel",
  FIGHTER: "Luchador",
};

export const SORT_LABELS: Record<SortOption, string> = {
  "bounty,desc": "Recompensa (mayor)",
  "name,asc": "Nombre (A–Z)",
  "updatedAt,desc": "Actualización (reciente)",
};

export const FRUIT_ORDER: readonly FruitType[] = ["PARAMECIA", "ZOAN", "LOGIA"];

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatBounty(value: number): string {
  return `฿ ${currencyFormatter.format(value)}`;
}

export function formatCompactBounty(value: number): string {
  if (value >= 1_000_000_000) return `฿ ${(value / 1_000_000_000).toFixed(1)} mil M`;
  if (value >= 1_000_000) return `฿ ${(value / 1_000_000).toFixed(1)} M`;
  return formatBounty(value);
}

function parseDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string): string {
  const date = parseDate(iso);
  return date ? dateFormatter.format(date) : "—";
}

export function formatDateTime(iso: string): string {
  const date = parseDate(iso);
  return date ? dateTimeFormatter.format(date) : "—";
}

export function formatRelative(iso: string): string {
  const date = parseDate(iso);
  if (!date) return "—";
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return "hace un momento";
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400) return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 2_592_000) return relativeFormatter.format(Math.round(diffSeconds / 86_400), "day");
  return formatDate(iso);
}

export function statusLabel(status: WantedStatus): string {
  return STATUS_LABELS[status];
}

export function fruitLabel(fruit: FruitFilter | FruitType | null): string {
  if (!fruit) return "Sin fruta";
  return FRUIT_LABELS[fruit];
}

export function roleLabel(role: CrewRole): string {
  return ROLE_LABELS[role];
}

export function sortLabel(sort: SortOption): string {
  return SORT_LABELS[sort];
}

export function threatLabel(level: number): string {
  return `Amenaza ${level}/5`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
