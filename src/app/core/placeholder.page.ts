import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Marcador de página: cada historia sustituye la ruta que lo usa por su página real. */
@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Pantalla pendiente de implementar.</p>`,
})
export class PlaceholderPage {
  readonly title = input('');
}
