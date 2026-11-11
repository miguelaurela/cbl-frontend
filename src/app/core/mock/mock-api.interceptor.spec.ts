import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import { MOCK_CLOCK, MOCK_LATENCY } from './mock-clock';
import { mockApiInterceptor, MOCK_MARKER } from './mock-api.interceptor';

const BASE = 'http://api.test';

describe('mockApiInterceptor (esqueleto)', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockApiInterceptor])),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: MOCK_LATENCY, useValue: { min: 0, max: 0 } },
        { provide: MOCK_CLOCK, useValue: { now: () => Date.UTC(2026, 0, 1, 12, 0, 0) } },
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  it('una ruta desconocida responde 404 application/problem+json con traceId', async () => {
    const error = await firstValueFrom(http.get(`${BASE}/api/desconocida`)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    const response = error as HttpErrorResponse;
    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('application/problem+json');
    expect((response.error as { traceId?: string }).traceId).toMatch(/^mock-/);
    expect(response.headers.get('X-CBL-Mock')).toBe(MOCK_MARKER);
  });

  it('con latencia 0 responde sin esperar', async () => {
    const started = performance.now();
    await firstValueFrom(http.get(`${BASE}/api/desconocida`)).catch(() => undefined);
    expect(performance.now() - started).toBeLessThan(200);
  });
});
