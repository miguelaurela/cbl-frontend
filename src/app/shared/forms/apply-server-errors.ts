import type { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { take } from 'rxjs';

/**
 * Marca un error `server` en cada control cuyo nombre aparece en `fieldErrors` (claves en camelCase) y lo limpia
 * cuando el usuario edita ese control. Devuelve los mensajes de los campos que no existen en el formulario,
 * para mostrarlos como mensaje general.
 */
export function applyServerErrors(form: FormGroup, fieldErrors: Record<string, string[]>): string[] {
  const unmatched: string[] = [];
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const control = form.get(field);
    const message = messages.join(' ');
    if (!control) {
      unmatched.push(message);
      continue;
    }
    control.setErrors({ ...(control.errors ?? {}), server: message });
    control.markAsTouched();
    clearOnEdit(control);
  }
  return unmatched;
}

function clearOnEdit(control: AbstractControl): void {
  control.valueChanges.pipe(take(1)).subscribe(() => {
    // Al editar, Angular vuelve a ejecutar los validadores propios y el error `server` desaparece; por si
    // el control no se revalidó, se retira explícitamente.
    const current: ValidationErrors = { ...(control.errors ?? {}) };
    if ('server' in current) {
      delete current['server'];
      control.setErrors(Object.keys(current).length > 0 ? current : null);
    }
  });
}
