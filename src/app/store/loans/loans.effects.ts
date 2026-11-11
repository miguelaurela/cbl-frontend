import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, exhaustMap, groupBy, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { LoansApi } from '../../core/api/loans.api';
import { ParametersApi } from '../../core/api/parameters.api';
import { toAppError } from '../../core/errors/to-app-error';
import { LABELS } from '../../core/i18n/labels';
import { NotificationService } from '../../core/notifications/notification.service';
import { LoansActions } from './loans.actions';

/** Solo los efectos llaman a la API (constitución II). */
@Injectable()
export class LoansEffects {
  private readonly actions$ = inject(Actions);
  private readonly loansApi = inject(LoansApi);
  private readonly parametersApi = inject(ParametersApi);
  private readonly notifications = inject(NotificationService);

  readonly loadLimits$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.loadLimits),
      switchMap(() =>
        this.parametersApi.getLoanLimits().pipe(
          map((limits) => LoansActions.loadLimitsSuccess({ limits })),
          catchError((error: unknown) => of(LoansActions.loadLimitsFailure({ error: toAppError(error) }))),
        ),
      ),
    ),
  );

  /** Guarda los límites (administrador): un solo envío a la vez; el cambio aplica solo a solicitudes nuevas. */
  readonly saveLimits$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.saveLimits),
      exhaustMap(({ limits }) =>
        this.parametersApi.updateLoanLimits(limits).pipe(
          map((saved) => LoansActions.saveLimitsSuccess({ limits: saved })),
          catchError((error: unknown) => of(LoansActions.saveLimitsFailure({ error: toAppError(error) }))),
        ),
      ),
    ),
  );

  readonly saveLimitsSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoansActions.saveLimitsSuccess),
        tap(() => this.notifications.success(LABELS.limits.saved)),
      ),
    { dispatch: false },
  );

  /** Un solo envío a la vez: las pulsaciones repetidas mientras se envía se ignoran. */
  readonly create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.create),
      exhaustMap(({ request }) =>
        this.loansApi.create(request).pipe(
          map((loan) => LoansActions.createSuccess({ loan })),
          catchError((error: unknown) => of(LoansActions.createFailure({ error: toAppError(error) }))),
        ),
      ),
    ),
  );

  /** Tras crear: aviso y recarga de "Mis préstamos" desde el servidor. */
  readonly createSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.createSuccess),
      tap(() => this.notifications.success(LABELS.loanForm.success)),
      map(() => LoansActions.loadMine()),
    ),
  );

  /** Una decisión a la vez por solicitud: las repetidas mientras hay una en curso se ignoran. */
  readonly decide$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.decide),
      groupBy(({ id }) => id),
      mergeMap((group$) =>
        group$.pipe(
          exhaustMap(({ id, decision, version }) => {
            const call = decision === 'approve' ? this.loansApi.approve(id, version) : this.loansApi.reject(id, version);
            return call.pipe(
              map((loan) => LoansActions.decideSuccess({ loan, decision })),
              catchError((error: unknown) => of(LoansActions.decideFailure({ id, error: toAppError(error) }))),
            );
          }),
        ),
      ),
    ),
  );

  /** Tras decidir: aviso y recarga de la lista desde el servidor con el filtro actual. */
  readonly decideSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.decideSuccess),
      tap(({ decision }) =>
        this.notifications.success(decision === 'approve' ? LABELS.adminLoans.approved : LABELS.adminLoans.rejected),
      ),
      map(() => LoansActions.loadAll()),
    ),
  );

  /** Conflicto (409): otra persona decidió antes; se explica y se refresca. Otros errores: aviso y todo queda como estaba. */
  readonly decideFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.decideFailure),
      tap(({ error }) =>
        this.notifications.error(error.kind === 'conflict' ? LABELS.adminLoans.conflict : LABELS.adminLoans.decideError),
      ),
      mergeMap(({ error }) => (error.kind === 'conflict' ? of(LoansActions.loadAll()) : EMPTY)),
    ),
  );

  readonly loadMine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.loadMine),
      switchMap(() =>
        this.loansApi.listMine().pipe(
          map((loans) => LoansActions.loadMineSuccess({ loans })),
          catchError((error: unknown) => of(LoansActions.loadMineFailure({ error: toAppError(error) }))),
        ),
      ),
    ),
  );

  /** Carga la lista completa (sin `status`); cambiar el filtro no genera una petición. */
  readonly loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansActions.loadAll),
      switchMap(() =>
        this.loansApi.listAll().pipe(
          map((loans) => LoansActions.loadAllSuccess({ loans })),
          catchError((error: unknown) => of(LoansActions.loadAllFailure({ error: toAppError(error) }))),
        ),
      ),
    ),
  );
}
