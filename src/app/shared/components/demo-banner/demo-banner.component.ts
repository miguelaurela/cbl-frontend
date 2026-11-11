import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LABELS } from '../../../core/i18n/labels';

/** Aviso fijo del modo demostración: los datos son de ejemplo y se pierden al recargar (FR-030). */
@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-banner" role="note">
      <mat-icon aria-hidden="true">science</mat-icon>
      <span>{{ labels.demo.banner }}</span>
    </div>
  `,
  styles: `
    .demo-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--cbl-space-2, 8px);
      padding: var(--cbl-space-1, 4px) var(--cbl-space-3, 16px);
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      font-size: 0.875rem;
      text-align: center;
    }
  `,
})
export class DemoBannerComponent {
  readonly labels = LABELS;
}
