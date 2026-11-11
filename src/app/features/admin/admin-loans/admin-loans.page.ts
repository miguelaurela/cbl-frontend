import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { environment } from '../../../../environments/environment';
import { LABELS } from '../../../core/i18n/labels';
import type { LoanFilter } from '../../../core/models';
import { StateViewComponent } from '../../../shared/components/state-view/state-view.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoansActions } from '../../../store/loans/loans.actions';
import {
  selectAllError,
  selectAllLoansFiltered,
  selectAllStatus,
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
    StateViewComponent,
    StatusChipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-loans.page.html',
  styleUrl: './admin-loans.page.scss',
})
export class AdminLoansPage implements OnInit {
  private readonly store = inject(Store);

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

  ngOnInit(): void {
    this.refresh();
  }

  /** Recarga desde el servidor conservando el filtro; no hay actualización periódica. */
  refresh(): void {
    this.store.dispatch(LoansActions.loadAll());
  }

  setFilter(filter: LoanFilter): void {
    this.store.dispatch(LoansActions.setFilter({ filter }));
  }
}
