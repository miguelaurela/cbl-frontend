import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LABELS } from '../i18n/labels';

const DURATION_MS = 4000;

/** Envoltorio de MatSnackBar: avisos de éxito, error e información anunciados con cortesía a lectores de pantalla. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'cbl-snack-success');
  }

  error(message: string): void {
    this.open(message, 'cbl-snack-error');
  }

  info(message: string): void {
    this.open(message, 'cbl-snack-info');
  }

  private open(message: string, panelClass: string): void {
    this.snackBar.open(message, LABELS.common.close, {
      duration: DURATION_MS,
      politeness: 'polite',
      panelClass,
    });
  }
}
