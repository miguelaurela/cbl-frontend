import type { AppError } from '../../core/errors/app-error';
import { loanFixture } from '../../testing/fixtures';
import { AuthActions } from '../auth/auth.actions';
import { LoansActions } from './loans.actions';
import { loansReducer } from './loans.reducer';
import { initialLoansState } from './loans.state';

const error: AppError = {
  kind: 'validation',
  status: 422,
  title: 't',
  message: 'm',
  fieldErrors: { amount: ['mal'] },
};

describe('loansReducer', () => {
  it('estado inicial: filtro Pendiente y sin datos', () => {
    const state = loansReducer(undefined, { type: '@@init' });
    expect(state.filter).toBe('Pending');
    expect(state.mine).toEqual([]);
    expect(state.limits).toBeNull();
  });

  it('create marca envío y limpia el error; createFailure guarda los errores por campo', () => {
    let state = loansReducer(initialLoansState, LoansActions.create({ request: { amount: 5000, termMonths: 12 } }));
    expect(state.submitStatus).toBe('submitting');
    state = loansReducer(state, LoansActions.createFailure({ error }));
    expect(state.submitStatus).toBe('failed');
    expect(state.submitError?.fieldErrors['amount']).toEqual(['mal']);
    state = loansReducer(state, LoansActions.create({ request: { amount: 5000, termMonths: 12 } }));
    expect(state.submitError).toBeNull();
  });

  it('createSuccess termina el envío', () => {
    const state = loansReducer(initialLoansState, LoansActions.createSuccess({ loan: loanFixture() }));
    expect(state.submitStatus).toBe('succeeded');
  });

  it('loadLimits guarda los límites vigentes', () => {
    let state = loansReducer(initialLoansState, LoansActions.loadLimits());
    expect(state.limitsStatus).toBe('loading');
    state = loansReducer(state, LoansActions.loadLimitsSuccess({ limits: { minAmount: 1, maxAmount: 2 } }));
    expect(state.limits).toEqual({ minAmount: 1, maxAmount: 2 });
    expect(state.limitsStatus).toBe('loaded');
    state = loansReducer(state, LoansActions.loadLimitsFailure({ error }));
    expect(state.limitsStatus).toBe('failed');
  });

  it('saveLimits: guarda, actualiza los límites vigentes y conserva los errores por campo al fallar', () => {
    let state = loansReducer(initialLoansState, LoansActions.saveLimits({ limits: { minAmount: 1, maxAmount: 2 } }));
    expect(state.limitsSaveStatus).toBe('saving');
    state = loansReducer(state, LoansActions.saveLimitsFailure({ error }));
    expect(state.limitsSaveStatus).toBe('failed');
    expect(state.limitsError?.fieldErrors['amount']).toEqual(['mal']);
    state = loansReducer(state, LoansActions.saveLimits({ limits: { minAmount: 5, maxAmount: 9 } }));
    expect(state.limitsError).toBeNull();
    state = loansReducer(state, LoansActions.saveLimitsSuccess({ limits: { minAmount: 5, maxAmount: 9 } }));
    expect(state.limits).toEqual({ minAmount: 5, maxAmount: 9 });
    expect(state.limitsSaveStatus).toBe('saved');
    expect(loansReducer(state, LoansActions.loadLimits()).limitsSaveStatus).toBe('idle');
  });

  it('loadMine: carga, éxito y fallo', () => {
    let state = loansReducer(initialLoansState, LoansActions.loadMine());
    expect(state.loadStatus.mine).toBe('loading');
    state = loansReducer(state, LoansActions.loadMineSuccess({ loans: [loanFixture()] }));
    expect(state.mine.length).toBe(1);
    expect(state.loadStatus.mine).toBe('loaded');
    state = loansReducer(state, LoansActions.loadMineFailure({ error }));
    expect(state.loadStatus.mine).toBe('failed');
    expect(state.loadError.mine).toEqual(error);
  });

  it('decidingIds marca la decisión en curso y la libera al terminar o fallar', () => {
    let state = loansReducer(initialLoansState, LoansActions.decide({ id: 'a', decision: 'approve', version: 0 }));
    state = loansReducer(state, LoansActions.decide({ id: 'a', decision: 'approve', version: 0 }));
    state = loansReducer(state, LoansActions.decide({ id: 'b', decision: 'reject', version: 0 }));
    expect(state.decidingIds).toEqual(['a', 'b']);
    state = loansReducer(state, LoansActions.decideSuccess({ loan: loanFixture({ id: 'a' }), decision: 'approve' }));
    expect(state.decidingIds).toEqual(['b']);
    state = loansReducer(state, LoansActions.decideFailure({ id: 'b', error }));
    expect(state.decidingIds).toEqual([]);
  });

  it('al cerrar o caducar la sesión se vacía el estado de préstamos', () => {
    const filled = loansReducer(initialLoansState, LoansActions.loadMineSuccess({ loans: [loanFixture()] }));
    expect(loansReducer(filled, AuthActions.logoutDone())).toEqual(initialLoansState);
    expect(loansReducer(filled, AuthActions.sessionExpired({ reason: 'expired' }))).toEqual(initialLoansState);
  });

  it('loadAll y setFilter: el filtro es solo del cliente y no toca la lista', () => {
    let state = loansReducer(initialLoansState, LoansActions.loadAllSuccess({ loans: [loanFixture(), loanFixture({ id: 'l2', status: 'Approved' })] }));
    expect(state.all.length).toBe(2);
    state = loansReducer(state, LoansActions.setFilter({ filter: 'Approved' }));
    expect(state.filter).toBe('Approved');
    expect(state.all.length).toBe(2);
    expect(loansReducer(state, LoansActions.loadAll()).loadStatus.all).toBe('loading');
    expect(loansReducer(state, LoansActions.loadAllFailure({ error })).loadStatus.all).toBe('failed');
  });
});
