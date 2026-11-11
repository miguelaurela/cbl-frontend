import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import type { LoginResponse } from '../models';
import { mockApiInterceptor } from './mock-api.interceptor';
import { MOCK_CLOCK, MOCK_LATENCY } from './mock-clock';

const BASE = 'http://api.test';
const T0 = Date.UTC(2026, 0, 1, 12, 0, 0);

describe('mock: sesión (logout, caducidad y token en rutas protegidas)', () => {
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

  const login = () =>
    firstValueFrom(http.post<LoginResponse>(`${BASE}/api/auth/login`, { email: 'usuario@test.com', password: '123' }));
  const logout = (token: string | null) =>
    firstValueFrom(
      http.post(`${BASE}/api/auth/logout`, null, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    );
  const status = async (promise: Promise<unknown>): Promise<number> => {
    try {
      await promise;
      return 200;
    } catch (error) {
      return (error as HttpErrorResponse).status;
    }
  };

  it('una ruta protegida sin token responde 401', async () => {
    expect(await status(logout(null))).toBe(401);
  });

  it('un token mal formado responde 401', async () => {
    expect(await status(logout('basura'))).toBe(401);
  });

  it('el logout revoca el token: la segunda llamada con el mismo token da 401', async () => {
    const { accessToken } = await login();
    expect(await status(logout(accessToken))).toBe(200);
    expect(await status(logout(accessToken))).toBe(401);
  });

  it('con el reloj simulado, el token vencido a los 10 minutos da 401', async () => {
    const { accessToken } = await login();
    clock.value = T0 + 599_000;
    expect(await status(logout(accessToken))).toBe(200);
    const second = await login();
    clock.value = T0 + 599_000 + 600_000;
    expect(await status(logout(second.accessToken))).toBe(401);
  });
});
