import type { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptores del modo demostración. En los builds normales y de producción esta lista está vacía;
 * la configuración `mock` de angular.json sustituye este archivo por `mock-api.providers.mock.ts`.
 */
export const MOCK_API_INTERCEPTORS: HttpInterceptorFn[] = [];
