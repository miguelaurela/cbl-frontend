import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState, type AuthState } from './auth.state';

export const authReducer = createReducer<AuthState>(
  initialAuthState,
  on(AuthActions.login, (state): AuthState => ({ ...state, status: 'loading', error: null, notice: null })),
  on(
    AuthActions.loginSuccess,
    (state, { response }): AuthState => ({
      ...state,
      status: 'authenticated',
      token: response.accessToken,
      user: response.user,
      expiresAt: response.expiresAt,
      error: null,
      notice: null,
    }),
  ),
  on(AuthActions.loginFailure, (state, { error }): AuthState => ({ ...state, status: 'failed', error })),
  // `logout` conserva el token hasta que el efecto avise al servidor; `logoutDone` limpia siempre la sesión
  // local, aunque el servidor no responda.
  on(AuthActions.logoutDone, (): AuthState => ({ ...initialAuthState, notice: 'loggedOut' })),
  on(
    AuthActions.sessionExpired,
    (_state, { reason }): AuthState => ({ ...initialAuthState, notice: reason }),
  ),
  on(AuthActions.clearNotice, (state): AuthState => ({ ...state, notice: null })),
);
