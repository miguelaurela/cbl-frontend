import type { Role } from '../models';

/** Vida de la sesión del servidor real: 10 minutos. */
export const MOCK_TOKEN_TTL_SECONDS = 10 * 60;

export interface MockClaims {
  sub: string;
  email: string;
  role: Role;
  jti: string;
  iat: number;
  /** Expiración en segundos desde la época, como el claim `exp` de un JWT. */
  exp: number;
}

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

/** Token con forma de JWT pero sin firma real: solo existe en el modo demostración. */
export function createMockToken(claims: MockClaims): string {
  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify(claims));
  return `${header}.${payload}.mock`;
}

export function parseMockToken(token: string): MockClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[2] !== 'mock') {
    return null;
  }
  try {
    const claims = JSON.parse(fromBase64Url(parts[1] ?? '')) as Partial<MockClaims>;
    if (
      typeof claims.sub === 'string' &&
      typeof claims.email === 'string' &&
      (claims.role === 'Admin' || claims.role === 'Borrower') &&
      typeof claims.jti === 'string' &&
      typeof claims.exp === 'number' &&
      typeof claims.iat === 'number'
    ) {
      return claims as MockClaims;
    }
    return null;
  } catch {
    return null;
  }
}
