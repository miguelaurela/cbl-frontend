import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import type { Loan, LoanLimits, LoginResponse } from '../models';
import { mockApiInterceptor } from './mock-api.interceptor';
import { MOCK_CLOCK, MOCK_LATENCY } from './mock-clock';

const BASE = 'http://api.test';
const T0 = Date.UTC(2026, 10, 11, 12, 0, 0);

describe('mock: préstamos y límites', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockApiInterceptor])),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: MOCK_LATENCY, useValue: { min: 0, max: 0 } },
        { provide: MOCK_CLOCK, useValue: { now: () => T0 } },
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  const tokenFor = async (email: string) =>
    (await firstValueFrom(http.post<LoginResponse>(`${BASE}/api/auth/login`, { email, password: '123' }))).accessToken;
  const get = <T>(path: string, token: string) =>
    firstValueFrom(http.get<T>(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } }));
  const post = <T>(path: string, body: unknown, token: string) =>
    firstValueFrom(http.post<T>(`${BASE}${path}`, body, { headers: { Authorization: `Bearer ${token}` } }));
  const failure = async (promise: Promise<unknown>): Promise<HttpErrorResponse> => {
    try {
      await promise;
    } catch (error) {
      return error as HttpErrorResponse;
    }
    throw new Error('se esperaba un error');
  };

  it('los límites iniciales son 1.000–100.000', async () => {
    const limits = await get<LoanLimits>('/api/parameters/loan-limits', await tokenFor('usuario@test.com'));
    expect(limits).toEqual({ minAmount: 1000, maxAmount: 100000 });
  });

  it('un prestamista solo ve sus préstamos, más recientes primero, en los tres estados', async () => {
    const mine = await get<Loan[]>('/api/loans/mine', await tokenFor('usuario@test.com'));
    expect(mine.every((l) => l.borrowerEmail === 'usuario@test.com')).toBeTrue();
    expect(new Set(mine.map((l) => l.status))).toEqual(new Set(['Pending', 'Approved', 'Rejected']));
    const dates = mine.map((l) => Date.parse(l.createdAt));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it('crear un préstamo lo deja Pendiente a nombre del prestamista del token', async () => {
    const token = await tokenFor('usuario@test.com');
    const loan = await post<Loan>('/api/loans', { amount: 5000, termMonths: 12 }, token);
    expect(loan.status).toBe('Pending');
    expect(loan.borrowerEmail).toBe('usuario@test.com');
    expect(loan.version).toBe(0);
    const mine = await get<Loan[]>('/api/loans/mine', token);
    expect(mine[0]?.id).toBe(loan.id);
  });

  it('valida con los mismos mensajes que el backend', async () => {
    const token = await tokenFor('usuario@test.com');
    const cases: [object, string, string][] = [
      [{ amount: 0, termMonths: 12 }, 'amount', 'mayor que 0'],
      [{ amount: 1000.123, termMonths: 12 }, 'amount', '2 decimales'],
      [{ amount: 999.99, termMonths: 12 }, 'amount', 'entre'],
      [{ amount: 100000.01, termMonths: 12 }, 'amount', 'entre'],
      [{ amount: 5000, termMonths: 0 }, 'termMonths', '1 a 60'],
      [{ amount: 5000, termMonths: 61 }, 'termMonths', '1 a 60'],
      [{ amount: 5000, termMonths: 1.5 }, 'termMonths', 'entero'],
    ];
    for (const [body, field, text] of cases) {
      const error = await failure(post('/api/loans', body, token));
      expect(error.status).withContext(JSON.stringify(body)).toBe(422);
      expect(error.error.errors[field][0]).toContain(text);
    }
  });

  it('un administrador no puede crear préstamos (403) ni un prestamista listar todos (403)', async () => {
    expect((await failure(post('/api/loans', { amount: 5000, termMonths: 12 }, await tokenFor('admin@test.com')))).status).toBe(403);
    expect((await failure(get('/api/loans', await tokenFor('usuario@test.com')))).status).toBe(403);
  });

  it('el administrador lista todos y filtra por estado; un valor inválido da 400', async () => {
    const token = await tokenFor('admin@test.com');
    const all = await get<Loan[]>('/api/loans', token);
    expect(new Set(all.map((l) => l.borrowerEmail)).size).toBeGreaterThan(1);
    const pending = await get<Loan[]>('/api/loans?status=Pending', token);
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((l) => l.status === 'Pending')).toBeTrue();
    expect((await failure(get('/api/loans?status=Otro', token))).status).toBe(400);
  });
});
