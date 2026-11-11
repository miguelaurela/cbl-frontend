import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LoansActions } from '../../../store/loans/loans.actions';
import { initialLoansState, type LoansState } from '../../../store/loans/loans.state';
import { loanFixture } from '../../../testing/fixtures';
import { AdminLoansPage } from './admin-loans.page';

describe('AdminLoansPage', () => {
  const loans = [
    loanFixture({ id: 'p1', status: 'Pending', createdAt: '2026-11-10T10:00:00Z' }),
    loanFixture({ id: 'p2', status: 'Pending', createdAt: '2026-11-11T10:00:00Z', borrowerName: 'Zoe' }),
    loanFixture({ id: 'a1', status: 'Approved', createdAt: '2026-11-09T10:00:00Z', decidedAt: '2026-11-10T10:00:00Z', decidedByName: 'Admin' }),
  ];

  function render(state: Partial<LoansState>) {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideMockStore({ initialState: { loans: { ...initialLoansState, loadStatus: { mine: 'idle', all: 'loaded' }, ...state } } }),
      ],
    });
    const fixture = TestBed.createComponent(AdminLoansPage);
    const store = TestBed.inject(MockStore);
    const dispatch = spyOn(store, 'dispatch');
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, dispatch };
  }

  it('al abrirse carga la lista completa', () => {
    const { dispatch } = render({ all: loans });
    expect(dispatch).toHaveBeenCalledWith(LoansActions.loadAll());
  });

  it('Pendiente es el filtro por defecto: muestra solo pendientes y el contador', () => {
    const { element } = render({ all: loans });
    expect(element.querySelectorAll('tbody tr').length).toBe(2);
    expect(element.querySelector('[data-testid="pending-count"]')?.textContent).toContain('2 pendientes');
    expect(element.querySelector('mat-button-toggle-group')).not.toBeNull();
    expect(element.querySelectorAll('mat-button-toggle').length).toBe(4);
  });

  it('con otro filtro el contador de pendientes no cambia', () => {
    const { element } = render({ all: loans, filter: 'Approved' });
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
    expect(element.querySelector('[data-testid="pending-count"]')?.textContent).toContain('2 pendientes');
  });

  it('el filtro "Todos" muestra todas, con prestamista y quién decidió', () => {
    const { element } = render({ all: loans, filter: 'All' });
    expect(element.querySelectorAll('tbody tr').length).toBe(3);
    expect(element.textContent).toContain('Zoe');
    expect(element.textContent).toContain('Admin');
  });

  it('cambiar el filtro despacha setFilter sin recargar', () => {
    const { element, dispatch } = render({ all: loans });
    dispatch.calls.reset();
    (element.querySelectorAll('mat-button-toggle button')[3] as HTMLButtonElement).click();
    expect(dispatch).toHaveBeenCalledWith(LoansActions.setFilter({ filter: 'Rejected' }));
    expect(dispatch).not.toHaveBeenCalledWith(LoansActions.loadAll());
  });

  it('"Actualizar" recarga conservando el filtro', () => {
    const { element, dispatch } = render({ all: loans, filter: 'Approved' });
    dispatch.calls.reset();
    const button = Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.includes('Actualizar'));
    button?.click();
    expect(dispatch).toHaveBeenCalledOnceWith(LoansActions.loadAll());
  });

  it('un filtro sin resultados muestra "No hay solicitudes con este filtro"', () => {
    const { element } = render({ all: loans, filter: 'Rejected' });
    expect(element.textContent).toContain('No hay solicitudes con este filtro');
  });

  it('muestra los estados de carga y de error', () => {
    const loading = render({ loadStatus: { mine: 'idle', all: 'loading' } });
    expect(loading.element.querySelector('app-state-view [role="status"]')?.textContent).toContain('Cargando');
    TestBed.resetTestingModule();
    const failed = render({
      loadStatus: { mine: 'idle', all: 'failed' },
      loadError: { mine: null, all: { kind: 'unexpected', status: 500, title: 't', message: 'm', fieldErrors: {} } },
    });
    expect(failed.element.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
  });

  it('también se ofrece como tarjetas para pantallas estrechas', () => {
    const { element } = render({ all: loans, filter: 'All' });
    expect(element.querySelectorAll('.cards .card').length).toBe(3);
  });
});
