import type { Loan, LoginResponse, User } from '../core/models';

/** Datos de prueba compartidos por las pruebas unitarias (no forma parte del build de la aplicación). */
export const loginResponse = (overrides: Partial<LoginResponse> = {}): LoginResponse => ({
  accessToken: 'tok',
  tokenType: 'Bearer',
  expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  user: { id: 'u1', email: 'usuario@test.com', fullName: 'Prestamista', role: 'Borrower' },
  ...overrides,
});

export const adminLoginResponse = (): LoginResponse =>
  loginResponse({ user: { id: 'a1', email: 'admin@test.com', fullName: 'Admin', role: 'Admin' } });

export const loanFixture = (overrides: Partial<Loan> = {}): Loan => ({
  id: 'l1',
  borrowerId: 'u1',
  borrowerName: 'Ana Pérez',
  borrowerEmail: 'ana@test.com',
  amount: 5000,
  termMonths: 12,
  status: 'Pending',
  createdAt: '2026-11-11T10:00:00Z',
  decidedAt: null,
  decidedById: null,
  decidedByName: null,
  version: 0,
  ...overrides,
});

export const userFixture = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  email: 'usuario@test.com',
  fullName: 'Usuario',
  role: 'Borrower',
  isActive: true,
  createdAt: '2026-01-15T10:00:00Z',
  ...overrides,
});
