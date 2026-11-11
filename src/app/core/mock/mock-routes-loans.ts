import type { CreateLoanRequest, Loan, LoanLimits, LoanStatus } from '../models';
import { ok, problem, route, type MockContext, type MockResult, type MockRoute } from './mock-router';

const STATUSES: readonly LoanStatus[] = ['Pending', 'Approved', 'Rejected'];
const TERM_MIN = 1;
const TERM_MAX = 60;

/** Del más reciente al más antiguo. */
const newestFirst = (loans: Loan[]): Loan[] =>
  [...loans].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

const formatLimit = (value: number): string => value.toLocaleString('es-ES', { maximumFractionDigits: 2 });

function hasMoreThanTwoDecimals(value: number): boolean {
  const cents = value * 100;
  return Math.abs(cents - Math.round(cents)) > 1e-6;
}

/** Mismas reglas y mensajes que el backend: monto > 0, 2 decimales y dentro de los límites; plazo entero de 1 a 60. */
export function validateLoanRequest(body: Partial<CreateLoanRequest> | null, limits: LoanLimits): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const amount = body?.amount;
  const term = body?.termMonths;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    errors['amount'] = ['El monto debe ser mayor que 0.'];
  } else if (hasMoreThanTwoDecimals(amount)) {
    errors['amount'] = ['El monto no puede tener más de 2 decimales.'];
  } else if (amount < limits.minAmount || amount > limits.maxAmount) {
    errors['amount'] = [`El monto debe estar entre ${formatLimit(limits.minAmount)} y ${formatLimit(limits.maxAmount)}.`];
  }
  if (typeof term !== 'number' || !Number.isInteger(term) || term < TERM_MIN || term > TERM_MAX) {
    errors['termMonths'] = [`El plazo debe ser un número entero de ${TERM_MIN} a ${TERM_MAX} meses.`];
  }
  return errors;
}

function getLimits({ db }: MockContext): MockResult {
  return ok(db.limits);
}

function createLoan({ body, db, now, claims }: MockContext): MockResult {
  const errors = validateLoanRequest(body as Partial<CreateLoanRequest> | null, db.limits);
  if (Object.keys(errors).length > 0) {
    return problem(422, 'Error de validación', { errors });
  }
  const request = body as CreateLoanRequest;
  const borrower = db.findUserById(claims?.sub ?? '');
  const loan: Loan = {
    id: db.newId(),
    borrowerId: borrower?.id ?? claims?.sub ?? '',
    borrowerName: borrower?.fullName ?? '',
    borrowerEmail: borrower?.email ?? claims?.email ?? '',
    amount: request.amount,
    termMonths: request.termMonths,
    status: 'Pending',
    createdAt: new Date(now).toISOString(),
    decidedAt: null,
    decidedById: null,
    decidedByName: null,
    version: 0,
  };
  db.loans.push(loan);
  return ok(loan, 201);
}

function listMine({ db, claims }: MockContext): MockResult {
  return ok(newestFirst(db.loans.filter((loan) => loan.borrowerId === claims?.sub)));
}

function listAll({ db, query }: MockContext): MockResult {
  const status = query.get('status');
  if (status !== null && !STATUSES.includes(status as LoanStatus)) {
    return problem(400, 'Solicitud no válida', { detail: 'El estado debe ser Pending, Approved o Rejected.' });
  }
  const loans = status === null ? db.loans : db.loans.filter((loan) => loan.status === status);
  return ok(newestFirst(loans));
}

export const LOAN_ROUTES: MockRoute[] = [
  route('GET', '/api/parameters/loan-limits', getLimits, 'any'),
  route('POST', '/api/loans', createLoan, ['Borrower']),
  route('GET', '/api/loans/mine', listMine, ['Borrower']),
  route('GET', '/api/loans', listAll, ['Admin']),
];
