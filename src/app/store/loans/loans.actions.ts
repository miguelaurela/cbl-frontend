import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { AppError } from '../../core/errors/app-error';
import type { CreateLoanRequest, Loan, LoanFilter, LoanLimits } from '../../core/models';

export const LoansActions = createActionGroup({
  source: 'Loans',
  events: {
    loadMine: emptyProps(),
    loadMineSuccess: props<{ loans: Loan[] }>(),
    loadMineFailure: props<{ error: AppError }>(),

    /** Carga la lista completa del administrador (sin `status`); el filtro se aplica en el cliente. */
    loadAll: emptyProps(),
    loadAllSuccess: props<{ loans: Loan[] }>(),
    loadAllFailure: props<{ error: AppError }>(),
    setFilter: props<{ filter: LoanFilter }>(),

    create: props<{ request: CreateLoanRequest }>(),
    createSuccess: props<{ loan: Loan }>(),
    createFailure: props<{ error: AppError }>(),

    /** Aprobar o rechazar una solicitud Pendiente; siempre envía la `version` del préstamo mostrado. */
    decide: props<{ id: string; decision: 'approve' | 'reject'; version: number }>(),
    decideSuccess: props<{ loan: Loan; decision: 'approve' | 'reject' }>(),
    decideFailure: props<{ id: string; error: AppError }>(),

    loadLimits: emptyProps(),
    loadLimitsSuccess: props<{ limits: LoanLimits }>(),
    loadLimitsFailure: props<{ error: AppError }>(),

    saveLimits: props<{ limits: LoanLimits }>(),
    saveLimitsSuccess: props<{ limits: LoanLimits }>(),
    saveLimitsFailure: props<{ error: AppError }>(),
  },
});
