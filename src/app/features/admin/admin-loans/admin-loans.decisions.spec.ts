import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { LoansActions } from '../../../store/loans/loans.actions';
import { initialLoansState, type LoansState } from '../../../store/loans/loans.state';
import { loanFixture } from '../../../testing/fixtures';
import { AdminLoansPage } from './admin-loans.page';

describe('AdminLoansPage: decisiones', () => {
  const pending = loanFixture({ id: 'p1', status: 'Pending', version: 4, borrowerName: 'Ana Pérez', amount: 5000, termMonths: 12 });
  const approved = loanFixture({ id: 'a1', status: 'Approved', decidedAt: '2026-11-10T10:00:00Z', decidedByName: 'Admin' });
  let dialog: jasmine.SpyObj<MatDialog>;

  function render(state: Partial<LoansState> = {}) {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideMockStore({
          initialState: {
            loans: { ...initialLoansState, filter: 'All', all: [pending, approved], loadStatus: { mine: 'idle', all: 'loaded' }, ...state },
          },
        }),
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
    const fixture = TestBed.createComponent(AdminLoansPage);
    const dispatch = spyOn(TestBed.inject(MockStore), 'dispatch');
    fixture.detectChanges();
    dispatch.calls.reset();
    return { fixture, element: fixture.nativeElement as HTMLElement, dispatch };
  }

  const buttons = (element: HTMLElement, action: string) =>
    Array.from(element.querySelectorAll<HTMLButtonElement>(`tbody button[data-action="${action}"]`));

  it('Aprobar y Rechazar solo aparecen en filas Pendientes', () => {
    const { element } = render();
    expect(buttons(element, 'approve').length).toBe(1);
    expect(buttons(element, 'reject').length).toBe(1);
    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(Array.from(rows).filter((r) => r.querySelector('button')).length).toBe(1);
  });

  it('las filas decididas no ofrecen acciones', () => {
    const { element } = render({ all: [approved] });
    expect(element.querySelector('tbody button')).toBeNull();
  });

  it('el diálogo de confirmación muestra prestamista, monto y plazo', () => {
    const { element } = render();
    dialog.open.and.returnValue({ afterClosed: () => of(false) } as never);
    buttons(element, 'approve')[0]?.click();
    const config = dialog.open.calls.mostRecent().args[1] as { data: { title: string; lines: string[] } };
    expect(config.data.title).toContain('Aprobar');
    expect(config.data.lines.join(' ')).toContain('Ana Pérez');
    expect(config.data.lines.join(' ')).toContain('$5,000.00');
    expect(config.data.lines.join(' ')).toContain('12 meses');
  });

  it('al cancelar no se envía nada', () => {
    const { element, dispatch } = render();
    dialog.open.and.returnValue({ afterClosed: () => of(false) } as never);
    buttons(element, 'reject')[0]?.click();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('al confirmar se envía la decisión con la versión del préstamo mostrado', () => {
    const { element, dispatch } = render();
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as never);
    buttons(element, 'approve')[0]?.click();
    expect(dispatch).toHaveBeenCalledOnceWith(LoansActions.decide({ id: 'p1', decision: 'approve', version: 4 }));
    buttons(element, 'reject')[0]?.click();
    expect(dispatch).toHaveBeenCalledWith(LoansActions.decide({ id: 'p1', decision: 'reject', version: 4 }));
  });

  it('varias pulsaciones seguidas con el diálogo abierto envían una sola decisión', () => {
    const { element, dispatch } = render();
    const closed = new Subject<boolean>();
    dialog.open.and.returnValue({ afterClosed: () => closed } as never);
    const button = buttons(element, 'approve')[0];
    button?.click();
    button?.click();
    button?.click();
    expect(dialog.open).toHaveBeenCalledTimes(1);
    closed.next(true);
    closed.complete();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('mientras la decisión está en curso los botones quedan deshabilitados', () => {
    const { element } = render({ decidingIds: ['p1'] });
    expect(buttons(element, 'approve')[0]?.disabled).toBeTrue();
    expect(buttons(element, 'reject')[0]?.disabled).toBeTrue();
    expect(element.textContent).toContain('Procesando');
  });
});
