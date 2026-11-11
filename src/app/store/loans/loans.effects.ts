import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
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
