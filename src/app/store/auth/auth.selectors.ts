import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AUTH_FEATURE_KEY, type AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>(AUTH_FEATURE_KEY);

export const selectToken = createSelector(selectAuthState, (state) => state.token);
export const selectUser = createSelector(selectAuthState, (state) => state.user);
export const selectRole = createSelector(selectUser, (user) => user?.role ?? null);
export const selectExpiresAt = createSelector(selectAuthState, (state) => state.expiresAt);
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.status === 'loading');
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
export const selectAuthNotice = createSelector(selectAuthState, (state) => state.notice);

/** Hay token y `expiresAt` en el futuro. */
export function isSessionActive(state: Pick<AuthState, 'token' | 'expiresAt'>, now: number = Date.now()): boolean {
  return state.token !== null && state.expiresAt !== null && Date.parse(state.expiresAt) > now;
}

export const selectIsAuthenticated = createSelector(selectAuthState, (state) => isSessionActive(state));
