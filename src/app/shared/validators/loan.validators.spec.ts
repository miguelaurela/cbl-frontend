import { FormControl } from '@angular/forms';
import type { LoanLimits } from '../../core/models';
import { amountValidator, termValidator } from './loan.validators';

describe('amountValidator', () => {
  let limits: LoanLimits | null;
  const validate = (value: unknown) => amountValidator(() => limits)(new FormControl(value));

  beforeEach(() => (limits = { minAmount: 1000, maxAmount: 100000 }));

  it('rechaza 0 y negativos', () => {
    expect(validate(0)).toEqual({ amountPositive: jasmine.any(String) });
    expect(validate(-5)).toEqual({ amountPositive: jasmine.any(String) });
  });

  it('rechaza más de 2 decimales y acepta 2', () => {
    expect(validate(1000.123)).toEqual({ amountDecimals: jasmine.any(String) });
    expect(validate(1000.12)).toBeNull();
    expect(validate(1234.5)).toBeNull();
  });

  it('rechaza por debajo del mínimo y por encima del máximo', () => {
    expect(validate(999.99)).toEqual({ amountMin: jasmine.stringMatching(/\$1,000\.00/) });
    expect(validate(100000.01)).toEqual({ amountMax: jasmine.stringMatching(/\$100,000\.00/) });
  });

  it('acepta los valores límite exactos', () => {
    expect(validate(1000)).toBeNull();
    expect(validate(100000)).toBeNull();
  });

  it('los límites se leen del estado y se revalidan cuando cambian', () => {
    const control = new FormControl(500, amountValidator(() => limits));
    expect(control.errors).toEqual({ amountMin: jasmine.any(String) });
    limits = { minAmount: 100, maxAmount: 1000 };
    control.updateValueAndValidity();
    expect(control.errors).toBeNull();
  });

  it('sin límites cargados solo valida el formato; vacío no es error de este validador', () => {
    limits = null;
    expect(validate(5)).toBeNull();
    expect(validate('')).toBeNull();
    expect(validate(null)).toBeNull();
  });
});

describe('termValidator', () => {
  const validate = (value: unknown) => termValidator(new FormControl(value));

  it('rechaza 0, 61 y no enteros', () => {
    expect(validate(0)).toEqual({ termMin: jasmine.any(String) });
    expect(validate(61)).toEqual({ termMax: jasmine.any(String) });
    expect(validate(1.5)).toEqual({ termInteger: jasmine.any(String) });
  });

  it('acepta los límites 1 y 60 y un valor intermedio', () => {
    expect(validate(1)).toBeNull();
    expect(validate(60)).toBeNull();
    expect(validate(12)).toBeNull();
  });

  it('vacío no es error de este validador (lo cubre required)', () => {
    expect(validate('')).toBeNull();
    expect(validate(null)).toBeNull();
  });
});
