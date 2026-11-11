import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { formatMoney } from '../../core/i18n/format';
import { LABELS } from '../../core/i18n/labels';
import type { LoanLimits } from '../../core/models';

export const TERM_MIN = 1;
export const TERM_MAX = 60;

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/** Más de 2 decimales (con tolerancia al error de coma flotante). */
export function hasMoreThanTwoDecimals(value: number): boolean {
  const cents = value * 100;
  return Math.abs(cents - Math.round(cents)) > 1e-6;
}

/** Plazo entero de 1 a 60 meses. Los errores llevan el texto ya traducido. */
export const termValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (isEmpty(control.value)) {
    return null; // `required` se aplica aparte
  }
  const value = Number(control.value);
  if (!Number.isInteger(value)) {
    return { termInteger: LABELS.loanForm.termInteger };
  }
  if (value < TERM_MIN) {
    return { termMin: LABELS.loanForm.termMin(TERM_MIN) };
  }
  if (value > TERM_MAX) {
    return { termMax: LABELS.loanForm.termMax(TERM_MAX) };
  }
  return null;
};

/**
 * Monto mayor que 0, con 2 decimales como máximo y dentro de los límites vigentes. Los límites se leen en cada
 * validación (`getLimits`), de modo que basta con revalidar el control cuando cambian.
 */
export function amountValidator(getLimits: () => LoanLimits | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) {
      return null;
    }
    const value = Number(control.value);
    if (!Number.isFinite(value) || value <= 0) {
      return { amountPositive: LABELS.loanForm.amountPositive };
    }
    if (hasMoreThanTwoDecimals(value)) {
      return { amountDecimals: LABELS.loanForm.amountDecimals };
    }
    const limits = getLimits();
    if (limits) {
      if (value < limits.minAmount) {
        return { amountMin: LABELS.loanForm.amountMin(formatMoney(limits.minAmount)) };
      }
      if (value > limits.maxAmount) {
        return { amountMax: LABELS.loanForm.amountMax(formatMoney(limits.maxAmount)) };
      }
    }
    return null;
  };
}
