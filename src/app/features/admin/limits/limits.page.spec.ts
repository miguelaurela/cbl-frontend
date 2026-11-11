import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideEffects } from '@ngrx/effects';
import { provideStore, Store } from '@ngrx/store';
import { of, Subject, throwError } from 'rxjs';
import { LoansApi } from '../../../core/api/loans.api';
import { ParametersApi } from '../../../core/api/parameters.api';
import type { LoanLimits } from '../../../core/models';
import { NotificationService } from '../../../core/notifications/notification.service';
import { LoansActions } from '../../../store/loans/loans.actions';
import { LoansEffects } from '../../../store/loans/loans.effects';
import { loansReducer } from '../../../store/loans/loans.reducer';
import { selectLimits } from '../../../store/loans/loans.selectors';
import { LimitsPage } from './limits.page';

describe('LimitsPage', () => {
  let parametersApi: jasmine.SpyObj<ParametersApi>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let fixture: ComponentFixture<LimitsPage>;
  let store: Store;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    parametersApi = jasmine.createSpyObj<ParametersApi>('ParametersApi', ['getLoanLimits', 'updateLoanLimits']);
    parametersApi.getLoanLimits.and.returnValue(of({ minAmount: 1000, maxAmount: 100000 }));
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info']);
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideStore({ loans: loansReducer }),
        provideEffects(LoansEffects),
        { provide: ParametersApi, useValue: parametersApi },
        { provide: LoansApi, useValue: jasmine.createSpyObj<LoansApi>('LoansApi', ['listMine']) },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(LimitsPage);
    fixture.detectChanges();
  });

  const fill = (min: number | null, max: number | null) => {
    fixture.componentInstance.form.setValue({ minAmount: min, maxAmount: max });
  };
  const submit = () => {
    (el().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const errors = () => Array.from(el().querySelectorAll('mat-error')).map((e) => e.textContent?.trim() ?? '');

  it('al abrirse carga y muestra el mínimo y el máximo vigentes', () => {
    expect(parametersApi.getLoanLimits).toHaveBeenCalled();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ minAmount: 1000, maxAmount: 100000 });
    expect((el().querySelector('input[formcontrolname="minAmount"]') as HTMLInputElement).value).toBe('1000');
  });

  it('valida antes de enviar: mínimo ≤ 0, máximo ≤ mínimo y más de 2 decimales', () => {
    fill(0, 500);
    submit();
    expect(parametersApi.updateLoanLimits).not.toHaveBeenCalled();
    expect(errors().join(' ')).toContain('mayor que 0');

    fill(1000, 1000);
    submit();
    expect(errors().join(' ')).toContain('mayor que el mínimo');

    fill(10.123, 5000.456);
    submit();
    expect(errors().filter((e) => e.includes('2 decimales')).length).toBe(2);
    expect(parametersApi.updateLoanLimits).not.toHaveBeenCalled();
  });

  it('al guardar avisa que se aplica solo a las solicitudes nuevas y actualiza los vigentes', () => {
    parametersApi.updateLoanLimits.and.returnValue(of({ minAmount: 500, maxAmount: 90000 }));
    fill(500, 90000);
    submit();
    expect(parametersApi.updateLoanLimits).toHaveBeenCalledOnceWith({ minAmount: 500, maxAmount: 90000 });
    expect(notifications.success).toHaveBeenCalledWith(jasmine.stringMatching(/solo a las solicitudes nuevas/));
    expect(el().querySelector('[data-testid="limits-note"]')?.textContent).toContain('solo a las solicitudes nuevas');
    expect(store.selectSignal(selectLimits)()).toEqual({ minAmount: 500, maxAmount: 90000 });
  });

  it('un solo envío aunque se pulse varias veces', () => {
    parametersApi.updateLoanLimits.and.returnValue(new Subject<LoanLimits>());
    fill(500, 90000);
    submit();
    submit();
    submit();
    expect(parametersApi.updateLoanLimits).toHaveBeenCalledTimes(1);
  });

  it('los errores del servidor aparecen junto a cada campo', () => {
    parametersApi.updateLoanLimits.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { title: 'V', status: 422, errors: { minAmount: ['Mínimo inválido'], maxAmount: ['Máximo inválido'] } },
          }),
      ),
    );
    fill(500, 90000);
    submit();
    expect(errors()).toEqual(['Mínimo inválido', 'Máximo inválido']);
  });

  it('un error inesperado se muestra como mensaje general', () => {
    parametersApi.updateLoanLimits.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    fill(500, 90000);
    submit();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain('No se pudo conectar');
  });

  it('si no se pueden cargar los límites muestra el error con "Reintentar"', () => {
    TestBed.resetTestingModule();
    parametersApi.getLoanLimits.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideStore({ loans: loansReducer }),
        provideEffects(LoansEffects),
        { provide: ParametersApi, useValue: parametersApi },
        { provide: LoansApi, useValue: jasmine.createSpyObj<LoansApi>('LoansApi', ['listMine']) },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const failed = TestBed.createComponent(LimitsPage);
    failed.detectChanges();
    expect((failed.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar los límites');
    TestBed.inject(Store).dispatch(LoansActions.loadLimits());
  });
});
