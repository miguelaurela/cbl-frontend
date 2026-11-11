import type { AppError } from '../../core/errors/app-error';
import { loginResponse } from '../../testing/fixtures';
import { AuthActions } from './auth.actions';
import { authReducer } from './auth.reducer';
import { initialAuthState, type AuthState } from './auth.state';

const failure: AppError = { kind: 'unauthorized', status: 401, title: 't', message: 'm', fieldErrors: {} };

describe('authReducer', () => {
  it('tiene un estado inicial sin sesión', () => {
    const state = authReducer(undefined, { type: '@@init' });
    expect(state).toEqual(initialAuthState);
    expect(state.token).toBeNull();
  });

  it('login marca carga y limpia error y aviso', () => {
    const before: AuthState = { ...initialAuthState, error: failure, notice: 'expired' };
    const state = authReducer(before, AuthActions.login({ request: { email: 'a@b.com', password: 'x' } }));
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
    expect(state.notice).toBeNull();
  });

  it('loginSuccess guarda token, usuario y caducidad solo en el estado', () => {
    const response = loginResponse();
    const state = authReducer(initialAuthState, AuthActions.loginSuccess({ response }));
    expect(state.status).toBe('authenticated');
    expect(state.token).toBe('tok');
    expect(state.user?.role).toBe('Borrower');
    expect(state.expiresAt).toBe(response.expiresAt);
  });

  it('loginFailure guarda el error sin sesión', () => {
    const state = authReducer(initialAuthState, AuthActions.loginFailure({ error: failure }));
    expect(state.status).toBe('failed');
    expect(state.error).toEqual(failure);
    expect(state.token).toBeNull();
  });

  it('logout conserva el token hasta que el servidor responde; logoutDone limpia todo con aviso', () => {
    const session = authReducer(initialAuthState, AuthActions.loginSuccess({ response: loginResponse() }));
    expect(authReducer(session, AuthActions.logout()).token).toBe('tok');
    const done = authReducer(session, AuthActions.logoutDone());
    expect(done.token).toBeNull();
    expect(done.user).toBeNull();
    expect(done.notice).toBe('loggedOut');
  });

  it('sessionExpired limpia la sesión y deja el aviso del motivo', () => {
    const session = authReducer(initialAuthState, AuthActions.loginSuccess({ response: loginResponse() }));
    const expired = authReducer(session, AuthActions.sessionExpired({ reason: 'expired' }));
    expect(expired.token).toBeNull();
    expect(expired.notice).toBe('expired');
    expect(authReducer(session, AuthActions.sessionExpired({ reason: 'unauthorized' })).notice).toBe('unauthorized');
  });

  it('clearNotice quita el aviso', () => {
    const state = authReducer({ ...initialAuthState, notice: 'expired' }, AuthActions.clearNotice());
    expect(state.notice).toBeNull();
  });
});
