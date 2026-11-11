import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore, Store } from '@ngrx/store';
import { Subject, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthEffects } from '../../../store/auth/auth.effects';
import { AuthActions } from '../../../store/auth/auth.actions';
import { authReducer } from '../../../store/auth/auth.reducer';
import { AuthApi } from '../../api/auth.api';
import type { LoginResponse } from '../../models';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let api: jasmine.SpyObj<AuthApi>;
  let fixture: ComponentFixture<LoginPage>;
  let store: Store;
  const el = () => fixture.nativeElement as HTMLElement;

  function create(): void {
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  }

  function fill(email: string, password: string): void {
    fixture.componentInstance.form.setValue({ email, password });
  }

  function submit(): void {
    (el().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const httpError = (status: number, headers: Record<string, string> = {}) =>
    new HttpErrorResponse({ status, error: { title: 'T', status, detail: 'x' }, headers: new HttpHeaders(headers) });

  beforeEach(() => {
    api = jasmine.createSpyObj<AuthApi>('AuthApi', ['login', 'logout']);
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideStore({ auth: authReducer }),
        provideEffects(AuthEffects),
        { provide: AuthApi, useValue: api },
      ],
    });
    store = TestBed.inject(Store);
  });

  it('con campos vacíos muestra error junto a cada campo y no envía', () => {
    create();
    submit();
    expect(api.login).not.toHaveBeenCalled();
    const errors = Array.from(el().querySelectorAll('mat-error')).map((e) => e.textContent?.trim());
    expect(errors).toEqual(['Este campo es obligatorio.', 'Este campo es obligatorio.']);
  });

  it('un correo con formato inválido muestra su error y no envía', () => {
    create();
    fill('no-es-correo', 'x');
    submit();
    expect(api.login).not.toHaveBeenCalled();
    expect(el().querySelector('mat-error')?.textContent).toContain('formato válido');
  });

  it('envía una sola vez aunque se pulse varias veces mientras se envía', () => {
    const pending = new Subject<LoginResponse>();
    api.login.and.returnValue(pending);
    create();
    fill('usuario@test.com', '123');
    submit();
    submit();
    submit();
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(el().querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBeTrue();
  });

  it('un 401 muestra un único mensaje genérico en el formulario', () => {
    api.login.and.returnValue(throwError(() => httpError(401)));
    create();
    fill('usuario@test.com', 'mala');
    submit();
    const banner = el().querySelector('[role="alert"]');
    expect(banner?.textContent).toContain('Correo o contraseña incorrectos.');
    expect(el().querySelectorAll('[role="alert"]').length).toBe(1);
  });

  it('un 423 muestra el bloqueo con el tiempo de espera', () => {
    api.login.and.returnValue(throwError(() => httpError(423, { 'Retry-After': '900' })));
    create();
    fill('usuario@test.com', 'x');
    submit();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain('15 min');
  });

  it('un 429 muestra el límite de solicitudes con el tiempo de espera', () => {
    api.login.and.returnValue(throwError(() => httpError(429, { 'Retry-After': '45' })));
    create();
    fill('usuario@test.com', 'x');
    submit();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain('45 s');
  });

  it('un 422 del servidor aparece junto al campo', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { title: 'Validación', status: 422, errors: { email: ['El correo no es válido'] } },
    });
    api.login.and.returnValue(throwError(() => error));
    create();
    fill('usuario@test.com', 'x');
    submit();
    expect(el().querySelector('mat-error')?.textContent).toContain('El correo no es válido');
  });

  it('muestra el aviso de sesión expirada', () => {
    store.dispatch(AuthActions.sessionExpired({ reason: 'expired' }));
    create();
    expect(el().querySelector('[role="status"]')?.textContent).toContain('Tu sesión expiró');
  });

  it('la pista de credenciales solo aparece en modo demostración', () => {
    create();
    expect(el().querySelector('[data-testid="demo-hint"]')).toBeNull();
    fixture.destroy();
    environment.useMockApi = true;
    try {
      create();
      expect(el().querySelector('[data-testid="demo-hint"]')?.textContent).toContain('usuario@test.com');
    } finally {
      environment.useMockApi = false;
    }
  });

  it('el botón del ojo alterna mostrar y ocultar la contraseña', () => {
    create();
    const input = el().querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
    (el().querySelector('button[matSuffix]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });
});
