import type { HttpInterceptorFn } from '@angular/common/http';
import { mockApiInterceptor } from './mock-api.interceptor';

/** Versión del modo demostración: la configuración `mock` de angular.json la usa en lugar de `mock-api.providers.ts`. */
export const MOCK_API_INTERCEPTORS: HttpInterceptorFn[] = [mockApiInterceptor];
