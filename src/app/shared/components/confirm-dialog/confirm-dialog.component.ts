import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { LABELS } from '../../../core/i18n/labels';

export interface ConfirmDialogData {
  title: string;
  /** Líneas de detalle mostradas como texto (nunca como HTML). */
  lines?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
}

/** Diálogo de confirmación breve; se cierra con `true` al confirmar y con `false` al cancelar. Operable con teclado. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      @for (line of data.lines ?? []; track $index) {
        <p class="line">{{ line }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">{{ data.cancelLabel ?? labels.common.cancel }}</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true" cdkFocusInitial>
        {{ data.confirmLabel ?? labels.common.confirm }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .line {
      margin: 0 0 4px;
      overflow-wrap: anywhere;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly labels = LABELS;
}
