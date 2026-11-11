import { HttpErrorResponse, HttpHeaders, HttpResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import { MOCK_CLOCK, MOCK_LATENCY } from './mock-clock';
import { MockDb } from './mock-db';
import { AUTH_ROUTES } from './mock-routes-auth';
import { matchRoute, problem, type MockResult, type MockRoute } from './mock-router';
import { parseMockToken, type MockClaims } from './mock-token';

/** Marcador exclusivo del mock: `npm run check:prod` falla si aparece en el build de producción. */
export const MOCK_MARKER = '__CBL_MOCK_API__';

/** Tabla de rutas del mock; cada historia añade su archivo `mock-routes-*.ts`. */
export const MOCK_ROUTES: MockRoute[] = [...AUTH_ROUTES];

/** Resuelve el token Bearer: devuelve claims válidos o la respuesta 401 que corresponde. */
function authenticate(
  authorization: string | null,
  db: MockDb,
  now: number,
): { claims: MockClaims } | { failure: MockResult } {
  const unauthorized = (detail: string): { failure: MockResult } => ({
    failure: problem(401, 'No autenticado', { detail }),
  });
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
  if (!token) {
    return unauthorized('Falta la sesión.');
  }
  const claims = parseMockToken(token);
  if (!claims) {
    return unauthorized('La sesión no es válida.');
  }
  if (claims.exp * 1000 <= now) {
    return unauthorized('La sesión expiró.');
  }
  if (db.revoked.has(claims.jti)) {
    return unauthorized('La sesión fue cerrada.');
  }
  return { claims };
}

/** Interceptor del modo demostración: responde a las peticiones de la API con datos en memoria. */
export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (!request.url.startsWith(`${baseUrl}/`)) {
    return next(request);
  }
  const db = inject(MockDb);
  const clock = inject(MOCK_CLOCK);
  const latency = inject(MOCK_LATENCY);

  const url = new URL(request.url);
  const now = clock.now();
  const matched = matchRoute(MOCK_ROUTES, request.method, url.pathname);

  let result: MockResult;
  if (!matched) {
    result = problem(404, 'No encontrado', { detail: 'La ruta no existe en el modo demostración.' });
  } else {
    let claims: MockClaims | null = null;
    let failure: MockResult | null = null;
    if (matched.route.access !== 'public') {
      const auth = authenticate(request.headers.get('Authorization'), db, now);
      if ('failure' in auth) {
        failure = auth.failure;
      } else {
        claims = auth.claims;
        if (Array.isArray(matched.route.access) && !matched.route.access.includes(claims.role)) {
          failure = problem(403, 'Acceso denegado', { detail: 'Tu rol no permite esta operación.' });
        }
      }
    }
    result =
      failure ??
      matched.route.handler({
        request,
        params: matched.params,
        query: url.searchParams,
        body: request.body,
        db,
        now,
        claims,
      });
  }

  const headers = new HttpHeaders({ 'X-CBL-Mock': MOCK_MARKER, ...(result.headers ?? {}) });
  const wait = latency.max > 0 ? latency.min + Math.random() * (latency.max - latency.min) : 0;
  const response$ =
    result.status >= 400
      ? throwError(
          () => new HttpErrorResponse({ status: result.status, error: result.body ?? null, headers, url: request.url }),
        )
      : of(new HttpResponse({ status: result.status, body: result.body ?? null, headers, url: request.url }));
  return wait > 0 ? response$.pipe(delay(wait)) : response$;
};
