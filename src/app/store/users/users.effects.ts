import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { UsersApi } from '../../core/api/users.api';
import type { AppError } from '../../core/errors/app-error';
import { toAppError } from '../../core/errors/to-app-error';
import { LABELS } from '../../core/i18n/labels';
import { NotificationService } from '../../core/notifications/notification.service';
import { UsersActions } from './users.actions';

/** Un 409 sin campo es un correo duplicado: se muestra junto al campo `email`. */
function withEmailConflict(error: AppError): AppError {
  return error.kind === 'conflict' && Object.keys(error.fieldErrors).length === 0
    ? { ...error, fieldErrors: { email: [error.message] } }
    : error;
}

@Injectable()
export class UsersEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(UsersApi);
  private readonly notifications = inject(NotificationService);

  readonly loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      switchMap(() =>
        this.api.list().pipe(
          map((users) => UsersActions.loadUsersSuccess({ users })),
          catchError((error: unknown) => of(UsersActions.loadUsersFailure({ error: toAppError(error) }))),
        ),
      ),
    ),
  );

  readonly createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.createUser),
      exhaustMap(({ request }) =>
        this.api.create(request).pipe(
          map(() => UsersActions.saveUserSuccess({ mode: 'created' })),
          catchError((error: unknown) =>
            of(UsersActions.saveUserFailure({ error: withEmailConflict(toAppError(error)) })),
          ),
        ),
      ),
    ),
  );

  readonly updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateUser),
      exhaustMap(({ id, request }) =>
        this.api.update(id, request).pipe(
          map(() => UsersActions.saveUserSuccess({ mode: 'updated' })),
          catchError((error: unknown) =>
            of(UsersActions.saveUserFailure({ error: withEmailConflict(toAppError(error)) })),
          ),
        ),
      ),
    ),
  );

  /** Al guardar: aviso y recarga de la lista desde el servidor. */
  readonly saveUserSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.saveUserSuccess),
      tap(({ mode }) =>
        this.notifications.success(mode === 'created' ? LABELS.users.created_ok : LABELS.users.updated_ok),
      ),
      map(() => UsersActions.loadUsers()),
    ),
  );
}
