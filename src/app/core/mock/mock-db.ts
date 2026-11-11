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
  loans: Loan[] = [];
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

function seed(id: string, email: string, fullName: string, role: Role, createdAt: string): MockUser {
  return { id, email, fullName, role, isActive: true, createdAt, password: MockDb.SEED_PASSWORD };
}
