import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectToken } from '../../store/auth/auth.selectors';
import { API_BASE_URL } from '../api/api-base-url.token';

/** Añade `Authorization: Bearer` solo a las peticiones a la API y solo si hay token. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (!request.url.startsWith(`${baseUrl}/`)) {
    return next(request);
  }
  const token = inject(Store).selectSignal(selectToken)();
  if (!token) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
