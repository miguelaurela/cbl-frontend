import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { environment } from '../../../../environments/environment';
import { applyServerErrors } from '../../../shared/forms/apply-server-errors';
import { errorMessage } from '../../../shared/forms/error-message';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading, selectAuthNotice } from '../../../store/auth/auth.selectors';
import type { AppError } from '../../errors/app-error';
import { LABELS } from '../../i18n/labels';

/** Pantalla de acceso (FR-001 a FR-004): correo y contraseña con errores junto a cada campo. */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnDestroy {
  private readonly store = inject(Store);

  readonly labels = LABELS;
  readonly demo = environment.useMockApi;
  readonly hidePassword = signal(true);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly loading = this.store.selectSignal(selectAuthLoading);
  private readonly error = this.store.selectSignal(selectAuthError);
  private readonly noticeKey = this.store.selectSignal(selectAuthNotice);
  private readonly unmatched = signal<string[]>([]);

  readonly notice = computed(() => {
    const key = this.noticeKey();
    return key ? LABELS.login.notices[key] : null;
  });

  readonly banner = computed(() => this.bannerFor(this.error(), this.unmatched()));

  constructor() {
    // Los errores de validación del servidor (422) se muestran junto a su campo.
    effect(() => {
      const error = this.error();
      this.unmatched.set(error?.kind === 'validation' ? applyServerErrors(this.form, error.fieldErrors) : []);
    });
  }

  emailError(): string {
    return errorMessage(this.form.controls.email);
  }

  passwordError(): string {
    return errorMessage(this.form.controls.password);
  }

  togglePassword(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  submit(): void {
    if (this.loading()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.login({ request: { email: email.trim(), password } }));
  }

  ngOnDestroy(): void {
    this.store.dispatch(AuthActions.clearNotice());
  }

  private bannerFor(error: AppError | null, unmatched: string[]): string | null {
    if (!error) {
      return null;
    }
    const wait = error.retryAfterSeconds !== undefined ? LABELS.errors.waitMinutesSeconds(error.retryAfterSeconds) : null;
    switch (error.kind) {
      case 'unauthorized':
        // Mensaje único y genérico: no revela si el correo existe (FR-003).
        return LABELS.login.invalidCredentials;
      case 'locked':
        return wait ? LABELS.login.locked(wait) : LABELS.login.lockedNoWait;
      case 'rateLimited':
        return wait ? LABELS.login.rateLimited(wait) : LABELS.login.rateLimitedNoWait;
      case 'validation':
        return unmatched.length > 0 ? unmatched.join(' ') : null;
      case 'unexpected':
        return error.traceId ? `${error.message} ${LABELS.errors.reference(error.traceId)}` : error.message;
      default:
        return error.message;
    }
  }
}
