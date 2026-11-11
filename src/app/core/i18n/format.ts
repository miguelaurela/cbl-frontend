import { formatDate as ngFormatDate } from '@angular/common';
import { environment } from '../../../environments/environment';

const moneyFormat = () =>
  new Intl.NumberFormat(environment.locale, { style: 'currency', currency: environment.currencyCode });

/** Importe en dólares estadounidenses con formato en-US (FR-024), por ejemplo `$5,000.00`. */
export function formatMoney(value: number): string {
  return moneyFormat().format(value);
}

/** Fecha y hora `dd/MM/yyyy HH:mm` en la zona horaria del navegador (FR-024). */
export function formatDateTime(iso: string): string {
  return ngFormatDate(iso, 'dd/MM/yyyy HH:mm', 'en-US');
}
