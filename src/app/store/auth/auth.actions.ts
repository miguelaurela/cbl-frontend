import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { AppError } from '../../core/errors/app-error';
import type { LoginRequest, LoginResponse } from '../../core/models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    login: props<{ request: LoginRequest }>(),
    loginSuccess: props<{ response: LoginResponse }>(),
    loginFailure: props<{ error: AppError }>(),
    /** Cierre manual: llama a POST /api/auth/logout y limpia la sesión local. */
    logout: emptyProps(),
    logoutDone: emptyProps(),
    /** La sesión caducó (temporizador) o el servidor respondió 401 a una petición autenticada. */
    sessionExpired: props<{ reason: 'expired' | 'unauthorized' }>(),
    clearNotice: emptyProps(),
  },
});
