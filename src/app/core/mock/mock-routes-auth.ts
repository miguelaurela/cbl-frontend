import type { LoginRequest, LoginResponse } from '../models';
import { MockDb } from './mock-db';
import { ok, problem, route, type MockContext, type MockResult, type MockRoute } from './mock-router';
import { createMockToken, MOCK_TOKEN_TTL_SECONDS } from './mock-token';

/** Reglas del servidor real: 5 intentos fallidos por correo y 15 minutos de bloqueo. */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;

/** Entrada mágica de la demostración para provocar un error 500 inesperado. */
export const MOCK_FAIL_500_EMAIL = 'fail500@test.com';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(body: Partial<LoginRequest> | null): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (email === '') {
    errors['email'] = ['El correo es obligatorio.'];
  } else if (!EMAIL_FORMAT.test(email)) {
    errors['email'] = ['El correo no tiene un formato válido.'];
  }
  if (password === '') {
    errors['password'] = ['La contraseña es obligatoria.'];
  }
  return errors;
}

function recordFailure(db: MockDb, email: string, now: number): void {
  const current = db.attempts.get(email);
  const expired = current && now - current.windowStart >= LOCK_MS;
  const attempts = !current || expired ? { fails: 0, lockedUntil: null, windowStart: now } : current;
  attempts.fails += 1;
  if (attempts.fails >= MAX_FAILED_ATTEMPTS) {
    attempts.lockedUntil = now + LOCK_MS;
  }
  db.attempts.set(email, attempts);
}

function invalidCredentials(): MockResult {
  return problem(401, 'No autenticado', { detail: 'Correo o contraseña incorrectos.' });
}

function login({ body, db, now }: MockContext): MockResult {
  const request = body as Partial<LoginRequest> | null;
  const errors = validateLogin(request);
  if (Object.keys(errors).length > 0) {
    return problem(422, 'Error de validación', { errors });
  }
  const email = (request?.email ?? '').trim().toLowerCase();
  const password = request?.password ?? '';

  if (email === MOCK_FAIL_500_EMAIL) {
    return problem(500, 'Error interno del servidor');
  }

  // El bloqueo aplica por correo, exista o no, para no revelar qué correos existen.
  const attempts = db.attempts.get(email);
  if (attempts?.lockedUntil !== null && attempts?.lockedUntil !== undefined) {
    if (attempts.lockedUntil > now) {
      const retryAfter = Math.ceil((attempts.lockedUntil - now) / 1000);
      return problem(423, 'Correo bloqueado', {
        detail: 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.',
        headers: { 'Retry-After': String(retryAfter) },
      });
    }
    db.attempts.delete(email);
  }

  const user = db.findUserByEmail(email);
  if (!user || !user.isActive || user.password !== password) {
    recordFailure(db, email, now);
    return invalidCredentials();
  }

  db.attempts.delete(email);
  const iat = Math.floor(now / 1000);
  const exp = iat + MOCK_TOKEN_TTL_SECONDS;
  const response: LoginResponse = {
    accessToken: createMockToken({ sub: user.id, email: user.email, role: user.role, jti: db.newId(), iat, exp }),
    tokenType: 'Bearer',
    expiresAt: new Date(exp * 1000).toISOString(),
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  };
  return ok(response);
}

/** Cierre de sesión: revoca el `jti` hasta la expiración del token. */
function logout({ claims, db }: MockContext): MockResult {
  if (claims) {
    db.revoked.set(claims.jti, claims.exp);
  }
  return { status: 204 };
}

export const AUTH_ROUTES: MockRoute[] = [
  route('POST', '/api/auth/login', login, 'public'),
  route('POST', '/api/auth/logout', logout, 'any'),
];
