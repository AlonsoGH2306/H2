import type {
  ApiErrorDetail,
  AuthSession,
  Crew,
  DashboardSummary,
  DevilFruit,
  FruitType,
  LogPose,
  MeResponse,
  PageSize,
  SortOption,
  Team,
  User,
  WantedDetail,
  WantedPage,
  WantedQuery,
  WantedStatus,
  WantedSummary,
  CrewRole,
} from "../types/api";
import { getToken } from "./session";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
  typeof RAW_BASE_URL === "string" ? RAW_BASE_URL.trim().replace(/\/+$/, "") : "";

/** La cola de inspección del CP3 vive en el origen de la API, no bajo /api/v1. */
export function getReverseMountainUrl(): string | null {
  if (!API_BASE_URL) return null;
  try {
    return `${new URL(API_BASE_URL).origin}/reverse-mountain`;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly traceId: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    traceId: string | null = null,
    retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.traceId = traceId;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

class ContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
}

interface ErrorPayload {
  code: string;
  message: string;
  traceId: string | null;
  details: ApiErrorDetail[];
  retryAfterSeconds: number | null;
}

function fail(path: string): never {
  throw new ContractError(`La API devolvió un dato inválido en "${path}".`);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path);
  return value as Record<string, unknown>;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== "string") fail(path);
  return value;
}

function asInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) fail(path);
  return value;
}

function asBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(path);
  return value;
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) fail(path);
  return value as T;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path);
  return value;
}

function textAt(record: Record<string, unknown>, key: string, path: string): string {
  return asString(record[key], `${path}.${key}`);
}

function intAt(record: Record<string, unknown>, key: string, path: string): number {
  return asInteger(record[key], `${path}.${key}`);
}

const WANTED_STATUSES: readonly WantedStatus[] = ["AT_LARGE", "CAPTURED", "MISSING"];
const FRUIT_TYPES: readonly FruitType[] = ["PARAMECIA", "ZOAN", "LOGIA"];
const CREW_ROLES: readonly CrewRole[] = [
  "CAPTAIN",
  "FIRST_MATE",
  "NAVIGATOR",
  "SNIPER",
  "COOK",
  "DOCTOR",
  "SHIPWRIGHT",
  "MUSICIAN",
  "ARCHAEOLOGIST",
  "HELMSMAN",
  "FIGHTER",
];
const SORT_OPTIONS: readonly SortOption[] = ["bounty,desc", "name,asc", "updatedAt,desc"];
const PAGE_SIZES: readonly PageSize[] = [10, 20, 50];

function parseUser(value: unknown, path = "user"): User {
  const record = asRecord(value, path);
  return {
    id: textAt(record, "id", path),
    name: textAt(record, "name", path),
    email: textAt(record, "email", path),
  };
}

function parseTeam(value: unknown, path = "team"): Team {
  const record = asRecord(value, path);
  return {
    code: textAt(record, "code", path),
    name: textAt(record, "name", path),
  };
}

function parseDevilFruit(value: unknown, path: string): DevilFruit | null {
  if (value === null) return null;
  const record = asRecord(value, path);
  return {
    name: textAt(record, "name", path),
    type: asEnum(record.type, FRUIT_TYPES, `${path}.type`),
  };
}

export function parseWantedSummary(value: unknown, path = "wanted"): WantedSummary {
  const record = asRecord(value, path);
  const crew = asRecord(record.crew, `${path}.crew`);
  const threatLevel = intAt(record, "threatLevel", path);
  if (threatLevel < 1 || threatLevel > 5) fail(`${path}.threatLevel`);

  return {
    id: textAt(record, "id", path),
    name: textAt(record, "name", path),
    epithet: textAt(record, "epithet", path),
    bounty: intAt(record, "bounty", path),
    status: asEnum(record.status, WANTED_STATUSES, `${path}.status`),
    crew: {
      id: textAt(crew, "id", `${path}.crew`),
      name: textAt(crew, "name", `${path}.crew`),
    },
    role: asEnum(record.role, CREW_ROLES, `${path}.role`),
    devilFruit: parseDevilFruit(record.devilFruit, `${path}.devilFruit`),
    threatLevel,
    lastSeenIsland: textAt(record, "lastSeenIsland", path),
    updatedAt: textAt(record, "updatedAt", path),
  };
}

function parseBountyHistory(value: unknown, path: string): { amount: number; issuedAt: string }[] {
  return asArray(value, path).map((entry, index) => {
    const record = asRecord(entry, `${path}[${index}]`);
    return {
      amount: intAt(record, "amount", `${path}[${index}]`),
      issuedAt: textAt(record, "issuedAt", `${path}[${index}]`),
    };
  });
}

export function parseWantedDetail(value: unknown): WantedDetail {
  const path = "wantedDetail";
  const summary = parseWantedSummary(value, path);
  const record = asRecord(value, path);
  const lastSeen = asRecord(record.lastSeen, `${path}.lastSeen`);

  return {
    ...summary,
    age: intAt(record, "age", path),
    heightCm: intAt(record, "heightCm", path),
    bio: textAt(record, "bio", path),
    lastSeen: {
      island: textAt(lastSeen, "island", `${path}.lastSeen`),
      seenAt: textAt(lastSeen, "seenAt", `${path}.lastSeen`),
    },
    bountyHistory: parseBountyHistory(record.bountyHistory, `${path}.bountyHistory`),
  };
}

export function parseWantedPage(value: unknown): WantedPage {
  const path = "wantedPage";
  const record = asRecord(value, path);
  const content = asArray(record.content, `${path}.content`).map((item, index) =>
    parseWantedSummary(item, `${path}.content[${index}]`),
  );
  const totalElements = intAt(record, "totalElements", path);
  const totalPages = intAt(record, "totalPages", path);
  const page = intAt(record, "page", path);
  const size = intAt(record, "size", path);
  if (totalElements < 0 || totalPages < 0 || page < 0 || size < 1) fail(path);

  return { content, totalElements, totalPages, page, size };
}

export function parseCrew(value: unknown): Crew {
  const path = "crew";
  const record = asRecord(value, path);
  return {
    id: textAt(record, "id", path),
    name: textAt(record, "name", path),
    shipName: textAt(record, "shipName", path),
    jollyRogerColor: textAt(record, "jollyRogerColor", path),
    memberCount: intAt(record, "memberCount", path),
    totalBounty: intAt(record, "totalBounty", path),
  };
}

export function parseDashboardSummary(value: unknown): DashboardSummary {
  const path = "dashboardSummary";
  const record = asRecord(value, path);
  const wanted = asRecord(record.wanted, `${path}.wanted`);
  const byStatus = asRecord(wanted.byStatus, `${path}.wanted.byStatus`);
  const byFruit = asRecord(wanted.byFruit, `${path}.wanted.byFruit`);
  const crews = asRecord(record.crews, `${path}.crews`);
  const mostWantedRaw = crews.mostWanted;

  return {
    team: parseTeam(record.team, `${path}.team`),
    wanted: {
      total: intAt(wanted, "total", `${path}.wanted`),
      totalBounty: intAt(wanted, "totalBounty", `${path}.wanted`),
      averageBounty: intAt(wanted, "averageBounty", `${path}.wanted`),
      byStatus: {
        AT_LARGE: intAt(byStatus, "AT_LARGE", `${path}.wanted.byStatus`),
        CAPTURED: intAt(byStatus, "CAPTURED", `${path}.wanted.byStatus`),
        MISSING: intAt(byStatus, "MISSING", `${path}.wanted.byStatus`),
      },
      byFruit: {
        PARAMECIA: intAt(byFruit, "PARAMECIA", `${path}.wanted.byFruit`),
        ZOAN: intAt(byFruit, "ZOAN", `${path}.wanted.byFruit`),
        LOGIA: intAt(byFruit, "LOGIA", `${path}.wanted.byFruit`),
        NONE: intAt(byFruit, "NONE", `${path}.wanted.byFruit`),
      },
    },
    crews: {
      total: intAt(crews, "total", `${path}.crews`),
      mostWanted: mostWantedRaw === null ? null : parseCrew(mostWantedRaw),
    },
    topBounties: asArray(record.topBounties, `${path}.topBounties`).map((item, index) =>
      parseWantedSummary(item, `${path}.topBounties[${index}]`),
    ),
    generatedAt: textAt(record, "generatedAt", path),
  };
}

export function parseLogPose(value: unknown): LogPose {
  const path = "logPose";
  const record = asRecord(value, path);
  const unlockedAt = record.unlockedAt;
  return {
    status: asEnum(record.status, ["LOCKED", "UNLOCKED"] as const, `${path}.status`),
    grandLineUnlocked: asBoolean(record.grandLineUnlocked, `${path}.grandLineUnlocked`),
    unlockedAt: unlockedAt === null ? null : asString(unlockedAt, `${path}.unlockedAt`),
    message: textAt(record, "message", path),
  };
}

function parseAuthSession(value: unknown): AuthSession {
  const path = "loginResponse";
  const record = asRecord(value, path);
  return {
    token: textAt(record, "token", path),
    tokenType: asEnum(record.tokenType, ["Bearer"] as const, `${path}.tokenType`),
    expiresAt: textAt(record, "expiresAt", path),
    user: parseUser(record.user, `${path}.user`),
    team: parseTeam(record.team, `${path}.team`),
  };
}

function parseMeResponse(value: unknown): MeResponse {
  const path = "meResponse";
  const record = asRecord(value, path);
  return {
    user: parseUser(record.user, `${path}.user`),
    team: parseTeam(record.team, `${path}.team`),
    expiresAt: textAt(record, "expiresAt", path),
  };
}

function parseDetails(value: unknown): ApiErrorDetail[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.field !== "string" || typeof record.message !== "string") return [];
    return [{ field: record.field, message: record.message }];
  });
}

function parseRetryAfter(response: Response, bodyValue: unknown): number | null {
  if (typeof bodyValue === "number" && Number.isFinite(bodyValue) && bodyValue >= 0) {
    return Math.ceil(bodyValue);
  }
  const header = response.headers.get("Retry-After");
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

async function readErrorPayload(response: Response): Promise<ErrorPayload> {
  let payload: Record<string, unknown> | null = null;
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      payload = body as Record<string, unknown>;
    }
  } catch {
    // La API también puede fallar sin JSON (proxy, HTML de error, etc.).
  }

  return {
    code: typeof payload?.code === "string" ? payload.code : `HTTP_${response.status}`,
    message:
      typeof payload?.message === "string"
        ? payload.message
        : `La API respondió con el estado ${response.status}.`,
    traceId: typeof payload?.traceId === "string" ? payload.traceId : null,
    details: parseDetails(payload?.details),
    retryAfterSeconds: parseRetryAfter(response, payload?.retryAfterSeconds),
  };
}

function normalizeBaseUrl(): string {
  if (API_BASE_URL.length === 0) {
    throw new ApiError(
      0,
      "CONFIG_MISSING",
      "Falta VITE_API_BASE_URL. Copia .env.example a .env.local y vuelve a iniciar la app.",
    );
  }
  return API_BASE_URL;
}

async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  const baseUrl = normalizeBaseUrl();
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      credentials: "omit",
    });
  } catch (cause: unknown) {
    if (isAbortError(cause)) throw cause;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "No se pudo conectar con la API. Revisa tu conexión e intenta de nuevo.",
    );
  }

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      window.dispatchEvent(new Event("logpose:unauthorized"));
    }
    const payload = await readErrorPayload(response);
    throw new ApiError(
      response.status,
      payload.code,
      payload.message,
      payload.details,
      payload.traceId,
      payload.retryAfterSeconds,
    );
  }

  if (response.status === 204) return null;

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "La API devolvió una respuesta que no es JSON válido.",
    );
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof ContractError) {
    return new ApiError(0, "INVALID_RESPONSE", error.message);
  }
  if (error instanceof Error) {
    return new ApiError(0, "UNKNOWN_ERROR", error.message);
  }
  return new ApiError(0, "UNKNOWN_ERROR", "Ocurrió un error inesperado.");
}

export async function login(email: string, password: string, signal?: AbortSignal): Promise<AuthSession> {
  const payload = await request("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
    signal,
  });
  return parseAuthSession(payload);
}

export async function register(
  teamName: string,
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<AuthSession> {
  const payload = await request("/auth/register", {
    method: "POST",
    body: { teamName, email, password },
    auth: false,
    signal,
  });
  return parseAuthSession(payload);
}

export async function fetchMe(signal?: AbortSignal): Promise<MeResponse> {
  return parseMeResponse(await request("/auth/me", { signal }));
}

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardSummary> {
  return parseDashboardSummary(await request("/dashboard/summary", { signal }));
}

export async function fetchLogPose(signal?: AbortSignal): Promise<LogPose> {
  return parseLogPose(await request("/log-pose", { signal }));
}

export async function fetchCrews(signal?: AbortSignal): Promise<Crew[]> {
  const payload = await request("/crews", { signal });
  return asArray(payload, "crews").map((item) => parseCrew(item));
}

export async function fetchWanted(query: WantedQuery, signal?: AbortSignal): Promise<WantedPage> {
  const search = new URLSearchParams();
  search.set("page", String(query.page));
  search.set("size", String(query.size));
  search.set("sort", query.sort);
  if (query.status) search.set("status", query.status);
  if (query.crewId) search.set("crewId", query.crewId);
  if (query.fruit) search.set("fruit", query.fruit);
  if (query.q) search.set("q", query.q);
  return parseWantedPage(await request(`/wanted?${search.toString()}`, { signal }));
}

export async function fetchWantedById(id: string, signal?: AbortSignal): Promise<WantedDetail> {
  return parseWantedDetail(await request(`/wanted/${encodeURIComponent(id)}`, { signal }));
}

export { FRUIT_TYPES, PAGE_SIZES, SORT_OPTIONS, WANTED_STATUSES };
