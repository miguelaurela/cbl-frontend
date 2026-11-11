import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { environment } from '../../../../environments/environment';
import { LABELS } from '../../../core/i18n/labels';
import { StateViewComponent } from '../../../shared/components/state-view/state-view.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoansActions } from '../../../store/loans/loans.actions';
import { selectMineError, selectMineStatus, selectMyLoans } from '../../../store/loans/loans.selectors';

/** "Mis préstamos" (FR-013, FR-014): solo los propios, más recientes primero; tabla desde 768 px y tarjetas debajo. */
@Component({
  selector: 'app-my-loans-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, StateViewComponent, StatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-loans-list.component.html',
  styleUrl: './my-loans-list.component.scss',
})
export class MyLoansListComponent {
  private readonly store = inject(Store);

  readonly labels = LABELS;
  readonly currencyCode = environment.currencyCode;
  readonly locale = environment.locale;
  readonly loans = this.store.selectSignal(selectMyLoans);
  private readonly status = this.store.selectSignal(selectMineStatus);
  private readonly error = this.store.selectSignal(selectMineError);

  readonly loading = computed(() => this.status() === 'loading' && this.loans().length === 0);
  readonly errorMessage = computed(() => (this.error() ? LABELS.myLoans.loadError : null));
  readonly empty = computed(() => this.status() === 'loaded' && this.loans().length === 0);

  retry(): void {
    this.store.dispatch(LoansActions.loadMine());
  }
}
