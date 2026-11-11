import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { LABELS } from '../../core/i18n/labels';
import { LoansActions } from '../../store/loans/loans.actions';
import { LoanRequestFormComponent } from './loan-request-form/loan-request-form.component';
import { MyLoansListComponent } from './my-loans-list/my-loans-list.component';

/** Vista del prestamista: solicitar un préstamo y ver "Mis préstamos". */
@Component({
  selector: 'app-loans-page',
  standalone: true,
  imports: [LoanRequestFormComponent, MyLoansListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loans.page.html',
  styleUrl: './loans.page.scss',
})
export class LoansPage implements OnInit {
  private readonly store = inject(Store);
  readonly labels = LABELS;

  ngOnInit(): void {
    // Cada vez que se abre la vista se piden los límites vigentes (FR-023) y los préstamos propios.
    this.store.dispatch(LoansActions.loadLimits());
    this.store.dispatch(LoansActions.loadMine());
  }
}
