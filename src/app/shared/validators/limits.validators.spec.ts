import { FormControl } from '@angular/forms';
import { LIMIT_CAP, maxLimitValidator, minLimitValidator } from './limits.validators';

describe('minLimitValidator', () => {
  const check = (value: unknown) => minLimitValidator(new FormControl(value));

  it('rechaza mínimo menor o igual que 0', () => {
    expect(check(0)).toEqual({ minPositive: jasmine.any(String) });
    expect(check(-1)).toEqual({ minPositive: jasmine.any(String) });
  });

  it('rechaza más de 2 decimales y acepta 2', () => {
    expect(check(10.123)).toEqual({ decimals: jasmine.any(String) });
    expect(check(10.12)).toBeNull();
  });

  it('rechaza por encima del tope de 1.000.000.000.000 y acepta el tope', () => {
    expect(check(LIMIT_CAP + 1)).toEqual({ cap: jasmine.any(String) });
    expect(check(LIMIT_CAP)).toBeNull();
  });

  it('vacío no es error de este validador (lo cubre required)', () => {
    expect(check('')).toBeNull();
    expect(check(null)).toBeNull();
  });
});

describe('maxLimitValidator', () => {
  let min: number | null;
  const check = (value: unknown) => maxLimitValidator(() => min)(new FormControl(value));

  beforeEach(() => (min = 1000));

  it('rechaza un máximo que no es mayor que el mínimo', () => {
    expect(check(1000)).toEqual({ maxAboveMin: jasmine.any(String) });
    expect(check(999)).toEqual({ maxAboveMin: jasmine.any(String) });
    expect(check(1000.01)).toBeNull();
  });

  it('rechaza más de 2 decimales y el tope', () => {
    expect(check(5000.123)).toEqual({ decimals: jasmine.any(String) });
    expect(check(LIMIT_CAP + 1)).toEqual({ cap: jasmine.any(String) });
    expect(check(LIMIT_CAP)).toBeNull();
  });

  it('sin mínimo aún no compara', () => {
    min = null;
    expect(check(5)).toBeNull();
  });
});
