import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { Loan } from '../../core/models';
import { LOANS_FEATURE_KEY, type LoansState } from './loans.state';

export const selectLoansState = createFeatureSelector<LoansState>(LOANS_FEATURE_KEY);

/** Del más reciente al más antiguo. */
const newestFirst = (loans: Loan[]): Loan[] =>
  [...loans].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

export const selectMyLoans = createSelector(selectLoansState, (state) => newestFirst(state.mine));
export const selectMineStatus = createSelector(selectLoansState, (state) => state.loadStatus.mine);
export const selectMineError = createSelector(selectLoansState, (state) => state.loadError.mine);

export const selectFilter = createSelector(selectLoansState, (state) => state.filter);
export const selectAllStatus = createSelector(selectLoansState, (state) => state.loadStatus.all);
export const selectAllError = createSelector(selectLoansState, (state) => state.loadError.all);

/** Lista completa del administrador filtrada en el cliente, más recientes primero. */
export const selectAllLoansFiltered = createSelector(selectLoansState, (state) =>
  newestFirst(state.all.filter((loan) => state.filter === 'All' || loan.status === state.filter)),
);

/** Pendientes de la lista completa, sea cual sea el filtro activo. */
export const selectPendingCount = createSelector(
  selectLoansState,
  (state) => state.all.filter((loan) => loan.status === 'Pending').length,
);

export const selectSubmitStatus = createSelector(selectLoansState, (state) => state.submitStatus);
export const selectSubmitError = createSelector(selectLoansState, (state) => state.submitError);

export const selectLimits = createSelector(selectLoansState, (state) => state.limits);
export const selectLimitsStatus = createSelector(selectLoansState, (state) => state.limitsStatus);
export const selectLimitsError = createSelector(selectLoansState, (state) => state.limitsError);
