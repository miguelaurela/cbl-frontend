import { Validators, type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import { LABELS } from '../../core/i18n/labels';

export const EMAIL_MAX = 256;
export const NAME_MAX = 200;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;

const empty = (value: unknown): boolean => value === null || value === undefined || value === '';

/** Correo con formato válido y 256 caracteres como máximo. `required` se aplica aparte. */
export const userEmailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (empty(control.value)) {
    return null;
  }
  const value = String(control.value).trim();
  if (value.length > EMAIL_MAX) {
    return { emailMax: LABELS.users.emailMax };
  }
  return Validators.email(control) ? { email: LABELS.errors.email } : null;
};

/** Nombre obligatorio (no solo espacios) y de 200 caracteres como máximo. */
export const userNameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value : '';
  if (value.trim() === '') {
    return { required: LABELS.users.nameRequired };
  }
  return value.trim().length > NAME_MAX ? { nameMax: LABELS.users.nameMax } : null;
};

/** Contraseña de 8 a 200 caracteres; vacía es válida aquí (al crear se añade `required`, al editar es opcional). */
export const passwordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (empty(control.value)) {
    return null;
  }
  const length = String(control.value).length;
  if (length < PASSWORD_MIN) {
    return { passwordMin: LABELS.users.passwordMin };
  }
  return length > PASSWORD_MAX ? { passwordMax: LABELS.users.passwordMax } : null;
};

/** Rol permitido: `Admin` o `Borrower`. */
export const roleValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value === 'Admin' || control.value === 'Borrower' ? null : { role: LABELS.users.roleRequired };
