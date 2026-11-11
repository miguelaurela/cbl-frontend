import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectToken } from '../../store/auth/auth.selectors';
import { API_BASE_URL } from '../api/api-base-url.token';
import { LABELS } from '../i18n/labels';
import { NotificationService } from '../notifications/notification.service';

const AUTH_PATHS = ['/api/auth/login', '/api/auth/logout'];

/**
 * 401 de una petición autenticada: cierra la sesión y avisa (FR-008). El 401 de login y de logout es un error del
 * propio formulario o del cierre y no se trata aquí. 403: aviso. Siempre relanza el error.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  const store = inject(Store);
  const notifications = inject(NotificationService);
  const isApi = request.url.startsWith(`${baseUrl}/`);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (isApi && error instanceof HttpErrorResponse) {
        const path = request.url.slice(baseUrl.length).split('?', 1)[0] ?? '';
        if (error.status === 401 && !AUTH_PATHS.includes(path) && store.selectSignal(selectToken)() !== null) {
          store.dispatch(AuthActions.sessionExpired({ reason: 'unauthorized' }));
        } else if (error.status === 403) {
          notifications.error(LABELS.errors.forbidden);
        }
      }
      return throwError(() => error);
    }),
  );
};
