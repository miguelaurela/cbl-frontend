import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LoansActions } from '../../../store/loans/loans.actions';
import { initialLoansState, type LoansState } from '../../../store/loans/loans.state';
import { loanFixture } from '../../../testing/fixtures';
import { MyLoansListComponent } from './my-loans-list.component';

describe('MyLoansListComponent', () => {
  function render(loans: Partial<LoansState>) {
    TestBed.configureTestingModule({
      providers: [provideMockStore({ initialState: { loans: { ...initialLoansState, ...loans } } })],
    });
    const fixture = TestBed.createComponent(MyLoansListComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, store: TestBed.inject(MockStore) };
  }

  it('muestra el indicador de carga', () => {
    const { element } = render({ loadStatus: { mine: 'loading', all: 'idle' } });
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando');
  });

  it('muestra el estado vacío con la invitación', () => {
    const { element } = render({ loadStatus: { mine: 'loaded', all: 'idle' } });
    expect(element.textContent).toContain('Aún no tienes solicitudes');
  });

  it('muestra el error con "Reintentar" y recarga', () => {
    const { element, store } = render({
      loadStatus: { mine: 'failed', all: 'idle' },
      loadError: {
        mine: { kind: 'unexpected', status: 500, title: 't', message: 'm', fieldErrors: {} },
        all: null,
      },
    });
    const dispatch = spyOn(store, 'dispatch');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    expect(dispatch).toHaveBeenCalledWith(LoansActions.loadMine());
  });

  it('muestra monto en USD, plazo, estado con icono y texto, y fechas dd/MM/yyyy HH:mm', () => {
    const { element } = render({
      loadStatus: { mine: 'loaded', all: 'idle' },
      mine: [
        loanFixture({
          id: 'a',
          amount: 12000.5,
          termMonths: 24,
          status: 'Approved',
          createdAt: '2026-11-11T17:30:00',
          decidedAt: '2026-11-12T09:05:00',
        }),
      ],
    });
    const row = element.querySelector('tbody tr') as HTMLElement;
    expect(row.textContent).toContain('$12,000.50');
    expect(row.textContent).toContain('24 meses');
    expect(row.textContent).toContain('Aprobado');
    expect(row.querySelector('mat-icon')?.textContent?.trim()).toBe('check_circle');
    expect(row.textContent).toContain('11/11/2026 17:30');
    expect(row.textContent).toContain('12/11/2026 09:05');
  });

  it('un préstamo sin decidir muestra un guion y se ofrece también como tarjeta', () => {
    const { element } = render({
      loadStatus: { mine: 'loaded', all: 'idle' },
      mine: [loanFixture({ status: 'Pending' })],
    });
    expect(element.querySelector('tbody tr')?.textContent).toContain('—');
    expect(element.querySelectorAll('.cards .card').length).toBe(1);
  });
});
