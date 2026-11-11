import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import type { Loan, LoginResponse } from '../models';
import { mockApiInterceptor } from './mock-api.interceptor';
import { MOCK_CLOCK, MOCK_LATENCY } from './mock-clock';

const BASE = 'http://api.test';
const T0 = Date.UTC(2026, 10, 11, 12, 0, 0);

/** Reglas del servidor que el modo demostración debe reproducir (FR-029, constitución V). */
describe('mock: reglas del servidor', () => {
  let http: HttpClient;
  let clock: { value: number };

  beforeEach(() => {
    clock = { value: T0 };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockApiInterceptor])),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: MOCK_LATENCY, useValue: { min: 0, max: 0 } },
        { provide: MOCK_CLOCK, useValue: { now: () => clock.value } },
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  const login = (email: string) =>
    firstValueFrom(http.post<LoginResponse>(`${BASE}/api/auth/login`, { email, password: '123' }));
  const headers = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
  const call = <T>(method: 'GET' | 'POST', path: string, token: string | null, body?: unknown) =>
    firstValueFrom(
      http.request<T>(method, `${BASE}${path}`, { body: body ?? null, ...(token ? headers(token) : {}) }),
    );
  const status = async (promise: Promise<unknown>): Promise<number> => {
    try {
      await promise;
      return 200;
    } catch (error) {
      return (error as HttpErrorResponse).status;
    }
  };

  const pendingId = async (adminToken: string) => {
    const all = await call<Loan[]>('GET', '/api/loans?status=Pending', adminToken);
    return all[0] as Loan;
  };

  it('403 por rol en rutas ajenas', async () => {
    const borrower = (await login('usuario@test.com')).accessToken;
    const admin = (await login('admin@test.com')).accessToken;
    expect(await status(call('GET', '/api/loans', borrower))).toBe(403);
    expect(await status(call('POST', '/api/loans/x/approve', borrower, {}))).toBe(403);
    expect(await status(call('POST', '/api/loans', admin, { amount: 5000, termMonths: 12 }))).toBe(403);
    expect(await status(call('GET', '/api/loans/mine', admin))).toBe(403);
  });

  it('409 en la segunda decisión sobre el mismo préstamo', async () => {
    const admin = (await login('admin@test.com')).accessToken;
    const loan = await pendingId(admin);
    const approved = await call<Loan>('POST', `/api/loans/${loan.id}/approve`, admin, { version: loan.version });
    expect(approved.status).toBe('Approved');
    expect(approved.decidedByName).toBeTruthy();
    expect(approved.decidedAt).toBeTruthy();
    expect(approved.version).toBe(loan.version + 1);
    expect(await status(call('POST', `/api/loans/${loan.id}/reject`, admin, { version: approved.version }))).toBe(409);
  });

  it('409 con una versión desactualizada y 404 si no existe', async () => {
    const admin = (await login('admin@test.com')).accessToken;
    const loan = await pendingId(admin);
    expect(await status(call('POST', `/api/loans/${loan.id}/approve`, admin, { version: loan.version + 7 }))).toBe(409);
    expect(await status(call('POST', '/api/loans/no-existe/approve', admin, {}))).toBe(404);
  });

  it('el cuerpo con la versión es opcional', async () => {
    const admin = (await login('admin@test.com')).accessToken;
    const loan = await pendingId(admin);
    const rejected = await call<Loan>('POST', `/api/loans/${loan.id}/reject`, admin);
    expect(rejected.status).toBe('Rejected');
  });

  it('401 con token vencido (reloj simulado) y tras logout', async () => {
    const { accessToken } = await login('admin@test.com');
    clock.value = T0 + 601_000;
    expect(await status(call('GET', '/api/loans', accessToken))).toBe(401);
    clock.value = T0;
    const fresh = (await login('admin@test.com')).accessToken;
    await call('POST', '/api/auth/logout', fresh);
    expect(await status(call('GET', '/api/loans', fresh))).toBe(401);
  });

  it('validaciones y mensajes iguales a los del backend', async () => {
    const borrower = (await login('usuario@test.com')).accessToken;
    try {
      await call('POST', '/api/loans', borrower, { amount: 50, termMonths: 12 });
      fail('se esperaba un 422');
    } catch (error) {
      const response = error as HttpErrorResponse;
      expect(response.status).toBe(422);
      expect(response.headers.get('Content-Type')).toBe('application/problem+json');
      expect(response.error.errors.amount[0]).toBe('El monto debe estar entre 1.000 y 100.000.');
      expect(response.error.traceId).toBeTruthy();
    }
  });

  it('un prestamista solo ve sus préstamos', async () => {
    const ana = (await login('ana@test.com')).accessToken;
    const mine = await call<Loan[]>('GET', '/api/loans/mine', ana);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((loan) => loan.borrowerEmail === 'ana@test.com')).toBeTrue();
  });
});
