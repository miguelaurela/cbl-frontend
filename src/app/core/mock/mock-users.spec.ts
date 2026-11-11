import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import type { LoanLimits, LoginResponse, User } from '../models';
import { mockApiInterceptor } from './mock-api.interceptor';
import { MOCK_CLOCK, MOCK_LATENCY } from './mock-clock';

const BASE = 'http://api.test';
const T0 = Date.UTC(2026, 10, 11, 12, 0, 0);

describe('mock: usuarios y límites', () => {
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

  const login = (email: string, password = '123') =>
    firstValueFrom(http.post<LoginResponse>(`${BASE}/api/auth/login`, { email, password }));
  const call = <T>(method: 'GET' | 'POST' | 'PUT', path: string, token: string, body?: unknown) =>
    firstValueFrom(http.request<T>(method, `${BASE}${path}`, { body: body ?? null, headers: { Authorization: `Bearer ${token}` } }));
  const failure = async (promise: Promise<unknown>): Promise<HttpErrorResponse> => {
    try {
      await promise;
    } catch (error) {
      return error as HttpErrorResponse;
    }
    throw new Error('se esperaba un error');
  };

  const adminSession = () => login('admin@test.com');

  it('solo el administrador accede a los usuarios (403 para el prestamista)', async () => {
    const borrower = (await login('usuario@test.com')).accessToken;
    expect((await failure(call('GET', '/api/users', borrower))).status).toBe(403);
    expect((await failure(call('POST', '/api/users', borrower, {}))).status).toBe(403);
    expect((await failure(call('PUT', '/api/users/x', borrower, {}))).status).toBe(403);
  });

  it('lista los usuarios sin devolver nunca la contraseña', async () => {
    const users = await call<User[]>('GET', '/api/users', (await adminSession()).accessToken);
    expect(users.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(users)).not.toContain('password');
  });

  it('crea un usuario (8 caracteres de contraseña) que puede iniciar sesión', async () => {
    const { accessToken } = await adminSession();
    const created = await call<User>('POST', '/api/users', accessToken, {
      email: 'nuevo@test.com',
      fullName: 'Nuevo',
      password: '12345678',
      role: 'Borrower',
    });
    expect(created.isActive).toBeTrue();
    expect((await login('nuevo@test.com', '12345678')).user.role).toBe('Borrower');
  });

  it('valida: contraseña de 7 caracteres, correo, nombre y rol', async () => {
    const { accessToken } = await adminSession();
    const error = await failure(call('POST', '/api/users', accessToken, { email: 'x', fullName: '', password: '1234567', role: 'Otro' }));
    expect(error.status).toBe(422);
    expect(Object.keys(error.error.errors).sort()).toEqual(['email', 'fullName', 'password', 'role']);
  });

  it('un correo duplicado (sin distinguir mayúsculas) da 409 con errors.email', async () => {
    const { accessToken } = await adminSession();
    const error = await failure(
      call('POST', '/api/users', accessToken, { email: 'ANA@test.com', fullName: 'Otra', password: '12345678', role: 'Borrower' }),
    );
    expect(error.status).toBe(409);
    expect(error.error.errors.email).toBeDefined();
  });

  it('desactivar y reactivar: el desactivado no inicia sesión', async () => {
    const { accessToken } = await adminSession();
    const users = await call<User[]>('GET', '/api/users', accessToken);
    const ana = users.find((u) => u.email === 'ana@test.com') as User;
    await call('PUT', `/api/users/${ana.id}`, accessToken, { fullName: ana.fullName, role: ana.role, isActive: false });
    expect((await failure(login('ana@test.com'))).status).toBe(401);
    await call('PUT', `/api/users/${ana.id}`, accessToken, { fullName: ana.fullName, role: ana.role, isActive: true });
    expect((await login('ana@test.com')).user.email).toBe('ana@test.com');
  });

  it('un administrador no puede desactivarse ni cambiarse el rol (403) y 404 si no existe', async () => {
    const session = await adminSession();
    const id = session.user.id;
    const token = session.accessToken;
    expect((await failure(call('PUT', `/api/users/${id}`, token, { fullName: 'A', role: 'Admin', isActive: false }))).status).toBe(403);
    expect((await failure(call('PUT', `/api/users/${id}`, token, { fullName: 'A', role: 'Borrower', isActive: true }))).status).toBe(403);
    expect((await call<User>('PUT', `/api/users/${id}`, token, { fullName: 'Nuevo nombre', role: 'Admin', isActive: true })).fullName).toBe('Nuevo nombre');
    expect((await failure(call('PUT', '/api/users/no-existe', token, { fullName: 'A', role: 'Admin', isActive: true }))).status).toBe(404);
  });

  it('restablece la contraseña si se envía (opcional)', async () => {
    const { accessToken } = await adminSession();
    const users = await call<User[]>('GET', '/api/users', accessToken);
    const carlos = users.find((u) => u.email === 'carlos@test.com') as User;
    await call('PUT', `/api/users/${carlos.id}`, accessToken, { fullName: carlos.fullName, role: carlos.role, isActive: true, password: 'nueva-clave-1' });
    expect((await login('carlos@test.com', 'nueva-clave-1')).user.email).toBe('carlos@test.com');
  });

  it('límites: el administrador los modifica y el cambio se ve; valida mínimo, máximo y decimales', async () => {
    const { accessToken } = await adminSession();
    const saved = await call<LoanLimits>('PUT', '/api/parameters/loan-limits', accessToken, { minAmount: 500, maxAmount: 90000 });
    expect(saved).toEqual({ minAmount: 500, maxAmount: 90000 });
    const borrower = (await login('usuario@test.com')).accessToken;
    expect(await call<LoanLimits>('GET', '/api/parameters/loan-limits', borrower)).toEqual({ minAmount: 500, maxAmount: 90000 });

    const bad = await failure(call('PUT', '/api/parameters/loan-limits', accessToken, { minAmount: 0, maxAmount: 10.123 }));
    expect(bad.status).toBe(422);
    expect(bad.error.errors.minAmount).toBeDefined();
    expect(bad.error.errors.maxAmount).toBeDefined();
    const notAbove = await failure(call('PUT', '/api/parameters/loan-limits', accessToken, { minAmount: 100, maxAmount: 100 }));
    expect(notAbove.error.errors.maxAmount[0]).toContain('mayor que el mínimo');
  });

  it('un prestamista no puede modificar los límites (403)', async () => {
    const borrower = (await login('usuario@test.com')).accessToken;
    expect((await failure(call('PUT', '/api/parameters/loan-limits', borrower, { minAmount: 1, maxAmount: 2 }))).status).toBe(403);
  });

  it('los límites nuevos aplican a las solicitudes nuevas', async () => {
    const admin = (await adminSession()).accessToken;
    await call('PUT', '/api/parameters/loan-limits', admin, { minAmount: 100, maxAmount: 500 });
    const borrower = (await login('usuario@test.com')).accessToken;
    expect((await failure(call('POST', '/api/loans', borrower, { amount: 5000, termMonths: 12 }))).status).toBe(422);
    expect((await call<{ status: string }>('POST', '/api/loans', borrower, { amount: 300, termMonths: 12 })).status).toBe('Pending');
  });
});
