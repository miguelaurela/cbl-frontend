import { homeRouteFor, resolvePostLoginUrl } from './home-route';
import { sanitizeReturnUrl } from './return-url';

describe('sanitizeReturnUrl', () => {
  it('acepta rutas internas', () => {
    expect(sanitizeReturnUrl('/admin/loans')).toBe('/admin/loans');
    expect(sanitizeReturnUrl('/loans?x=1#a')).toBe('/loans?x=1#a');
  });

  it('rechaza redirecciones abiertas y valores no válidos', () => {
    for (const value of ['//sitio.com', 'https://sitio.com', 'javascript:alert(1)', '\\\\sitio', '/\\sitio', '', '   ', 'loans', null, undefined]) {
      expect(sanitizeReturnUrl(value as string | null | undefined)).withContext(String(value)).toBeNull();
    }
  });

  it('rechaza caracteres de control', () => {
    expect(sanitizeReturnUrl('/loans\n')).toBe('/loans');
    expect(sanitizeReturnUrl('/lo\nans')).toBeNull();
  });
});

describe('resolvePostLoginUrl', () => {
  it('vuelve a la pantalla pedida si el rol lo permite', () => {
    expect(resolvePostLoginUrl('/admin/users', 'Admin')).toBe('/admin/users');
    expect(resolvePostLoginUrl('/loans', 'Borrower')).toBe('/loans');
  });

  it('va a la vista propia si el rol no lo permite o el retorno no es válido', () => {
    expect(resolvePostLoginUrl('/admin/loans', 'Borrower')).toBe('/loans');
    expect(resolvePostLoginUrl('/loans', 'Admin')).toBe('/admin/loans');
    expect(resolvePostLoginUrl('//evil.com', 'Admin')).toBe(homeRouteFor('Admin'));
    expect(resolvePostLoginUrl(null, 'Borrower')).toBe('/loans');
    expect(resolvePostLoginUrl('/login', 'Borrower')).toBe('/loans');
  });
});
