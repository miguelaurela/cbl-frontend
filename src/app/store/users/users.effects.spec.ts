import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import type { Action } from '@ngrx/store';
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs';
import { UsersApi } from '../../core/api/users.api';
import { NotificationService } from '../../core/notifications/notification.service';
import { userFixture } from '../../testing/fixtures';
import { UsersActions } from './users.actions';
import { UsersEffects } from './users.effects';

describe('UsersEffects', () => {
  let actions$: ReplaySubject<Action>;
  let api: jasmine.SpyObj<UsersApi>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let effects: UsersEffects;

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);
    api = jasmine.createSpyObj<UsersApi>('UsersApi', ['list', 'create', 'update']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info']);
    TestBed.configureTestingModule({
      providers: [
        UsersEffects,
        provideMockActions(() => actions$),
        { provide: UsersApi, useValue: api },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    effects = TestBed.inject(UsersEffects);
  });

  const problem = (status: number, extra: object = {}) =>
    new HttpErrorResponse({ status, error: { title: 'T', status, ...extra } });
  const request = { email: 'n@test.com', fullName: 'N', password: '12345678', role: 'Borrower' } as const;

  it('loadUsers$: éxito y fallo', async () => {
    api.list.and.returnValue(of([userFixture()]));
    actions$.next(UsersActions.loadUsers());
    expect(await firstValueFrom(effects.loadUsers$)).toEqual(UsersActions.loadUsersSuccess({ users: [userFixture()] }));

    api.list.and.returnValue(throwError(() => problem(500)));
    actions$.next(UsersActions.loadUsers());
    const failure = (await firstValueFrom(effects.loadUsers$)) as ReturnType<typeof UsersActions.loadUsersFailure>;
    expect(failure.type).toBe(UsersActions.loadUsersFailure.type);
  });

  it('createUser$ con éxito emite saveUserSuccess y luego se recarga la lista', async () => {
    api.create.and.returnValue(of(userFixture()));
    actions$.next(UsersActions.createUser({ request }));
    expect(await firstValueFrom(effects.createUser$)).toEqual(UsersActions.saveUserSuccess({ mode: 'created' }));

    actions$.next(UsersActions.saveUserSuccess({ mode: 'created' }));
    expect(await firstValueFrom(effects.saveUserSuccess$)).toEqual(UsersActions.loadUsers());
    expect(notifications.success).toHaveBeenCalledWith('Usuario creado.');
  });

  it('updateUser$ con éxito emite saveUserSuccess "updated"', async () => {
    api.update.and.returnValue(of(userFixture()));
    actions$.next(UsersActions.updateUser({ id: 'u1', request: { fullName: 'N', role: 'Admin', isActive: true } }));
    expect(await firstValueFrom(effects.updateUser$)).toEqual(UsersActions.saveUserSuccess({ mode: 'updated' }));
    expect(api.update).toHaveBeenCalledWith('u1', { fullName: 'N', role: 'Admin', isActive: true });
  });

  it('un 409 por correo duplicado queda como error en el campo email', async () => {
    api.create.and.returnValue(throwError(() => problem(409, { detail: 'Ya existe un usuario con ese correo.' })));
    actions$.next(UsersActions.createUser({ request }));
    const action = (await firstValueFrom(effects.createUser$)) as ReturnType<typeof UsersActions.saveUserFailure>;
    expect(action.error.kind).toBe('conflict');
    expect(action.error.fieldErrors['email']).toEqual(['Ya existe un usuario con ese correo.']);
  });

  it('un 409 que ya trae errors.email lo conserva', async () => {
    api.create.and.returnValue(throwError(() => problem(409, { errors: { email: ['Duplicado'] } })));
    actions$.next(UsersActions.createUser({ request }));
    const action = (await firstValueFrom(effects.createUser$)) as ReturnType<typeof UsersActions.saveUserFailure>;
    expect(action.error.fieldErrors['email']).toEqual(['Duplicado']);
  });

  it('un 403 de la propia cuenta queda como mensaje', async () => {
    api.update.and.returnValue(throwError(() => problem(403, { detail: 'No puedes desactivar tu propia cuenta.' })));
    actions$.next(UsersActions.updateUser({ id: 'u1', request: { fullName: 'N', role: 'Borrower', isActive: false } }));
    const action = (await firstValueFrom(effects.updateUser$)) as ReturnType<typeof UsersActions.saveUserFailure>;
    expect(action.error.kind).toBe('forbidden');
    expect(action.error.message).toContain('propia cuenta');
    expect(action.error.fieldErrors).toEqual({});
  });

  it('un 422 deja los errores por campo', async () => {
    api.create.and.returnValue(throwError(() => problem(422, { errors: { password: ['Muy corta'] } })));
    actions$.next(UsersActions.createUser({ request }));
    const action = (await firstValueFrom(effects.createUser$)) as ReturnType<typeof UsersActions.saveUserFailure>;
    expect(action.error.fieldErrors['password']).toEqual(['Muy corta']);
  });
});
