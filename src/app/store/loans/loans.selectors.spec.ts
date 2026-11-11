import { loanFixture } from '../../testing/fixtures';
import { selectAllLoansFiltered, selectMyLoans, selectPendingCount } from './loans.selectors';
import { initialLoansState, type LoansState } from './loans.state';

const root = (loans: Partial<LoansState>) => ({ loans: { ...initialLoansState, ...loans } });

const old = loanFixture({ id: 'old', createdAt: '2026-11-01T10:00:00Z', status: 'Approved' });
const mid = loanFixture({ id: 'mid', createdAt: '2026-11-05T10:00:00Z', status: 'Pending' });
const recent = loanFixture({ id: 'recent', createdAt: '2026-11-10T10:00:00Z', status: 'Rejected' });
const recentPending = loanFixture({ id: 'recent-p', createdAt: '2026-11-11T10:00:00Z', status: 'Pending' });

describe('loans selectors', () => {
  it('selectMyLoans ordena del más reciente al más antiguo', () => {
    const state = root({ mine: [old, recent, mid] });
    expect(selectMyLoans(state).map((l) => l.id)).toEqual(['recent', 'mid', 'old']);
  });

  it('selectAllLoansFiltered filtra la lista completa en el cliente y ordena', () => {
    const all = [old, mid, recent, recentPending];
    expect(selectAllLoansFiltered(root({ all, filter: 'Pending' })).map((l) => l.id)).toEqual(['recent-p', 'mid']);
    expect(selectAllLoansFiltered(root({ all, filter: 'Approved' })).map((l) => l.id)).toEqual(['old']);
    expect(selectAllLoansFiltered(root({ all, filter: 'All' })).map((l) => l.id)).toEqual(['recent-p', 'recent', 'mid', 'old']);
  });

  it('selectPendingCount cuenta los pendientes de la lista completa sea cual sea el filtro', () => {
    const all = [old, mid, recent, recentPending];
    for (const filter of ['All', 'Pending', 'Approved', 'Rejected'] as const) {
      expect(selectPendingCount(root({ all, filter }))).toBe(2);
    }
  });

  it('con la lista vacía el contador es 0', () => {
    expect(selectPendingCount(root({}))).toBe(0);
  });
});
