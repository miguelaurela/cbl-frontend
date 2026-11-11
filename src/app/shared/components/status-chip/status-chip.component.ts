import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LABELS } from '../../../core/i18n/labels';
import type { LoanStatus } from '../../../core/models';

const ICONS: Record<LoanStatus, string> = {
  Pending: 'schedule',
  Approved: 'check_circle',
  Rejected: 'cancel',
};

/** Estado del préstamo con icono, color y texto: no depende solo del color (FR-014). */
@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip" [class]="'chip status-' + status().toLowerCase()">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <span>{{ text() }}</span>
    </span>
  `,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px 2px 6px;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
    }
    .chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .status-pending {
      background: #fff3cd;
      color: #5c4400;
    }
    .status-approved {
      background: #d7f0dc;
      color: #0b4a1c;
    }
    .status-rejected {
      background: #fbdcdc;
      color: #7a0f0f;
    }
  `,
})
export class StatusChipComponent {
  readonly status = input.required<LoanStatus>();
  readonly text = computed(() => LABELS.loanStatus[this.status()]);
  readonly icon = computed(() => ICONS[this.status()]);
}
