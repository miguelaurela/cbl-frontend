import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';
import { isSessionActive, selectAuthState } from '../../store/auth/auth.selectors';

/** Sin sesión válida redirige al acceso conservando la pantalla pedida en `returnUrl`. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const auth = store.selectSignal(selectAuthState)();
  if (isSessionActive(auth)) {
    return true;
  }
  if (auth.token !== null) {
    // Sesión vencida que el temporizador aún no limpió: se cierra y se avisa.
    store.dispatch(AuthActions.sessionExpired({ reason: 'expired' }));
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
