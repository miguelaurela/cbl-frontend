import { Injectable } from '@angular/core';
import type { Loan, LoanLimits, Role } from '../models';

/** Usuario del mock; la contraseña se guarda en claro porque solo existe en memoria en el modo demostración. */
export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  password: string;
}

export interface LoginAttempts {
  fails: number;
  /** Instante (ms) en que termina el bloqueo, o null si no está bloqueado. */
  lockedUntil: number | null;
  /** Instante (ms) del primer fallo de la ventana actual. */
  windowStart: number;
}

/** Base de datos en memoria del modo demostración: se pierde al recargar la página. */
@Injectable({ providedIn: 'root' })
export class MockDb {
  /** Contraseña de todas las cuentas de ejemplo (solo de ejemplo). */
  static readonly SEED_PASSWORD = '123';

  users: MockUser[] = seedUsers();
  loans: Loan[] = seedLoans();
  limits: LoanLimits = { minAmount: 1000, maxAmount: 100000 };
  /** Intentos fallidos de login por correo en minúsculas (existan o no). */
  readonly attempts = new Map<string, LoginAttempts>();
  /** jti revocados por el cierre de sesión. */
  readonly revoked = new Map<string, number>();

  findUserByEmail(email: string): MockUser | undefined {
    const normalized = email.trim().toLowerCase();
    return this.users.find((user) => user.email.toLowerCase() === normalized);
  }

  findUserById(id: string): MockUser | undefined {
    return this.users.find((user) => user.id === id);
  }

  /** Genera un identificador con forma de UUID para usuarios y préstamos nuevos. */
  newId(): string {
    return crypto.randomUUID();
  }
}

function seedUsers(): MockUser[] {
  const base = '2026-01-15T10:00:00Z';
  return [
    seed('a0000000-0000-4000-8000-000000000001', 'admin@test.com', 'Administrador de ejemplo', 'Admin', base),
    seed('b0000000-0000-4000-8000-000000000001', 'usuario@test.com', 'Prestamista de ejemplo', 'Borrower', base),
    seed('b0000000-0000-4000-8000-000000000002', 'ana@test.com', 'Ana Pérez', 'Borrower', base),
    seed('b0000000-0000-4000-8000-000000000003', 'carlos@test.com', 'Carlos Gómez', 'Borrower', base),
  ];
}

const ADMIN_ID = 'a0000000-0000-4000-8000-000000000001';
const ADMIN_NAME = 'Administrador de ejemplo';

function seedLoan(
  n: number,
  borrower: { id: string; name: string; email: string },
  amount: number,
  termMonths: number,
  createdAt: string,
  status: Loan['status'],
  decidedAt: string | null = null,
): Loan {
  return {
    id: `c0000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    borrowerId: borrower.id,
    borrowerName: borrower.name,
    borrowerEmail: borrower.email,
    amount,
    termMonths,
    status,
    createdAt,
    decidedAt,
    decidedById: decidedAt ? ADMIN_ID : null,
    decidedByName: decidedAt ? ADMIN_NAME : null,
    version: decidedAt ? 1 : 0,
  };
}

/** Préstamos de ejemplo de varios prestamistas, en los tres estados. */
function seedLoans(): Loan[] {
  const usuario = { id: 'b0000000-0000-4000-8000-000000000001', name: 'Prestamista de ejemplo', email: 'usuario@test.com' };
  const ana = { id: 'b0000000-0000-4000-8000-000000000002', name: 'Ana Pérez', email: 'ana@test.com' };
  const carlos = { id: 'b0000000-0000-4000-8000-000000000003', name: 'Carlos Gómez', email: 'carlos@test.com' };
  return [
    seedLoan(1, usuario, 5000, 12, '2026-11-03T09:15:00Z', 'Approved', '2026-11-04T10:00:00Z'),
    seedLoan(2, usuario, 12000.5, 24, '2026-11-06T14:30:00Z', 'Rejected', '2026-11-07T08:45:00Z'),
    seedLoan(3, usuario, 3000, 6, '2026-11-09T16:20:00Z', 'Pending'),
    seedLoan(4, ana, 25000, 36, '2026-11-08T11:00:00Z', 'Pending'),
    seedLoan(5, ana, 8000, 18, '2026-11-02T10:10:00Z', 'Approved', '2026-11-03T12:00:00Z'),
    seedLoan(6, carlos, 60000, 48, '2026-11-10T09:00:00Z', 'Pending'),
    seedLoan(7, carlos, 1500, 3, '2026-11-01T08:00:00Z', 'Rejected', '2026-11-02T09:30:00Z'),
  ];
}

function seed(id: string, email: string, fullName: string, role: Role, createdAt: string): MockUser {
  return { id, email, fullName, role, isActive: true, createdAt, password: MockDb.SEED_PASSWORD };
}
