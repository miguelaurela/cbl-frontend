import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectRole } from '../../../store/auth/auth.selectors';
import { LABELS } from '../../i18n/labels';
import { homeRouteFor } from '../home-route';

/** Pantalla de "acceso no permitido" con enlace a la vista propia (o al acceso si no hay sesión). */
@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="forbidden">
      <h1>{{ labels.forbidden.title }}</h1>
      <p>{{ labels.forbidden.message }}</p>
      <a mat-flat-button [routerLink]="home()">{{ labels.forbidden.back }}</a>
    </section>
  `,
  styles: `
    .forbidden {
      text-align: center;
      padding: var(--cbl-space-5, 32px) var(--cbl-space-3, 16px);
    }
  `,
})
export class ForbiddenPage {
  readonly labels = LABELS;
  private readonly role = inject(Store).selectSignal(selectRole);
  readonly home = computed(() => {
    const role = this.role();
    return role ? homeRouteFor(role) : '/login';
  });
}
