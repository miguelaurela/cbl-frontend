import { FormControl } from '@angular/forms';
import { passwordValidator, roleValidator, userEmailValidator, userNameValidator } from './user.validators';

describe('validadores de usuario', () => {
  it('correo: formato válido y máximo 256', () => {
    const check = (value: string) => userEmailValidator(new FormControl(value));
    expect(check('ana@test.com')).toBeNull();
    expect(check('no-es-correo')).toEqual({ email: jasmine.any(String) });
    expect(check(`${'a'.repeat(250)}@test.com`)).toEqual({ emailMax: jasmine.any(String) });
    expect(check('')).toBeNull();
  });

  it('nombre: obligatorio (no solo espacios) y máximo 200', () => {
    const check = (value: string) => userNameValidator(new FormControl(value));
    expect(check('')).toEqual({ required: jasmine.any(String) });
    expect(check('   ')).toEqual({ required: jasmine.any(String) });
    expect(check('Ana Pérez')).toBeNull();
    expect(check('a'.repeat(200))).toBeNull();
    expect(check('a'.repeat(201))).toEqual({ nameMax: jasmine.any(String) });
  });

  it('contraseña: 7 es inválida, 8 es válida y el máximo es 200', () => {
    const check = (value: string) => passwordValidator(new FormControl(value));
    expect(check('1234567')).toEqual({ passwordMin: jasmine.any(String) });
    expect(check('12345678')).toBeNull();
    expect(check('a'.repeat(200))).toBeNull();
    expect(check('a'.repeat(201))).toEqual({ passwordMax: jasmine.any(String) });
  });

  it('contraseña vacía es válida para el validador (opcional al editar)', () => {
    expect(passwordValidator(new FormControl(''))).toBeNull();
    expect(passwordValidator(new FormControl(null))).toBeNull();
  });

  it('rol: Admin o Borrower', () => {
    expect(roleValidator(new FormControl('Admin'))).toBeNull();
    expect(roleValidator(new FormControl('Borrower'))).toBeNull();
    expect(roleValidator(new FormControl('Otro'))).toEqual({ role: jasmine.any(String) });
    expect(roleValidator(new FormControl(null))).toEqual({ role: jasmine.any(String) });
  });
});
