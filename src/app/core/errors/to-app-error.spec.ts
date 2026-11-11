import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { toAppError } from './to-app-error';

function problem(status: number, extra: Record<string, unknown> = {}, headers?: Record<string, string>) {
  return new HttpErrorResponse({
    status,
    error: { title: 'Título', status, ...extra },
    headers: new HttpHeaders(headers ?? {}),
  });
}

describe('toAppError', () => {
  it('mapea 422 con errors a fieldErrors en camelCase', () => {
    const result = toAppError(problem(422, { errors: { Amount: ['Debe ser mayor que 0'], termMonths: ['Inválido'] } }));
    expect(result.kind).toBe('validation');
    expect(result.fieldErrors['amount']).toEqual(['Debe ser mayor que 0']);
    expect(result.fieldErrors['termMonths']).toEqual(['Inválido']);
    expect(result.traceId).toBeUndefined();
  });

  it('mapea 400 sin campos a un mensaje', () => {
    const result = toAppError(problem(400, { detail: 'JSON inválido' }));
    expect(result.kind).toBe('validation');
    expect(result.message).toBe('JSON inválido');
    expect(result.fieldErrors).toEqual({});
  });

  it('mapea 401 como no autenticado', () => {
    const result = toAppError(problem(401, { detail: 'Credenciales incorrectas' }));
    expect(result.kind).toBe('unauthorized');
    expect(result.message).toBe('Credenciales incorrectas');
  });

  it('mapea 403, 404 y 409 con el detalle del servidor', () => {
    expect(toAppError(problem(403, { detail: 'No permitido' }))).toEqual(
      jasmine.objectContaining({ kind: 'forbidden', message: 'No permitido' }),
    );
    expect(toAppError(problem(404, { detail: 'No existe' }))).toEqual(
      jasmine.objectContaining({ kind: 'notFound', message: 'No existe' }),
    );
    expect(toAppError(problem(409, { detail: 'Ya decidida' }))).toEqual(
      jasmine.objectContaining({ kind: 'conflict', message: 'Ya decidida' }),
    );
  });

  it('usa un mensaje propio en 403, 404 y 409 sin detalle', () => {
    expect(toAppError(problem(403)).message).toContain('permiso');
    expect(toAppError(problem(404)).message).toContain('No se encontró');
    expect(toAppError(problem(409)).message).toContain('conflicto');
  });

  it('mapea 423 y 429 con Retry-After', () => {
    const locked = toAppError(problem(423, {}, { 'Retry-After': '900' }));
    expect(locked.kind).toBe('locked');
    expect(locked.retryAfterSeconds).toBe(900);
    const limited = toAppError(problem(429, {}, { 'Retry-After': '30' }));
    expect(limited.kind).toBe('rateLimited');
    expect(limited.retryAfterSeconds).toBe(30);
  });

  it('mapea 423 y 429 sin cabecera Retry-After', () => {
    expect(toAppError(problem(423)).retryAfterSeconds).toBeUndefined();
    expect(toAppError(problem(429)).retryAfterSeconds).toBeUndefined();
  });

  it('un 500 es inesperado y conserva el traceId', () => {
    const result = toAppError(problem(500, { traceId: 'abc-123', detail: 'Detalle interno' }));
    expect(result.kind).toBe('unexpected');
    expect(result.traceId).toBe('abc-123');
    expect(result.message).not.toContain('Detalle interno');
  });

  it('el estado 0 (sin red) es inesperado y sin traceId', () => {
    const result = toAppError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));
    expect(result.kind).toBe('unexpected');
    expect(result.status).toBe(0);
    expect(result.traceId).toBeUndefined();
  });

  it('un cuerpo que no es ProblemDetails es inesperado sin detalles internos', () => {
    const result = toAppError(new HttpErrorResponse({ status: 502, error: '<html>Bad gateway</html>' }));
    expect(result.kind).toBe('unexpected');
    expect(result.message).not.toContain('html');
  });

  it('un error que no es HTTP también es inesperado', () => {
    expect(toAppError(new Error('boom')).kind).toBe('unexpected');
  });
});
