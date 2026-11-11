import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { environment } from '../environments/environment';
import { LABELS } from './core/i18n/labels';
import { DemoBannerComponent } from './shared/components/demo-banner/demo-banner.component';
import { AuthActions } from './store/auth/auth.actions';
import { selectUser } from './store/auth/auth.selectors';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    DemoBannerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly store = inject(Store);

  readonly labels = LABELS;
  /** Solo en la configuración `mock`: muestra el aviso de demostración. */
  readonly demo = environment.useMockApi;
  readonly user = this.store.selectSignal(selectUser);
  readonly roleLabel = computed(() => {
    const user = this.user();
    return user ? LABELS.roles[user.role] : '';
  });

  /** Navegación según el rol: Prestamista ve "Mis préstamos"; Administrador, "Solicitudes" (y más después). */
  readonly links = computed<NavLink[]>(() => {
    const user = this.user();
    if (!user) {
      return [];
    }
    return user.role === 'Admin'
      ? [{ path: '/admin/loans', label: LABELS.nav.requests }]
      : [{ path: '/loans', label: LABELS.nav.myLoans }];
  });

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
