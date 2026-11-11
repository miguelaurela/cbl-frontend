import { isSessionActive, selectIsAuthenticated, selectRole, selectToken } from './auth.selectors';
import { initialAuthState, type AuthState } from './auth.state';

const root = (auth: AuthState) => ({ auth });
const future = () => new Date(Date.now() + 60_000).toISOString();
const past = () => new Date(Date.now() - 60_000).toISOString();

describe('auth selectors', () => {
  it('selectIsAuthenticated exige token y expiresAt en el futuro', () => {
    expect(selectIsAuthenticated(root(initialAuthState))).toBeFalse();
    expect(selectIsAuthenticated(root({ ...initialAuthState, token: 't', expiresAt: future() }))).toBeTrue();
    expect(selectIsAuthenticated(root({ ...initialAuthState, token: 't', expiresAt: past() }))).toBeFalse();
    expect(selectIsAuthenticated(root({ ...initialAuthState, token: null, expiresAt: future() }))).toBeFalse();
  });

  it('isSessionActive usa el reloj indicado', () => {
    const state = { token: 't', expiresAt: '2026-01-01T00:10:00Z' };
    expect(isSessionActive(state, Date.parse('2026-01-01T00:09:59Z'))).toBeTrue();
    expect(isSessionActive(state, Date.parse('2026-01-01T00:10:00Z'))).toBeFalse();
  });

  it('selectToken y selectRole leen el estado', () => {
    const state = root({
      ...initialAuthState,
      token: 'abc',
      user: { id: '1', email: 'a@b.com', fullName: 'A', role: 'Admin' },
    });
    expect(selectToken(state)).toBe('abc');
    expect(selectRole(state)).toBe('Admin');
    expect(selectRole(root(initialAuthState))).toBeNull();
  });
});
