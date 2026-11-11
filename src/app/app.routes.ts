import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, Store } from '@ngrx/store';
import { homeRouteFor } from './core/auth/home-route';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard, borrowerGuard } from './core/guards/role.guard';
import { isSessionActive, selectAuthState } from './store/auth/auth.selectors';
import { LoansEffects } from './store/loans/loans.effects';
import { loansReducer } from './store/loans/loans.reducer';
import { LOANS_FEATURE_KEY } from './store/loans/loans.state';
import { UsersEffects } from './store/users/users.effects';
import { usersReducer } from './store/users/users.reducer';
import { USERS_FEATURE_KEY } from './store/users/users.state';

/** Cualquier ruta desconocida lleva a la vista propia (con sesión) o al acceso (sin sesión). */
const fallbackRedirect = () => {
  const auth = inject(Store).selectSignal(selectAuthState)();
  return isSessionActive(auth) && auth.user ? homeRouteFor(auth.user.role) : '/login';
};

/** Rutas perezosas; los marcadores se sustituyen historia a historia. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./core/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    // El estado de préstamos (y los límites) se registra una sola vez, al entrar a una vista con sesión.
    path: '',
    providers: [provideState(LOANS_FEATURE_KEY, loansReducer), provideEffects(LoansEffects)],
    children: [
      {
        path: 'loans',
        canActivate: [authGuard, borrowerGuard],
        loadComponent: () => import('./features/loans/loans.page').then((m) => m.LoansPage),
      },
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        children: [
          {
            path: 'loans',
            loadComponent: () =>
              import('./features/admin/admin-loans/admin-loans.page').then((m) => m.AdminLoansPage),
          },
          {
            // El estado de usuarios se registra una sola vez, al entrar a su pantalla.
            path: 'users',
            providers: [provideState(USERS_FEATURE_KEY, usersReducer), provideEffects(UsersEffects)],
            loadComponent: () => import('./features/admin/users/users.page').then((m) => m.UsersPage),
          },
          {
            path: 'limits',
            loadComponent: () => import('./features/admin/limits/limits.page').then((m) => m.LimitsPage),
          },
          { path: '', pathMatch: 'full', redirectTo: 'loans' },
        ],
      },
    ],
  },
  {
    path: 'forbidden',
    canActivate: [authGuard],
    loadComponent: () => import('./core/auth/forbidden/forbidden.page').then((m) => m.ForbiddenPage),
  },
  { path: '**', redirectTo: fallbackRedirect },
];
