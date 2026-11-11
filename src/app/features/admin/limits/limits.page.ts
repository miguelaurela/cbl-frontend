import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { LABELS } from '../../../core/i18n/labels';
import { StateViewComponent } from '../../../shared/components/state-view/state-view.component';
import { applyServerErrors } from '../../../shared/forms/apply-server-errors';
import { errorMessage } from '../../../shared/forms/error-message';
import { maxLimitValidator, minLimitValidator } from '../../../shared/validators/limits.validators';
import { LoansActions } from '../../../store/loans/loans.actions';
import {
  selectLimits,
  selectLimitsError,
  selectLimitsSaveStatus,
  selectLimitsStatus,
} from '../../../store/loans/loans.selectors';

/** Límites de monto del administrador (FR-022): muestra los vigentes y permite modificarlos. */
@Component({
  selector: 'app-limits-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    StateViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './limits.page.html',
  styleUrl: './limits.page.scss',
})
export class LimitsPage implements OnInit {
  private readonly store = inject(Store);

  readonly labels = LABELS;
  readonly limits = this.store.selectSignal(selectLimits);
  private readonly status = this.store.selectSignal(selectLimitsStatus);
  private readonly saveStatus = this.store.selectSignal(selectLimitsSaveStatus);
  private readonly error = this.store.selectSignal(selectLimitsError);
  private readonly unmatched = signal<string[]>([]);

  private readonly minControl = new FormControl<number | null>(null, {
    validators: [Validators.required, minLimitValidator],
  });

  readonly form = new FormGroup({
    minAmount: this.minControl,
    maxAmount: new FormControl<number | null>(null, {
      validators: [Validators.required, maxLimitValidator(() => this.minControl.value)],
    }),
  });

  readonly loading = computed(() => this.limits() === null && this.status() !== 'failed');
  readonly loadError = computed(() => (this.limits() === null && this.status() === 'failed' ? LABELS.limits.loadError : null));
  readonly saving = computed(() => this.saveStatus() === 'saving');
  /** Tras guardar se mantiene la nota de que el cambio solo aplica a las solicitudes nuevas. */
  readonly saved = computed(() => this.saveStatus() === 'saved');

  readonly banner = computed(() => {
    const error = this.error();
    if (!error || this.status() === 'failed') {
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
    // Rellena el formulario con los límites vigentes cuando llegan (o cuando se guardan).
    effect(() => {
      const limits = this.limits();
      if (limits) {
        this.form.reset({ minAmount: limits.minAmount, maxAmount: limits.maxAmount });
      }
    });

    // El máximo depende del mínimo: se revalida cuando este cambia.
    this.form.controls.minAmount.valueChanges.subscribe(() =>
      this.form.controls.maxAmount.updateValueAndValidity({ emitEvent: false }),
    );

    // Errores por campo del servidor (`minAmount`, `maxAmount`).
    effect(() => {
      const error = this.error();
      this.unmatched.set(error?.kind === 'validation' ? applyServerErrors(this.form, error.fieldErrors) : []);
    });
  }

  ngOnInit(): void {
    this.store.dispatch(LoansActions.loadLimits());
  }

  retry(): void {
    this.store.dispatch(LoansActions.loadLimits());
  }

  minError(): string {
    return errorMessage(this.form.controls.minAmount, { required: LABELS.limits.required });
  }

  maxError(): string {
    return errorMessage(this.form.controls.maxAmount, { required: LABELS.limits.required });
  }

  submit(): void {
    if (this.saving()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { minAmount, maxAmount } = this.form.getRawValue();
    this.store.dispatch(
      LoansActions.saveLimits({ limits: { minAmount: Number(minAmount), maxAmount: Number(maxAmount) } }),
    );
  }
}
