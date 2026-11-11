import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { LABELS } from '../../core/i18n/labels';
import { hasMoreThanTwoDecimals } from './loan.validators';

/** Tope que acepta el servidor para un límite de monto. */
export const LIMIT_CAP = 1_000_000_000_000;

const empty = (value: unknown): boolean => value === null || value === undefined || value === '';

/** Mínimo: mayor que 0, con 2 decimales como máximo y por debajo del tope. `required` se aplica aparte. */
export const minLimitValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (empty(control.value)) {
    return null;
  }
  const value = Number(control.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { minPositive: LABELS.limits.minPositive };
  }
  if (hasMoreThanTwoDecimals(value)) {
    return { decimals: LABELS.limits.decimals };
  }
  return value > LIMIT_CAP ? { cap: LABELS.limits.cap } : null;
};

/** Máximo: 2 decimales como máximo, por debajo del tope y mayor que el mínimo vigente en el formulario. */
export function maxLimitValidator(getMin: () => number | string | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (empty(control.value)) {
      return null;
    }
    const value = Number(control.value);
    if (!Number.isFinite(value)) {
      return { decimals: LABELS.limits.decimals };
    }
    if (hasMoreThanTwoDecimals(value)) {
      return { decimals: LABELS.limits.decimals };
    }
    if (value > LIMIT_CAP) {
      return { cap: LABELS.limits.cap };
    }
    const min = getMin();
    if (!empty(min) && Number.isFinite(Number(min)) && value <= Number(min)) {
      return { maxAboveMin: LABELS.limits.maxAboveMin };
    }
    return null;
  };
}
