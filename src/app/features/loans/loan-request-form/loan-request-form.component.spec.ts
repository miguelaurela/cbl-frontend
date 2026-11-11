import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideEffects } from '@ngrx/effects';
import { provideStore, Store } from '@ngrx/store';
import { of, Subject, throwError } from 'rxjs';
import { LoansApi } from '../../../core/api/loans.api';
import { ParametersApi } from '../../../core/api/parameters.api';
import type { Loan } from '../../../core/models';
import { NotificationService } from '../../../core/notifications/notification.service';
import { LoansActions } from '../../../store/loans/loans.actions';
import { LoansEffects } from '../../../store/loans/loans.effects';
import { loansReducer } from '../../../store/loans/loans.reducer';
import { loanFixture } from '../../../testing/fixtures';
import { LoanRequestFormComponent } from './loan-request-form.component';

describe('LoanRequestFormComponent', () => {
  let loansApi: jasmine.SpyObj<LoansApi>;
  let fixture: ComponentFixture<LoanRequestFormComponent>;
  let store: Store;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    loansApi = jasmine.createSpyObj<LoansApi>('LoansApi', ['create', 'listMine']);
    loansApi.listMine.and.returnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideStore({ loans: loansReducer }),
        provideEffects(LoansEffects),
        { provide: LoansApi, useValue: loansApi },
        { provide: ParametersApi, useValue: jasmine.createSpyObj<ParametersApi>('ParametersApi', ['getLoanLimits']) },
        { provide: NotificationService, useValue: jasmine.createSpyObj<NotificationService>('N', ['success', 'error', 'info']) },
      ],
    });
    store = TestBed.inject(Store);
    store.dispatch(LoansActions.loadLimitsSuccess({ limits: { minAmount: 1000, maxAmount: 100000 } }));
    fixture = TestBed.createComponent(LoanRequestFormComponent);
    fixture.detectChanges();
  });

  const fill = (amount: number | null, term: number | null) => {
    fixture.componentInstance.form.setValue({ amount, termMonths: term });
  };
  const submit = () => {
    (el().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const errors = () => Array.from(el().querySelectorAll('mat-error')).map((e) => e.textContent?.trim());

  it('la ayuda muestra los límites y el plazo', () => {
    const text = el().textContent ?? '';
    expect(text).toContain('$1,000.00');
    expect(text).toContain('$100,000.00');
    expect(text).toContain('1 a 60 meses');
  });

  it('inválido: error junto al campo y sin envío', () => {
    submit();
    expect(loansApi.create).not.toHaveBeenCalled();
    expect(errors().length).toBe(2);
    fill(999.99, 61);
    submit();
    expect(loansApi.create).not.toHaveBeenCalled();
    expect(errors().join(' ')).toContain('mínimo');
    expect(errors().join(' ')).toContain('máximo');
  });

  it('un solo envío aunque se pulse varias veces', () => {
    loansApi.create.and.returnValue(new Subject<Loan>());
    fill(5000, 12);
    submit();
    submit();
    submit();
    expect(loansApi.create).toHaveBeenCalledTimes(1);
    expect(loansApi.create).toHaveBeenCalledWith({ amount: 5000, termMonths: 12 });
  });

  it('el 422 del servidor aparece junto a su campo y desaparece al editar', () => {
    loansApi.create.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 422, error: { title: 'Validación', status: 422, errors: { amount: ['Fuera de rango'] } } }),
      ),
    );
    fill(5000, 12);
    submit();
    expect(errors()).toEqual(['Fuera de rango']);
    fixture.componentInstance.form.controls.amount.setValue(6000);
    fixture.detectChanges();
    expect(errors()).toEqual([]);
  });

  it('un error inesperado se muestra como mensaje general', () => {
    loansApi.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    fill(5000, 12);
    submit();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain('No se pudo conectar');
  });

  it('el formulario se limpia al terminar con éxito', () => {
    loansApi.create.and.returnValue(of(loanFixture()));
    fill(5000, 12);
    submit();
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ amount: null, termMonths: null });
    expect(loansApi.listMine).toHaveBeenCalled();
  });

  it('al cambiar los límites se revalida el monto', () => {
    fill(500, 12);
    store.dispatch(LoansActions.loadLimitsSuccess({ limits: { minAmount: 100, maxAmount: 1000 } }));
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.amount.valid).toBeTrue();
  });
});
