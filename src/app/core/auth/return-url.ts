/**
 * Valida el `returnUrl` para evitar redirecciones abiertas: solo se acepta una ruta interna que empiece por `/`
 * y no por `//`, sin esquema ni barras invertidas ni caracteres de control. Devuelve `null` si no es válida.
 */
export function sanitizeReturnUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const url = value.trim();
  if (url === '' || !url.startsWith('/') || url.startsWith('//')) {
    return null;
  }
  // eslint-disable-next-line no-control-regex
  if (url.includes('\\') || /[\u0000-\u001f\u007f]/.test(url)) {
    return null;
  }
  return url;
}
