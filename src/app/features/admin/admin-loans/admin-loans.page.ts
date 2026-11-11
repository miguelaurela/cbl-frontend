import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { environment } from '../../../../environments/environment';
import { formatMoney } from '../../../core/i18n/format';
import { LABELS } from '../../../core/i18n/labels';
import type { Loan, LoanFilter } from '../../../core/models';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StateViewComponent } from '../../../shared/components/state-view/state-view.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoansActions } from '../../../store/loans/loans.actions';
import {
  selectAllError,
  selectAllLoansFiltered,
  selectAllStatus,
  selectDecidingIds,
  selectFilter,
  selectPendingCount,
} from '../../../store/loans/loans.selectors';

interface FilterOption {
  value: LoanFilter;
  label: string;
}

/** Todas las solicitudes (FR-015, FR-016): filtro por estado en el cliente, contador de pendientes y "Actualizar". */
@Component({
  selector: 'app-admin-loans-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgTemplateOutlet,
    StateViewComponent,
    StatusChipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-loans.page.html',
  styleUrl: './admin-loans.page.scss',
})
export class AdminLoansPage implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly labels = LABELS;
  readonly currencyCode = environment.currencyCode;
  readonly locale = environment.locale;

  readonly filterOptions: FilterOption[] = [
    { value: 'All', label: LABELS.common.all },
    { value: 'Pending', label: LABELS.loanStatus.Pending },
    { value: 'Approved', label: LABELS.loanStatus.Approved },
    { value: 'Rejected', label: LABELS.loanStatus.Rejected },
  ];

  readonly filter = this.store.selectSignal(selectFilter);
  readonly loans = this.store.selectSignal(selectAllLoansFiltered);
  readonly pendingCount = this.store.selectSignal(selectPendingCount);
  private readonly status = this.store.selectSignal(selectAllStatus);
  private readonly error = this.store.selectSignal(selectAllError);

  readonly loading = computed(() => this.status() === 'loading' && this.loans().length === 0);
  readonly errorMessage = computed(() => (this.error() ? LABELS.adminLoans.loadError : null));
  readonly empty = computed(() => this.status() === 'loaded' && this.loans().length === 0);
  readonly refreshing = computed(() => this.status() === 'loading');
  readonly pendingLabel = computed(() => LABELS.adminLoans.pending(this.pendingCount()));

  readonly decidingIds = this.store.selectSignal(selectDecidingIds);
  /** Mientras el diálogo está abierto se ignoran más pulsaciones (una sola decisión aunque se pulse repetidamente). */
  private readonly dialogOpen = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  isDeciding(id: string): boolean {
    return this.decidingIds().includes(id);
  }

  /** Pide una confirmación breve y, si se acepta, envía la decisión con la versión del préstamo mostrado. */
  decide(loan: Loan, decision: 'approve' | 'reject'): void {
    if (loan.status !== 'Pending' || this.isDeciding(loan.id) || this.dialogOpen()) {
      return;
    }
    this.dialogOpen.set(true);
    const amount = formatMoney(loan.amount);
    const data: ConfirmDialogData = {
      title: decision === 'approve' ? LABELS.adminLoans.confirmApproveTitle : LABELS.adminLoans.confirmRejectTitle,
      lines: LABELS.adminLoans.confirmLines(loan.borrowerName, amount, LABELS.myLoans.months(loan.termMonths)),
      confirmLabel: decision === 'approve' ? LABELS.adminLoans.approve : LABELS.adminLoans.reject,
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        this.dialogOpen.set(false);
        if (confirmed === true && !this.isDeciding(loan.id)) {
          this.store.dispatch(LoansActions.decide({ id: loan.id, decision, version: loan.version }));
        }
      });
  }

  /** Recarga desde el servidor conservando el filtro; no hay actualización periódica. */
  refresh(): void {
    this.store.dispatch(LoansActions.loadAll());
  }

  setFilter(filter: LoanFilter): void {
    this.store.dispatch(LoansActions.setFilter({ filter }));
  }
}
