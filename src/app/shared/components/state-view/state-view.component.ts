import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LABELS } from '../../../core/i18n/labels';

/** Estados de carga, error (con reintento) y vacío; si no aplica ninguno muestra el contenido proyectado. */
@Component({
  selector: 'app-state-view',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="state" role="status" aria-live="polite">
        <mat-spinner diameter="32" aria-hidden="true" />
        <p>{{ labels.common.loading }}</p>
      </div>
    } @else if (error()) {
      <div class="state state-error" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-stroked-button type="button" (click)="retry.emit()">{{ labels.common.retry }}</button>
      </div>
    } @else if (empty()) {
      <div class="state" role="status">
        <mat-icon aria-hidden="true">inbox</mat-icon>
        <p>{{ emptyMessage() }}</p>
      </div>
    } @else {
      <ng-content />
    }
  `,
  styles: `
    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--cbl-space-2, 8px);
      padding: var(--cbl-space-5, 32px) var(--cbl-space-3, 16px);
      text-align: center;
    }
    .state-error mat-icon {
      color: var(--mat-sys-error);
    }
    p {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
})
export class StateViewComponent {
  readonly labels = LABELS;
  readonly loading = input(false);
  /** Mensaje de error ya traducido; vacío o nulo si no hay error. */
  readonly error = input<string | null>(null);
  readonly empty = input(false);
  readonly emptyMessage = input<string>(LABELS.common.empty);
  readonly retry = output<void>();
}
