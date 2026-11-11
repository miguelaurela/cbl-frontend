import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, type UrlTree } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs';
import type { Action } from '@ngrx/store';
import { AuthApi } from '../../core/api/auth.api';
import { AuthActions } from './auth.actions';
import { AuthEffects } from './auth.effects';
import { adminLoginResponse, loginResponse } from '../../testing/fixtures';

describe('AuthEffects (login)', () => {
  let actions$: ReplaySubject<Action>;
  let api: jasmine.SpyObj<AuthApi>;
  let router: jasmine.SpyObj<Router>;
  let effects: AuthEffects;

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);
    api = jasmine.createSpyObj<AuthApi>('AuthApi', ['login', 'logout']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl', 'parseUrl'], { url: '/login' });
    router.navigateByUrl.and.resolveTo(true);
    router.parseUrl.and.returnValue({ queryParams: {} } as UrlTree);
    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthApi, useValue: api },
        { provide: Router, useValue: router },
      ],
    });
    effects = TestBed.inject(AuthEffects);
    localStorage.clear();
    sessionStorage.clear();
  });

  const request = { email: 'a@b.com', password: 'x' };
  const httpError = (status: number, headers: Record<string, string> = {}) =>
    new HttpErrorResponse({ status, error: { title: 'T', status, detail: 'Detalle' }, headers: new HttpHeaders(headers) });

  it('un login correcto emite loginSuccess', async () => {
    const response = loginResponse();
    api.login.and.returnValue(of(response));
    actions$.next(AuthActions.login({ request }));
    expect(await firstValueFrom(effects.login$)).toEqual(AuthActions.loginSuccess({ response }));
  });

  it('un 401 produce loginFailure con el error de credenciales', async () => {
    api.login.and.returnValue(throwError(() => httpError(401)));
    actions$.next(AuthActions.login({ request }));
    const action = (await firstValueFrom(effects.login$)) as ReturnType<typeof AuthActions.loginFailure>;
    expect(action.type).toBe(AuthActions.loginFailure.type);
    expect(action.error.kind).toBe('unauthorized');
  });

  it('un 423 guarda el tiempo de espera', async () => {
    api.login.and.returnValue(throwError(() => httpError(423, { 'Retry-After': '900' })));
    actions$.next(AuthActions.login({ request }));
    const locked = (await firstValueFrom(effects.login$)) as ReturnType<typeof AuthActions.loginFailure>;
    expect(locked.error.kind).toBe('locked');
    expect(locked.error.retryAfterSeconds).toBe(900);
  });

  it('un 429 guarda el tiempo de espera', async () => {
    api.login.and.returnValue(throwError(() => httpError(429, { 'Retry-After': '30' })));
    actions$.next(AuthActions.login({ request }));
    const limited = (await firstValueFrom(effects.login$)) as ReturnType<typeof AuthActions.loginFailure>;
    expect(limited.error.kind).toBe('rateLimited');
    expect(limited.error.retryAfterSeconds).toBe(30);
  });

  it('un error de red produce un error inesperado', async () => {
    api.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') })));
    actions$.next(AuthActions.login({ request }));
    const action = (await firstValueFrom(effects.login$)) as ReturnType<typeof AuthActions.loginFailure>;
    expect(action.error.kind).toBe('unexpected');
  });

  it('tras loginSuccess navega a la vista del rol', async () => {
    effects.loginSuccess$.subscribe();
    actions$.next(AuthActions.loginSuccess({ response: adminLoginResponse() }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/loans', { replaceUrl: true });
    actions$.next(AuthActions.loginSuccess({ response: loginResponse() }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/loans', { replaceUrl: true });
  });

  it('tras loginSuccess vuelve a la pantalla pedida si el rol lo permite', async () => {
    router.parseUrl.and.returnValue({ queryParams: { returnUrl: '/admin/users' } } as unknown as UrlTree);
    effects.loginSuccess$.subscribe();
    actions$.next(AuthActions.loginSuccess({ response: adminLoginResponse() }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/users', { replaceUrl: true });
    actions$.next(AuthActions.loginSuccess({ response: loginResponse() }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/loans', { replaceUrl: true });
  });

  it('ignora un returnUrl que no es una ruta interna', async () => {
    router.parseUrl.and.returnValue({ queryParams: { returnUrl: '//evil.com' } } as unknown as UrlTree);
    effects.loginSuccess$.subscribe();
    actions$.next(AuthActions.loginSuccess({ response: adminLoginResponse() }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/loans', { replaceUrl: true });
  });

  it('el token no se escribe en el almacenamiento del navegador', async () => {
    api.login.and.returnValue(of(loginResponse()));
    effects.loginSuccess$.subscribe();
    actions$.next(AuthActions.loginSuccess({ response: loginResponse() }));
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
