import type { HttpRequest } from '@angular/common/http';
import type { Role } from '../models';
import type { MockClaims } from './mock-token';
import type { MockDb } from './mock-db';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Quién puede llamar a la ruta: nadie autenticado (login), cualquier sesión válida o roles concretos. */
export type MockAccess = 'public' | 'any' | readonly Role[];

export interface MockContext {
  request: HttpRequest<unknown>;
  /** Parámetros de ruta, por ejemplo `{ id }`. */
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  db: MockDb;
  /** Reloj del mock en milisegundos. */
  now: number;
  /** Claims del token de la petición (null en rutas públicas sin token). */
  claims: MockClaims | null;
}

export interface MockResult {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export type MockHandler = (context: MockContext) => MockResult;

export interface MockRoute {
  method: HttpMethod;
  pattern: string;
  matcher: RegExp;
  paramNames: string[];
  handler: MockHandler;
  access: MockAccess;
}

/** Registra una ruta de la API simulada: `route('GET', '/api/loans/{id}', handler, ['Admin'])`. */
export function route(method: HttpMethod, pattern: string, handler: MockHandler, access: MockAccess = 'any'): MockRoute {
  const paramNames: string[] = [];
  const source = pattern
    .split('/')
    .map((segment) => {
      const match = /^\{(\w+)\}$/.exec(segment);
      if (match) {
        paramNames.push(match[1] as string);
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { method, pattern, matcher: new RegExp(`^${source}$`), paramNames, handler, access };
}

export function matchRoute(
  routes: readonly MockRoute[],
  method: string,
  path: string,
): { route: MockRoute; params: Record<string, string> } | null {
  for (const candidate of routes) {
    if (candidate.method !== method) {
      continue;
    }
    const match = candidate.matcher.exec(path);
    if (match) {
      const params: Record<string, string> = {};
      candidate.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1] as string);
      });
      return { route: candidate, params };
    }
  }
  return null;
}

/** Respuesta de error `application/problem+json` con `traceId`, igual que el backend. */
export function problem(
  status: number,
  title: string,
  options: { detail?: string; errors?: Record<string, string[]>; headers?: Record<string, string> } = {},
): MockResult {
  return {
    status,
    body: {
      title,
      status,
      ...(options.detail ? { detail: options.detail } : {}),
      ...(options.errors ? { errors: options.errors } : {}),
      traceId: `mock-${Math.random().toString(16).slice(2, 10)}`,
    },
    headers: { 'Content-Type': 'application/problem+json', ...(options.headers ?? {}) },
  };
}

export function ok(body: unknown, status = 200): MockResult {
  return { status, body };
}
