import type { ApiError } from "./api";

export type FieldErrors = Record<string, string>;

export function mapDetails(error: ApiError, allowedFields: readonly string[]): FieldErrors {
  const result: FieldErrors = {};
  for (const detail of error.details) {
    if (allowedFields.includes(detail.field) && !result[detail.field]) {
      result[detail.field] = detail.message;
    }
  }
  return result;
}

export function errorMessage(error: ApiError): string {
  if (error.status === 0) return error.message;
  if (error.code === "RATE_LIMITED") {
    const seconds = error.retryAfterSeconds;
    return seconds
      ? `Demasiadas solicitudes. Intenta de nuevo en ${seconds} segundos.`
      : "Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.";
  }
  return error.message || "Ocurrió un error inesperado. Intenta de nuevo.";
}

export function isRateLimited(error: ApiError): boolean {
  return error.code === "RATE_LIMITED" || error.status === 429;
}

export function retryAfter(error: ApiError): number | null {
  return error.retryAfterSeconds;
}
