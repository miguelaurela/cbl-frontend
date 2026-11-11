import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { isSessionActive, selectAuthState } from '../../store/auth/auth.selectors';
import { homeRouteFor } from '../auth/home-route';
import { LABELS } from '../i18n/labels';
import type { Role } from '../models';
import { NotificationService } from '../notifications/notification.service';

/** Con un rol no permitido redirige a la vista propia con un aviso; el backend siempre revalida la autorización. */
function roleGuard(required: Role): CanActivateFn {
  return () => {
    const store = inject(Store);
    const router = inject(Router);
    const auth = store.selectSignal(selectAuthState)();
    if (!isSessionActive(auth) || !auth.user) {
      return router.createUrlTree(['/login']);
    }
    if (auth.user.role === required) {
      return true;
    }
    inject(NotificationService).error(LABELS.errors.forbidden);
    return router.parseUrl(homeRouteFor(auth.user.role));
  };
}

export const adminGuard: CanActivateFn = roleGuard('Admin');
export const borrowerGuard: CanActivateFn = roleGuard('Borrower');
