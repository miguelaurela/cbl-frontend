import type { AppError } from '../../core/errors/app-error';
import type { Loan, LoanFilter, LoanLimits } from '../../core/models';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'failed';
export type SubmitStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

/** Estado de préstamos: listas, filtro, decisiones en curso y los límites de monto (no hay un slice aparte). */
export interface LoansState {
  mine: Loan[];
  /** Lista completa del administrador; el filtro se aplica en el cliente. */
  all: Loan[];
  filter: LoanFilter;
  loadStatus: { mine: LoadStatus; all: LoadStatus };
  loadError: { mine: AppError | null; all: AppError | null };
  submitStatus: SubmitStatus;
  submitError: AppError | null;
  /** Préstamos con una decisión en curso (impide el doble envío). */
  decidingIds: string[];
  limits: LoanLimits | null;
  limitsStatus: LoadStatus;
  limitsSaveStatus: SaveStatus;
  limitsError: AppError | null;
}

export const initialLoansState: LoansState = {
  mine: [],
  all: [],
  filter: 'Pending',
  loadStatus: { mine: 'idle', all: 'idle' },
  loadError: { mine: null, all: null },
  submitStatus: 'idle',
  submitError: null,
  decidingIds: [],
  limits: null,
  limitsStatus: 'idle',
  limitsSaveStatus: 'idle',
  limitsError: null,
};

export const LOANS_FEATURE_KEY = 'loans';
