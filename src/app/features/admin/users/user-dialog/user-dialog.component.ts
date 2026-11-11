import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import { LABELS } from '../../../../core/i18n/labels';
import type { Role, User } from '../../../../core/models';
import { applyServerErrors } from '../../../../shared/forms/apply-server-errors';
import { errorMessage } from '../../../../shared/forms/error-message';
import {
  passwordValidator,
  roleValidator,
  userEmailValidator,
  userNameValidator,
} from '../../../../shared/validators/user.validators';
import { UsersActions } from '../../../../store/users/users.actions';
import { selectUsersSaveError, selectUsersSaveStatus } from '../../../../store/users/users.selectors';

export interface UserDialogData {
  /** Usuario a editar, o `null` para crear uno nuevo. */
  user: User | null;
  /** Id del administrador con sesión: su propia cuenta tiene bloqueados el rol y el estado. */
  currentUserId: string | null;
}

/** Alta y edición de usuarios en un diálogo con Reactive Forms (FR-019, FR-020). */
@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
})
export class UserDialogComponent {
  private readonly store = inject(Store);
  private readonly dialogRef = inject<MatDialogRef<UserDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

  readonly labels = LABELS;
  readonly isEdit = this.data.user !== null;
  /** Su propia cuenta: no puede desactivarla ni cambiar su rol. */
  readonly isOwn = this.data.user !== null && this.data.user.id === this.data.currentUserId;
  readonly roles: Role[] = ['Borrower', 'Admin'];

  private readonly saveStatus = this.store.selectSignal(selectUsersSaveStatus);
  private readonly saveError = this.store.selectSignal(selectUsersSaveError);
  private readonly unmatched = signal<string[]>([]);
  readonly saving = computed(() => this.saveStatus() === 'saving');

  readonly form = new FormGroup({
    email: new FormControl(this.data.user?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, userEmailValidator],
    }),
    fullName: new FormControl(this.data.user?.fullName ?? '', { nonNullable: true, validators: [userNameValidator] }),
    role: new FormControl<Role>(this.data.user?.role ?? 'Borrower', { nonNullable: true, validators: [roleValidator] }),
    isActive: new FormControl(this.data.user?.isActive ?? true, { nonNullable: true }),
    // Al crear es obligatoria; al editar es opcional (restablece la contraseña).
    password: new FormControl('', {
      nonNullable: true,
      validators: this.isEdit ? [passwordValidator] : [Validators.required, passwordValidator],
    }),
  });

  readonly banner = computed(() => {
    const error = this.saveError();
    if (!error) {
      return null;
    }
    if (error.kind === 'validation' || error.kind === 'conflict') {
      return this.unmatched().length > 0 ? this.unmatched().join(' ') : error.kind === 'conflict' ? error.message : null;
    }
    return error.kind === 'unexpected' && error.traceId
      ? `${error.message} ${LABELS.errors.reference(error.traceId)}`
      : error.message;
  });

  constructor() {
    this.store.dispatch(UsersActions.resetSave());
    if (this.isEdit) {
      this.form.controls.email.disable();
    }
    if (this.isOwn) {
      this.form.controls.role.disable();
      this.form.controls.isActive.disable();
    }

    // Errores por campo del servidor (422 y correo duplicado en 409) junto a su campo.
    effect(() => {
      const error = this.saveError();
      const applies = error?.kind === 'validation' || error?.kind === 'conflict';
      this.unmatched.set(applies ? applyServerErrors(this.form, error.fieldErrors) : []);
    });

    // Guardado correcto: se cierra el diálogo.
    effect(() => {
      if (this.saveStatus() === 'saved') {
        this.dialogRef.close(true);
      }
    });
  }

  fieldError(name: 'email' | 'fullName' | 'password' | 'role'): string {
    return errorMessage(this.form.controls[name], {
      required: name === 'password' ? LABELS.users.passwordRequired : name === 'email' ? LABELS.users.emailRequired : LABELS.users.nameRequired,
    });
  }

  submit(): void {
    if (this.saving()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    if (this.data.user) {
      this.store.dispatch(
        UsersActions.updateUser({
          id: this.data.user.id,
          request: {
            fullName: value.fullName.trim(),
            role: value.role,
            isActive: value.isActive,
            ...(value.password !== '' ? { password: value.password } : {}),
          },
        }),
      );
    } else {
      this.store.dispatch(
        UsersActions.createUser({
          request: { email: value.email.trim(), fullName: value.fullName.trim(), password: value.password, role: value.role },
        }),
      );
    }
  }
}
