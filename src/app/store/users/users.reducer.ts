import { createReducer, on } from '@ngrx/store';
import { AuthActions } from '../auth/auth.actions';
import { UsersActions } from './users.actions';
import { initialUsersState, type UsersState } from './users.state';

export const usersReducer = createReducer<UsersState>(
  initialUsersState,

  // Al cerrar o caducar la sesión no queda ningún dato en memoria.
  on(AuthActions.logoutDone, AuthActions.sessionExpired, (): UsersState => initialUsersState),

  on(UsersActions.loadUsers, (state): UsersState => ({ ...state, loadStatus: 'loading', loadError: null })),
  on(UsersActions.loadUsersSuccess, (state, { users }): UsersState => ({ ...state, items: users, loadStatus: 'loaded' })),
  on(UsersActions.loadUsersFailure, (state, { error }): UsersState => ({ ...state, loadStatus: 'failed', loadError: error })),

  on(UsersActions.createUser, UsersActions.updateUser, (state): UsersState => ({
    ...state,
    saveStatus: 'saving',
    saveError: null,
  })),
  on(UsersActions.saveUserSuccess, (state): UsersState => ({ ...state, saveStatus: 'saved', saveError: null })),
  on(UsersActions.saveUserFailure, (state, { error }): UsersState => ({ ...state, saveStatus: 'failed', saveError: error })),
  on(UsersActions.resetSave, (state): UsersState => ({ ...state, saveStatus: 'idle', saveError: null })),
);
