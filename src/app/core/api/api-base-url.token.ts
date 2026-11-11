import { InjectionToken } from '@angular/core';

/** URL base de la API (sin barra final). Se fija al arrancar desde `config.json`. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
