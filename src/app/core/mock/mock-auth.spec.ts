import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import type { LoginResponse } from '../models';
import { mockApiInterceptor } from './mock-api.interceptor';
import { MOCK_CLOCK, MOCK_LATENCY } from './mock-clock';
import { parseMockToken } from './mock-token';

const BASE = 'http://api.test';
const T0 = Date.UTC(2026, 0, 1, 12, 0, 0);

describe('mock: POST /api/auth/login', () => {
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

  const login = (email: string, password: string) =>
    firstValueFrom(http.post<LoginResponse>(`${BASE}/api/auth/login`, { email, password }));

  const failure = async (email: string, password: string): Promise<HttpErrorResponse> => {
    try {
      await login(email, password);
    } catch (error) {
      return error as HttpErrorResponse;
    }
    throw new Error('se esperaba un error');
  };

  it('credenciales válidas devuelven token con 10 minutos de vida y el usuario', async () => {
    const response = await login('usuario@test.com', '123');
    expect(response.tokenType).toBe('Bearer');
    expect(response.user).toEqual(jasmine.objectContaining({ email: 'usuario@test.com', role: 'Borrower' }));
    const claims = parseMockToken(response.accessToken);
    expect(claims?.exp).toBe(Math.floor(T0 / 1000) + 600);
    expect(new Date(response.expiresAt).getTime()).toBe(T0 + 600_000);
  });

  it('el administrador recibe el rol Admin y el correo no distingue mayúsculas', async () => {
    const response = await login('ADMIN@test.com', '123');
    expect(response.user.role).toBe('Admin');
  });

  it('correo inexistente y contraseña errónea dan el mismo 401', async () => {
    const unknown = await failure('nadie@test.com', '123');
    const wrong = await failure('usuario@test.com', 'mala');
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.error).toEqual({ ...wrong.error, traceId: unknown.error.traceId });
  });

  it('valida el cuerpo con 422 y errores por campo', async () => {
    const error = await failure('', '');
    expect(error.status).toBe(422);
    expect(error.error.errors.email).toBeDefined();
    expect(error.error.errors.password).toBeDefined();
    const format = await failure('no-correo', 'x');
    expect(format.error.errors.email[0]).toContain('formato');
  });

  it('5 fallos con el mismo correo dan 423 con Retry-After durante 15 minutos', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await failure('usuario@test.com', 'mala')).status).toBe(401);
    }
    const locked = await failure('usuario@test.com', '123');
    expect(locked.status).toBe(423);
    expect(locked.headers.get('Retry-After')).toBe('900');
    clock.value += 600_000;
    expect((await failure('usuario@test.com', '123')).headers.get('Retry-After')).toBe('300');
    clock.value += 300_000;
    expect((await login('usuario@test.com', '123')).user.email).toBe('usuario@test.com');
  });

  it('el bloqueo también aplica a un correo inexistente', async () => {
    for (let i = 0; i < 5; i++) {
      await failure('fantasma@test.com', 'x');
    }
    expect((await failure('fantasma@test.com', 'x')).status).toBe(423);
  });

  it('un usuario desactivado recibe 401', async () => {
    TestBed.inject((await import('./mock-db')).MockDb).users.find((u) => u.email === 'ana@test.com')!.isActive = false;
    expect((await failure('ana@test.com', '123')).status).toBe(401);
  });

  it('fail500@test.com provoca un 500 con traceId', async () => {
    const error = await failure('fail500@test.com', 'cualquiera');
    expect(error.status).toBe(500);
    expect(error.error.traceId).toBeTruthy();
  });
});
