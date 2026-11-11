import { HttpErrorResponse } from '@angular/common/http';
import { LABELS } from '../i18n/labels';
import type { ProblemDetails } from '../models';
import type { AppError } from './app-error';

function isProblemDetails(body: unknown): body is ProblemDetails {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Record<string, unknown>;
  return typeof candidate['title'] === 'string' && typeof candidate['status'] === 'number';
}

function toCamelCase(key: string): string {
  return key.length > 0 ? key.charAt(0).toLowerCase() + key.slice(1) : key;
}

function normalizeFieldErrors(errors: ProblemDetails['errors']): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const list = Array.isArray(messages) ? messages.filter((m) => typeof m === 'string') : [];
    if (list.length > 0) {
      result[toCamelCase(key)] = list;
    }
  }
  return result;
}

function parseRetryAfter(response: HttpErrorResponse): number | undefined {
  const raw = response.headers?.get('Retry-After');
  if (raw === null || raw === undefined) {
    return undefined;
  }
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function unexpected(status: number, traceId?: string): AppError {
  return {
    kind: 'unexpected',
    status,
    title: LABELS.errors.generic,
    message: status === 0 ? LABELS.errors.network : LABELS.errors.generic,
    fieldErrors: {},
    ...(traceId ? { traceId } : {}),
  };
}

/**
 * Convierte cualquier error HTTP en un `AppError`. Solo los errores inesperados conservan el `traceId`
 * y nunca se exponen detalles internos (FR-025).
 */
export function toAppError(error: unknown): AppError {
  if (!(error instanceof HttpErrorResponse)) {
    return unexpected(0);
  }
  const status = error.status;
  if (status === 0) {
    return unexpected(0);
  }
  const body: unknown = error.error;
  if (!isProblemDetails(body)) {
    return unexpected(status);
  }

  const detail = body.detail?.trim() ? body.detail : undefined;
  const base = { status, title: body.title, fieldErrors: {} as Record<string, string[]> };

  switch (status) {
    case 400:
    case 422: {
      const fieldErrors = normalizeFieldErrors(body.errors);
      return { ...base, kind: 'validation', message: detail ?? body.title, fieldErrors };
    }
    case 401:
      return { ...base, kind: 'unauthorized', message: detail ?? body.title };
    case 403:
      return { ...base, kind: 'forbidden', message: detail ?? LABELS.errors.forbidden };
    case 404:
      return { ...base, kind: 'notFound', message: detail ?? LABELS.errors.notFound };
    case 409:
      return { ...base, kind: 'conflict', message: detail ?? LABELS.errors.conflict };
    case 423:
    case 429: {
      const retryAfterSeconds = parseRetryAfter(error);
      return {
        ...base,
        kind: status === 423 ? 'locked' : 'rateLimited',
        message: detail ?? body.title,
        ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
      };
    }
    default:
      return unexpected(status, body.traceId);
  }
}
