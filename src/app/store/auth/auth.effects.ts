import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, takeUntil, tap, timer } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { resolvePostLoginUrl } from '../../core/auth/home-route';
import { toAppError } from '../../core/errors/to-app-error';
import { AuthActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  /** Un solo intento a la vez: pulsaciones repetidas mientras se envía se ignoran. */
  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ request }) =>
        this.api.login(request).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error: unknown) => of(AuthActions.loginFailure({ error: toAppError(error) }))),
        ),
      ),
    ),
  );

  /** Tras el login lleva a la pantalla pedida (`returnUrl`) si el rol lo permite o, si no, a la vista del rol. */
  readonly loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ response }) => {
          const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] as string | undefined;
          void this.router.navigateByUrl(resolvePostLoginUrl(returnUrl, response.user.role), { replaceUrl: true });
        }),
      ),
    { dispatch: false },
  );

  /** Temporizador hasta `expiresAt`: cierra la sesión automáticamente; se cancela con el cierre de sesión. */
  readonly expiry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      switchMap(({ response }) =>
        timer(Math.max(0, Date.parse(response.expiresAt) - Date.now())).pipe(
          takeUntil(this.actions$.pipe(ofType(AuthActions.logout, AuthActions.logoutDone, AuthActions.sessionExpired))),
          map(() => AuthActions.sessionExpired({ reason: 'expired' })),
        ),
      ),
    ),
  );

  /** Cierre manual: avisa al servidor (el fallo se ignora) y siempre limpia la sesión local. */
  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.api.logout().pipe(
          catchError(() => of(null)),
          map(() => AuthActions.logoutDone()),
        ),
      ),
    ),
  );

  /** Tras cerrar o caducar la sesión se vuelve al acceso sin dejar la pantalla privada en el historial. */
  readonly backToLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutDone, AuthActions.sessionExpired),
        tap(() => {
          void this.router.navigateByUrl('/login', { replaceUrl: true });
        }),
      ),
    { dispatch: false },
  );
}
