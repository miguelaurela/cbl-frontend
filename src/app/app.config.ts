import { DEFAULT_CURRENCY_CODE, LOCALE_ID, provideAppInitializer, inject, type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { API_BASE_URL } from './core/api/api-base-url.token';
import { loadRuntimeConfig, RUNTIME_CONFIG } from './core/config/runtime-config';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { MOCK_API_INTERCEPTORS } from './core/mock/mock-api.providers';
import { AuthEffects } from './store/auth/auth.effects';
import { authReducer } from './store/auth/auth.reducer';
import { AUTH_FEATURE_KEY } from './store/auth/auth.state';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // Los interceptores propios van primero; el del mock, siempre el último.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, ...MOCK_API_INTERCEPTORS])),
    provideStore({ [AUTH_FEATURE_KEY]: authReducer }),
    provideEffects(AuthEffects),
    // Las herramientas de desarrollo solo existen en desarrollo y en el modo demostración.
    ...(environment.production ? [] : [provideStoreDevtools({ maxAge: 25, connectInZone: true })]),
    // `config.json` se lee antes de arrancar para fijar la URL de la API (el mock no lo descarga).
    provideAppInitializer(() => loadRuntimeConfig(inject(RUNTIME_CONFIG))),
    { provide: API_BASE_URL, useFactory: () => inject(RUNTIME_CONFIG).apiBaseUrl },
    { provide: LOCALE_ID, useValue: environment.locale },
    { provide: DEFAULT_CURRENCY_CODE, useValue: environment.currencyCode },
  ],
};
