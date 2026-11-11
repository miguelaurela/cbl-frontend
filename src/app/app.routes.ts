import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { Store } from '@ngrx/store';
import { homeRouteFor } from './core/auth/home-route';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard, borrowerGuard } from './core/guards/role.guard';
import { isSessionActive, selectAuthState } from './store/auth/auth.selectors';

const placeholder = () => import('./core/placeholder.page').then((m) => m.PlaceholderPage);

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
  { path: 'loans', canActivate: [authGuard, borrowerGuard], loadComponent: placeholder },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'loans', loadComponent: placeholder },
      { path: 'users', loadComponent: placeholder },
      { path: 'limits', loadComponent: placeholder },
      { path: '', pathMatch: 'full', redirectTo: 'loans' },
    ],
  },
  {
    path: 'forbidden',
    canActivate: [authGuard],
    loadComponent: () => import('./core/auth/forbidden/forbidden.page').then((m) => m.ForbiddenPage),
  },
  { path: '**', redirectTo: fallbackRedirect },
];
