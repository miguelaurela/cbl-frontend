import { inject, InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface RuntimeConfig {
  apiBaseUrl: string;
}

/** Configuración efectiva en tiempo de ejecución (se rellena antes de arrancar la aplicación). */
export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG', {
  providedIn: 'root',
  factory: () => ({ apiBaseUrl: environment.apiBaseUrl }),
});

/** Quita las barras finales para poder concatenar rutas del tipo `/api/...`. */
export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Lee `config.json` y sustituye `apiBaseUrl` antes de arrancar. En el modo `mock` no se descarga
 * y si el archivo falta o es inválido se conserva el valor de `environment`.
 */
export async function loadRuntimeConfig(config: RuntimeConfig): Promise<void> {
  if (environment.useMockApi) {
    return;
  }
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const data: unknown = await response.json();
    const apiBaseUrl = (data as { apiBaseUrl?: unknown } | null)?.apiBaseUrl;
    if (typeof apiBaseUrl === 'string' && apiBaseUrl.trim() !== '') {
      config.apiBaseUrl = normalizeBaseUrl(apiBaseUrl.trim());
    }
  } catch {
    // Sin config.json se usa el valor de environment.
  }
}

/** Atajo para obtener la configuración desde el inyector. */
export function injectRuntimeConfig(): RuntimeConfig {
  return inject(RUNTIME_CONFIG);
}
