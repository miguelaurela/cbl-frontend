import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { AppError } from '../../core/errors/app-error';
import type { CreateUserRequest, UpdateUserRequest, User } from '../../core/models';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    loadUsers: emptyProps(),
    loadUsersSuccess: props<{ users: User[] }>(),
    loadUsersFailure: props<{ error: AppError }>(),

    createUser: props<{ request: CreateUserRequest }>(),
    updateUser: props<{ id: string; request: UpdateUserRequest }>(),
    saveUserSuccess: props<{ mode: 'created' | 'updated' }>(),
    saveUserFailure: props<{ error: AppError }>(),
    /** Se despacha al abrir el diálogo para limpiar el resultado del guardado anterior. */
    resetSave: emptyProps(),
  },
});
