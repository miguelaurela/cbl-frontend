import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { LABELS } from '../../core/i18n/labels';

/** Traduce las claves de error de un control a un texto de `labels.ts`; devuelve '' si no hay error. */
export function errorMessage(control: AbstractControl | null, overrides: Record<string, string> = {}): string {
  const errors: ValidationErrors | null = control?.errors ?? null;
  if (!errors) {
    return '';
  }
  const [key, value] = Object.entries(errors)[0] ?? [];
  if (key === undefined) {
    return '';
  }
  if (overrides[key]) {
    return overrides[key];
  }
  switch (key) {
    case 'server':
      return typeof value === 'string' && value !== '' ? value : LABELS.errors.server;
    case 'required':
      return LABELS.errors.required;
    case 'email':
      return LABELS.errors.email;
    case 'maxlength':
      return LABELS.errors.maxlength((value as { requiredLength: number }).requiredLength);
    case 'minlength':
      return LABELS.errors.minlength((value as { requiredLength: number }).requiredLength);
    default:
      return typeof value === 'string' ? value : LABELS.errors.server;
  }
}
