import type { Role } from '../models';
import { sanitizeReturnUrl } from './return-url';

/** Vista inicial de cada rol. */
export function homeRouteFor(role: Role): string {
  return role === 'Admin' ? '/admin/loans' : '/loans';
}

/** Rol que exige una ruta, o `null` si cualquiera con sesión puede verla. */
function requiredRoleFor(url: string): Role | null {
  const path = url.split(/[?#]/, 1)[0] ?? '';
  if (path === '/admin' || path.startsWith('/admin/')) {
    return 'Admin';
  }
  if (path === '/loans' || path.startsWith('/loans/')) {
    return 'Borrower';
  }
  return null;
}

/**
 * Destino tras iniciar sesión: la pantalla pedida si es una ruta interna válida y el rol la permite;
 * en otro caso, la vista propia del rol.
 */
export function resolvePostLoginUrl(returnUrl: string | null | undefined, role: Role): string {
  const safe = sanitizeReturnUrl(returnUrl);
  if (safe === null || safe.split(/[?#]/, 1)[0] === '/login') {
    return homeRouteFor(role);
  }
  const required = requiredRoleFor(safe);
  return required === null || required === role ? safe : homeRouteFor(role);
}
