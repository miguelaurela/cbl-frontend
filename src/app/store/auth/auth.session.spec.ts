import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, TestBed, tick, discardPeriodicTasks } from '@angular/core/testing';
import { Router, type UrlTree } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import type { Action } from '@ngrx/store';
import { of, Subject, throwError } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { loginResponse } from '../../testing/fixtures';
import { AuthActions } from './auth.actions';
import { AuthEffects } from './auth.effects';

describe('AuthEffects (sesión)', () => {
  let actions$: Subject<Action>;
  let api: jasmine.SpyObj<AuthApi>;
  let router: jasmine.SpyObj<Router>;
  let effects: AuthEffects;
  let emitted: Action[];

  beforeEach(() => {
    actions$ = new Subject<Action>();
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
    emitted = [];
  });

  it('el temporizador dispara sessionExpired a los 10 minutos', fakeAsync(() => {
    effects.expiry$.subscribe((a) => emitted.push(a));
    actions$.next(AuthActions.loginSuccess({ response: loginResponse({ expiresAt: new Date(Date.now() + 600_000).toISOString() }) }));
    tick(599_000);
    expect(emitted).toEqual([]);
    tick(1_000);
    expect(emitted).toEqual([AuthActions.sessionExpired({ reason: 'expired' })]);
    discardPeriodicTasks();
  }));

  it('el temporizador se cancela con logout', fakeAsync(() => {
    effects.expiry$.subscribe((a) => emitted.push(a));
    actions$.next(AuthActions.loginSuccess({ response: loginResponse({ expiresAt: new Date(Date.now() + 600_000).toISOString() }) }));
    tick(60_000);
    actions$.next(AuthActions.logout());
    tick(600_000);
    expect(emitted).toEqual([]);
  }));

  it('un nuevo login reinicia el temporizador', fakeAsync(() => {
    effects.expiry$.subscribe((a) => emitted.push(a));
    actions$.next(AuthActions.loginSuccess({ response: loginResponse({ expiresAt: new Date(Date.now() + 60_000).toISOString() }) }));
    tick(30_000);
    actions$.next(AuthActions.loginSuccess({ response: loginResponse({ expiresAt: new Date(Date.now() + 600_000).toISOString() }) }));
    tick(60_000);
    expect(emitted).toEqual([]);
    tick(540_000);
    expect(emitted.length).toBe(1);
  }));

  it('logout llama a POST /api/auth/logout y termina con logoutDone', fakeAsync(() => {
    api.logout.and.returnValue(of(undefined));
    effects.logout$.subscribe((a) => emitted.push(a));
    actions$.next(AuthActions.logout());
    tick();
    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(emitted).toEqual([AuthActions.logoutDone()]);
  }));

  it('logout limpia la sesión local aunque la llamada falle', fakeAsync(() => {
    api.logout.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    effects.logout$.subscribe((a) => emitted.push(a));
    actions$.next(AuthActions.logout());
    tick();
    expect(emitted).toEqual([AuthActions.logoutDone()]);
  }));

  it('logoutDone y sessionExpired navegan a /login con replaceUrl', fakeAsync(() => {
    effects.backToLogin$.subscribe();
    actions$.next(AuthActions.logoutDone());
    actions$.next(AuthActions.sessionExpired({ reason: 'expired' }));
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  }));
});
