import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { formatMoney } from '../../../core/i18n/format';
import { LABELS } from '../../../core/i18n/labels';
import { applyServerErrors } from '../../../shared/forms/apply-server-errors';
import { errorMessage } from '../../../shared/forms/error-message';
import { StateViewComponent } from '../../../shared/components/state-view/state-view.component';
import { amountValidator, TERM_MAX, TERM_MIN, termValidator } from '../../../shared/validators/loan.validators';
import { LoansActions } from '../../../store/loans/loans.actions';
import {
  selectLimits,
  selectLimitsError,
  selectLimitsStatus,
  selectSubmitError,
  selectSubmitStatus,
} from '../../../store/loans/loans.selectors';

/** Formulario de solicitud de préstamo (FR-011, FR-012, FR-023): monto y plazo con los límites vigentes como ayuda. */
@Component({
  selector: 'app-loan-request-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    StateViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-request-form.component.html',
  styleUrl: './loan-request-form.component.scss',
})
export class LoanRequestFormComponent {
  private readonly store = inject(Store);
  private readonly formDirective = viewChild(FormGroupDirective);

  readonly labels = LABELS;
  readonly limits = this.store.selectSignal(selectLimits);
  readonly limitsStatus = this.store.selectSignal(selectLimitsStatus);
  private readonly limitsError = this.store.selectSignal(selectLimitsError);
  readonly submitting = computed(() => this.submitStatus() === 'submitting');
  private readonly submitStatus = this.store.selectSignal(selectSubmitStatus);
  private readonly submitError = this.store.selectSignal(selectSubmitError);
  private readonly unmatched = signal<string[]>([]);

  readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, amountValidator(() => this.limits())],
    }),
    termMonths: new FormControl<number | null>(null, { validators: [Validators.required, termValidator] }),
  });

  readonly amountHint = computed(() => {
    const limits = this.limits();
    return limits
      ? LABELS.loanForm.amountHint(formatMoney(limits.minAmount), formatMoney(limits.maxAmount))
      : '';
  });
  readonly termHint = LABELS.loanForm.termHint(TERM_MIN, TERM_MAX);

  /** Carga de límites: solo bloquea el formulario si todavía no hay límites que mostrar. */
  readonly limitsLoading = computed(() => this.limits() === null && this.limitsStatus() !== 'failed');
  readonly limitsFailed = computed(() => (this.limits() === null && this.limitsError() ? LABELS.loanForm.limitsError : null));

  readonly banner = computed(() => {
    const error = this.submitError();
    if (!error) {
      return null;
    }
    if (error.kind === 'validation') {
      return this.unmatched().length > 0 ? this.unmatched().join(' ') : null;
    }
    return error.kind === 'unexpected' && error.traceId
      ? `${error.message} ${LABELS.errors.reference(error.traceId)}`
      : error.message;
  });

  constructor() {
    // Los límites pueden cambiar: se revalida el monto con los vigentes.
    effect(() => {
      this.limits();
      this.form.controls.amount.updateValueAndValidity({ emitEvent: false });
    });

    // El 422 del servidor aparece junto a su campo y desaparece al editarlo.
    effect(() => {
      const error = this.submitError();
      this.unmatched.set(error?.kind === 'validation' ? applyServerErrors(this.form, error.fieldErrors) : []);
    });

    // Solicitud correcta: el formulario queda limpio.
    effect(() => {
      if (this.submitStatus() === 'succeeded') {
        this.formDirective()?.resetForm();
        this.form.reset();
      }
    });
  }

  amountError(): string {
    return errorMessage(this.form.controls.amount, { required: LABELS.loanForm.amountRequired });
  }

  termError(): string {
    return errorMessage(this.form.controls.termMonths, { required: LABELS.loanForm.termRequired });
  }

  retryLimits(): void {
    this.store.dispatch(LoansActions.loadLimits());
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { amount, termMonths } = this.form.getRawValue();
    this.store.dispatch(LoansActions.create({ request: { amount: Number(amount), termMonths: Number(termMonths) } }));
  }
}
