import { FormControl, FormGroup, Validators } from '@angular/forms';
import { applyServerErrors } from './apply-server-errors';
import { errorMessage } from './error-message';

describe('applyServerErrors', () => {
  const build = () =>
    new FormGroup({
      amount: new FormControl<number | null>(5000, { validators: [Validators.required] }),
      termMonths: new FormControl<number | null>(12),
    });

  it('el error del servidor "amount" aparece en el control', () => {
    const form = build();
    const unmatched = applyServerErrors(form, { amount: ['Debe estar entre 1.000 y 100.000'] });
    expect(unmatched).toEqual([]);
    expect(form.controls.amount.errors).toEqual({ server: 'Debe estar entre 1.000 y 100.000' });
    expect(form.controls.amount.touched).toBeTrue();
    expect(errorMessage(form.controls.amount)).toBe('Debe estar entre 1.000 y 100.000');
  });

  it('el error desaparece al editar el campo', () => {
    const form = build();
    applyServerErrors(form, { amount: ['Inválido'] });
    form.controls.amount.setValue(6000);
    expect(form.controls.amount.errors).toBeNull();
  });

  it('devuelve los mensajes de campos que no existen en el formulario', () => {
    const form = build();
    expect(applyServerErrors(form, { desconocido: ['Algo falló'] })).toEqual(['Algo falló']);
  });
});

describe('errorMessage', () => {
  it('traduce las claves de error a español', () => {
    expect(errorMessage(new FormControl('', Validators.required))).toBe('Este campo es obligatorio.');
    expect(errorMessage(new FormControl('x', Validators.email))).toBe('Escribe un correo con formato válido.');
    expect(errorMessage(new FormControl('abc', Validators.maxLength(2)))).toBe('Máximo 2 caracteres.');
    expect(errorMessage(new FormControl('a', Validators.minLength(3)))).toBe('Mínimo 3 caracteres.');
  });

  it('devuelve vacío sin error y respeta los textos propios', () => {
    expect(errorMessage(new FormControl('ok'))).toBe('');
    expect(errorMessage(null)).toBe('');
    expect(errorMessage(new FormControl('', Validators.required), { required: 'Falta' })).toBe('Falta');
  });
});
