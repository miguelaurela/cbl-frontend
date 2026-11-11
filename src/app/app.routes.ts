import type { Routes } from '@angular/router';

const placeholder = () => import('./core/placeholder.page').then((m) => m.PlaceholderPage);

/** Rutas perezosas; los marcadores se sustituyen historia a historia (login, préstamos, administración). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: placeholder },
  { path: 'loans', loadComponent: placeholder },
  { path: 'admin/loans', loadComponent: placeholder },
  { path: 'admin/users', loadComponent: placeholder },
  { path: 'admin/limits', loadComponent: placeholder },
  { path: 'forbidden', loadComponent: placeholder },
  { path: '**', redirectTo: 'login' },
];
