import type { AppError } from '../../core/errors/app-error';
import { userFixture } from '../../testing/fixtures';
import { AuthActions } from '../auth/auth.actions';
import { UsersActions } from './users.actions';
import { usersReducer } from './users.reducer';
import { selectUsers } from './users.selectors';
import { initialUsersState } from './users.state';

const error: AppError = { kind: 'conflict', status: 409, title: 't', message: 'm', fieldErrors: { email: ['dup'] } };

describe('usersReducer', () => {
  it('loadUsers: carga, éxito y fallo', () => {
    let state = usersReducer(initialUsersState, UsersActions.loadUsers());
    expect(state.loadStatus).toBe('loading');
    state = usersReducer(state, UsersActions.loadUsersSuccess({ users: [userFixture()] }));
    expect(state.items.length).toBe(1);
    expect(state.loadStatus).toBe('loaded');
    state = usersReducer(state, UsersActions.loadUsersFailure({ error }));
    expect(state.loadStatus).toBe('failed');
    expect(state.loadError).toEqual(error);
  });

  it('createUser y updateUser marcan guardado; el éxito y el fallo lo cierran', () => {
    let state = usersReducer(initialUsersState, UsersActions.createUser({ request: { email: 'a@b.com', fullName: 'A', password: '12345678', role: 'Borrower' } }));
    expect(state.saveStatus).toBe('saving');
    state = usersReducer(state, UsersActions.saveUserFailure({ error }));
    expect(state.saveStatus).toBe('failed');
    expect(state.saveError?.fieldErrors['email']).toEqual(['dup']);
    state = usersReducer(state, UsersActions.updateUser({ id: '1', request: { fullName: 'A', role: 'Admin', isActive: true } }));
    expect(state.saveError).toBeNull();
    state = usersReducer(state, UsersActions.saveUserSuccess({ mode: 'updated' }));
    expect(state.saveStatus).toBe('saved');
  });

  it('resetSave limpia el resultado del guardado anterior', () => {
    const failed = usersReducer(initialUsersState, UsersActions.saveUserFailure({ error }));
    expect(usersReducer(failed, UsersActions.resetSave())).toEqual(initialUsersState);
  });

  it('al cerrar o caducar la sesión se vacía el estado', () => {
    const filled = usersReducer(initialUsersState, UsersActions.loadUsersSuccess({ users: [userFixture()] }));
    expect(usersReducer(filled, AuthActions.logoutDone())).toEqual(initialUsersState);
    expect(usersReducer(filled, AuthActions.sessionExpired({ reason: 'expired' }))).toEqual(initialUsersState);
  });

  it('selectUsers ordena por nombre', () => {
    const items = [userFixture({ id: '1', fullName: 'Zoe' }), userFixture({ id: '2', fullName: 'Ana' })];
    expect(selectUsers({ users: { ...initialUsersState, items } }).map((u) => u.fullName)).toEqual(['Ana', 'Zoe']);
  });
});
