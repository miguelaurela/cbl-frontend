import { createReducer, on } from '@ngrx/store';
import { AuthActions } from '../auth/auth.actions';
import { LoansActions } from './loans.actions';
import { initialLoansState, type LoansState } from './loans.state';

export const loansReducer = createReducer<LoansState>(
  initialLoansState,

  // Al cerrar o caducar la sesión no queda ningún dato de la persona anterior en memoria.
  on(AuthActions.logoutDone, AuthActions.sessionExpired, (): LoansState => initialLoansState),

  on(LoansActions.loadMine, (state): LoansState => ({
    ...state,
    loadStatus: { ...state.loadStatus, mine: 'loading' },
    loadError: { ...state.loadError, mine: null },
  })),
  on(LoansActions.loadMineSuccess, (state, { loans }): LoansState => ({
    ...state,
    mine: loans,
    loadStatus: { ...state.loadStatus, mine: 'loaded' },
  })),
  on(LoansActions.loadMineFailure, (state, { error }): LoansState => ({
    ...state,
    loadStatus: { ...state.loadStatus, mine: 'failed' },
    loadError: { ...state.loadError, mine: error },
  })),

  on(LoansActions.loadAll, (state): LoansState => ({
    ...state,
    loadStatus: { ...state.loadStatus, all: 'loading' },
    loadError: { ...state.loadError, all: null },
  })),
  on(LoansActions.loadAllSuccess, (state, { loans }): LoansState => ({
    ...state,
    all: loans,
    loadStatus: { ...state.loadStatus, all: 'loaded' },
  })),
  on(LoansActions.loadAllFailure, (state, { error }): LoansState => ({
    ...state,
    loadStatus: { ...state.loadStatus, all: 'failed' },
    loadError: { ...state.loadError, all: error },
  })),
  on(LoansActions.setFilter, (state, { filter }): LoansState => ({ ...state, filter })),

  on(LoansActions.create, (state): LoansState => ({ ...state, submitStatus: 'submitting', submitError: null })),
  on(LoansActions.createSuccess, (state): LoansState => ({ ...state, submitStatus: 'succeeded', submitError: null })),
  on(LoansActions.createFailure, (state, { error }): LoansState => ({
    ...state,
    submitStatus: 'failed',
    submitError: error,
  })),

  on(LoansActions.decide, (state, { id }): LoansState => ({
    ...state,
    decidingIds: state.decidingIds.includes(id) ? state.decidingIds : [...state.decidingIds, id],
  })),
  on(LoansActions.decideSuccess, (state, { loan }): LoansState => ({
    ...state,
    decidingIds: state.decidingIds.filter((id) => id !== loan.id),
  })),
  on(LoansActions.decideFailure, (state, { id }): LoansState => ({
    ...state,
    decidingIds: state.decidingIds.filter((current) => current !== id),
  })),

  on(LoansActions.loadLimits, (state): LoansState => ({
    ...state,
    limitsStatus: 'loading',
    limitsSaveStatus: 'idle',
    limitsError: null,
  })),
  on(LoansActions.loadLimitsSuccess, (state, { limits }): LoansState => ({
    ...state,
    limits,
    limitsStatus: 'loaded',
  })),
  on(LoansActions.loadLimitsFailure, (state, { error }): LoansState => ({
    ...state,
    limitsStatus: 'failed',
    limitsError: error,
  })),

  on(LoansActions.saveLimits, (state): LoansState => ({ ...state, limitsSaveStatus: 'saving', limitsError: null })),
  on(LoansActions.saveLimitsSuccess, (state, { limits }): LoansState => ({
    ...state,
    limits,
    limitsStatus: 'loaded',
    limitsSaveStatus: 'saved',
    limitsError: null,
  })),
  on(LoansActions.saveLimitsFailure, (state, { error }): LoansState => ({
    ...state,
    limitsSaveStatus: 'failed',
    limitsError: error,
  })),
);
