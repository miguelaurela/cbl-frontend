import { createFeatureSelector, createSelector } from '@ngrx/store';
import { USERS_FEATURE_KEY, type UsersState } from './users.state';

export const selectUsersState = createFeatureSelector<UsersState>(USERS_FEATURE_KEY);

/** Usuarios por nombre, para una lista estable. */
export const selectUsers = createSelector(selectUsersState, (state) =>
  [...state.items].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')),
);
export const selectUsersLoadStatus = createSelector(selectUsersState, (state) => state.loadStatus);
export const selectUsersLoadError = createSelector(selectUsersState, (state) => state.loadError);
export const selectUsersSaveStatus = createSelector(selectUsersState, (state) => state.saveStatus);
export const selectUsersSaveError = createSelector(selectUsersState, (state) => state.saveError);
