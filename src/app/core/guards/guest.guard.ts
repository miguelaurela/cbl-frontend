import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { isSessionActive, selectAuthState } from '../../store/auth/auth.selectors';
import { homeRouteFor } from '../auth/home-route';

/** Con sesión válida no se muestra el acceso: se redirige a la vista propia. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Store).selectSignal(selectAuthState)();
  if (isSessionActive(auth) && auth.user) {
    return inject(Router).parseUrl(homeRouteFor(auth.user.role));
  }
  return true;
};
