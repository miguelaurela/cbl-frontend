import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import type { Action } from '@ngrx/store';
import { firstValueFrom, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { LoansApi } from '../../core/api/loans.api';
import { ParametersApi } from '../../core/api/parameters.api';
import { NotificationService } from '../../core/notifications/notification.service';
import { loanFixture } from '../../testing/fixtures';
import { LoansActions } from './loans.actions';
import { LoansEffects } from './loans.effects';

describe('LoansEffects', () => {
  let actions$: ReplaySubject<Action>;
  let loansApi: jasmine.SpyObj<LoansApi>;
  let parametersApi: jasmine.SpyObj<ParametersApi>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let effects: LoansEffects;

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);
    loansApi = jasmine.createSpyObj<LoansApi>('LoansApi', ['listMine', 'listAll', 'create', 'approve', 'reject']);
    parametersApi = jasmine.createSpyObj<ParametersApi>('ParametersApi', ['getLoanLimits', 'updateLoanLimits']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info']);
    TestBed.configureTestingModule({
      providers: [
        LoansEffects,
        provideMockActions(() => actions$),
        { provide: LoansApi, useValue: loansApi },
        { provide: ParametersApi, useValue: parametersApi },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    effects = TestBed.inject(LoansEffects);
  });

  const problem = (status: number, extra: object = {}) =>
    new HttpErrorResponse({ status, error: { title: 'T', status, ...extra } });

  it('loadLimits$: éxito y fallo', async () => {
    parametersApi.getLoanLimits.and.returnValue(of({ minAmount: 1000, maxAmount: 100000 }));
    actions$.next(LoansActions.loadLimits());
    expect(await firstValueFrom(effects.loadLimits$)).toEqual(
      LoansActions.loadLimitsSuccess({ limits: { minAmount: 1000, maxAmount: 100000 } }),
    );
  });

  it('loadLimits$ con error emite loadLimitsFailure', async () => {
    parametersApi.getLoanLimits.and.returnValue(throwError(() => problem(500)));
    actions$.next(LoansActions.loadLimits());
    const action = (await firstValueFrom(effects.loadLimits$)) as ReturnType<typeof LoansActions.loadLimitsFailure>;
    expect(action.type).toBe(LoansActions.loadLimitsFailure.type);
    expect(action.error.kind).toBe('unexpected');
  });

  it('create$ éxito emite createSuccess', async () => {
    const loan = loanFixture();
    loansApi.create.and.returnValue(of(loan));
    actions$.next(LoansActions.create({ request: { amount: 5000, termMonths: 12 } }));
    expect(await firstValueFrom(effects.create$)).toEqual(LoansActions.createSuccess({ loan }));
    expect(loansApi.create).toHaveBeenCalledWith({ amount: 5000, termMonths: 12 });
  });

  it('create$ con 422 deja los errores por campo en la acción de fallo', async () => {
    loansApi.create.and.returnValue(throwError(() => problem(422, { errors: { amount: ['Fuera de rango'] } })));
    actions$.next(LoansActions.create({ request: { amount: 1, termMonths: 12 } }));
    const action = (await firstValueFrom(effects.create$)) as ReturnType<typeof LoansActions.createFailure>;
    expect(action.error.kind).toBe('validation');
    expect(action.error.fieldErrors['amount']).toEqual(['Fuera de rango']);
  });

  it('create$ con error inesperado emite createFailure inesperado', async () => {
    loansApi.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    actions$.next(LoansActions.create({ request: { amount: 5000, termMonths: 12 } }));
    const action = (await firstValueFrom(effects.create$)) as ReturnType<typeof LoansActions.createFailure>;
    expect(action.error.kind).toBe('unexpected');
  });

  it('create$ ignora envíos repetidos mientras hay uno en curso', () => {
    TestBed.resetTestingModule();
    const source = new Subject<Action>();
    const pending = new Subject<ReturnType<typeof loanFixture>>();
    loansApi.create.and.returnValue(pending);
    TestBed.configureTestingModule({
      providers: [
        LoansEffects,
        provideMockActions(() => source),
        { provide: LoansApi, useValue: loansApi },
        { provide: ParametersApi, useValue: parametersApi },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    TestBed.inject(LoansEffects).create$.subscribe();
    const create = LoansActions.create({ request: { amount: 5000, termMonths: 12 } });
    source.next(create);
    source.next(create);
    source.next(create);
    expect(loansApi.create).toHaveBeenCalledTimes(1);
  });

  it('createSuccess$ avisa y recarga "Mis préstamos"', async () => {
    actions$.next(LoansActions.createSuccess({ loan: loanFixture() }));
    expect(await firstValueFrom(effects.createSuccess$)).toEqual(LoansActions.loadMine());
    expect(notifications.success).toHaveBeenCalled();
  });

  it('loadMine$: éxito y error', async () => {
    const loans = [loanFixture()];
    loansApi.listMine.and.returnValue(of(loans));
    actions$.next(LoansActions.loadMine());
    expect(await firstValueFrom(effects.loadMine$)).toEqual(LoansActions.loadMineSuccess({ loans }));

    loansApi.listMine.and.returnValue(throwError(() => problem(500)));
    actions$.next(LoansActions.loadMine());
    const failure = (await firstValueFrom(effects.loadMine$)) as ReturnType<typeof LoansActions.loadMineFailure>;
    expect(failure.type).toBe(LoansActions.loadMineFailure.type);
  });

  it('loadAll$ llama a listAll sin status: éxito y error', async () => {
    const loans = [loanFixture()];
    loansApi.listAll.and.returnValue(of(loans));
    actions$.next(LoansActions.loadAll());
    expect(await firstValueFrom(effects.loadAll$)).toEqual(LoansActions.loadAllSuccess({ loans }));
    expect(loansApi.listAll).toHaveBeenCalledWith();

    loansApi.listAll.and.returnValue(throwError(() => problem(500)));
    actions$.next(LoansActions.loadAll());
    const failure = (await firstValueFrom(effects.loadAll$)) as ReturnType<typeof LoansActions.loadAllFailure>;
    expect(failure.type).toBe(LoansActions.loadAllFailure.type);
  });

  describe('decide$', () => {
    it('envía la versión y emite decideSuccess', async () => {
      const loan = loanFixture({ status: 'Approved', version: 1 });
      loansApi.approve.and.returnValue(of(loan));
      actions$.next(LoansActions.decide({ id: 'l1', decision: 'approve', version: 0 }));
      expect(await firstValueFrom(effects.decide$)).toEqual(LoansActions.decideSuccess({ loan, decision: 'approve' }));
      expect(loansApi.approve).toHaveBeenCalledWith('l1', 0);
    });

    it('rechazar llama a reject con la versión', async () => {
      const loan = loanFixture({ status: 'Rejected', version: 3 });
      loansApi.reject.and.returnValue(of(loan));
      actions$.next(LoansActions.decide({ id: 'l1', decision: 'reject', version: 2 }));
      await firstValueFrom(effects.decide$);
      expect(loansApi.reject).toHaveBeenCalledWith('l1', 2);
    });

    it('un error emite decideFailure con el id', async () => {
      loansApi.approve.and.returnValue(throwError(() => problem(409, { detail: 'Ya decidida' })));
      actions$.next(LoansActions.decide({ id: 'l1', decision: 'approve', version: 0 }));
      const action = (await firstValueFrom(effects.decide$)) as ReturnType<typeof LoansActions.decideFailure>;
      expect(action.id).toBe('l1');
      expect(action.error.kind).toBe('conflict');
    });

    it('ignora decisiones repetidas sobre la misma solicitud mientras hay una en curso', () => {
      TestBed.resetTestingModule();
      const source = new Subject<Action>();
      loansApi.approve.and.returnValue(new Subject<ReturnType<typeof loanFixture>>());
      TestBed.configureTestingModule({
        providers: [
          LoansEffects,
          provideMockActions(() => source),
          { provide: LoansApi, useValue: loansApi },
          { provide: ParametersApi, useValue: parametersApi },
          { provide: NotificationService, useValue: notifications },
        ],
      });
      TestBed.inject(LoansEffects).decide$.subscribe();
      const decide = LoansActions.decide({ id: 'l1', decision: 'approve', version: 0 });
      source.next(decide);
      source.next(decide);
      source.next(decide);
      source.next(LoansActions.decide({ id: 'l2', decision: 'approve', version: 0 }));
      expect(loansApi.approve).toHaveBeenCalledTimes(2);
    });
  });

  describe('tras decidir', () => {
    it('decideSuccess$ avisa y recarga la lista', async () => {
      actions$.next(LoansActions.decideSuccess({ loan: loanFixture(), decision: 'approve' }));
      expect(await firstValueFrom(effects.decideSuccess$)).toEqual(LoansActions.loadAll());
      expect(notifications.success).toHaveBeenCalledWith('Solicitud aprobada.');
    });

    it('un 409 avisa "ya fue decidida por otra persona" y recarga', async () => {
      const error = { kind: 'conflict', status: 409, title: 't', message: 'm', fieldErrors: {} } as const;
      actions$.next(LoansActions.decideFailure({ id: 'l1', error }));
      expect(await firstValueFrom(effects.decideFailure$)).toEqual(LoansActions.loadAll());
      expect(notifications.error).toHaveBeenCalledWith(jasmine.stringMatching(/ya fue decidida por otra persona/));
    });

    it('otros errores avisan y no recargan (todo queda como estaba)', () => {
      const error = { kind: 'unexpected', status: 500, title: 't', message: 'm', fieldErrors: {} } as const;
      const emitted: Action[] = [];
      effects.decideFailure$.subscribe((a) => emitted.push(a));
      actions$.next(LoansActions.decideFailure({ id: 'l1', error }));
      expect(emitted).toEqual([]);
      expect(notifications.error).toHaveBeenCalledWith(jasmine.stringMatching(/sigue como estaba/));
    });
  });

  it('cambiar el filtro no genera ninguna petición', () => {
    effects.loadAll$.pipe(toArray()).subscribe();
    actions$.next(LoansActions.setFilter({ filter: 'Approved' }));
    expect(loansApi.listAll).not.toHaveBeenCalled();
  });
});
