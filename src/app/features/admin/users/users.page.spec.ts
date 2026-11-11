import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '../../../store/auth/auth.state';
import { UsersActions } from '../../../store/users/users.actions';
import { initialUsersState, type UsersState } from '../../../store/users/users.state';
import { userFixture } from '../../../testing/fixtures';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { UsersPage } from './users.page';

describe('UsersPage', () => {
  const me = userFixture({ id: 'me', fullName: 'Admin Yo', email: 'admin@test.com', role: 'Admin' });
  const other = userFixture({ id: 'u2', fullName: 'Beto', email: 'beto@test.com', role: 'Borrower' });
  const off = userFixture({ id: 'u3', fullName: 'Carla', email: 'carla@test.com', isActive: false });
  let dialog: jasmine.SpyObj<MatDialog>;

  function render(state: Partial<UsersState> = {}) {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideMockStore({
          initialState: {
            auth: { ...initialAuthState, token: 't', user: { id: 'me', email: me.email, fullName: me.fullName, role: 'Admin' } },
            users: { ...initialUsersState, items: [me, other, off], loadStatus: 'loaded', ...state },
          },
        }),
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
    const fixture = TestBed.createComponent(UsersPage);
    const dispatch = spyOn(TestBed.inject(MockStore), 'dispatch');
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, dispatch };
  }

  it('al abrirse carga los usuarios', () => {
    const { dispatch } = render();
    expect(dispatch).toHaveBeenCalledWith(UsersActions.loadUsers());
  });

  it('lista los usuarios ordenados por nombre y distingue a los desactivados (texto e icono)', () => {
    const { element } = render();
    const rows = Array.from(element.querySelectorAll('tbody tr'));
    expect(rows.map((r) => r.querySelector('.name')?.textContent?.trim())).toEqual(['Admin Yo', 'Beto', 'Carla']);
    const disabled = rows[2] as HTMLElement;
    expect(disabled.classList).toContain('inactive');
    expect(disabled.textContent).toContain('Desactivado');
    expect(disabled.querySelector('mat-icon')?.textContent?.trim()).toBe('block');
    expect(rows[1]?.classList).not.toContain('inactive');
    expect(rows[1]?.textContent).toContain('Activo');
  });

  it('marca la fila propia', () => {
    const { element } = render();
    expect(element.querySelectorAll('tbody tr')[0]?.textContent).toContain('Tú');
    expect(element.querySelectorAll('tbody tr')[1]?.textContent).not.toContain('Tú');
  });

  it('también se ofrece como tarjetas para pantallas estrechas', () => {
    const { element } = render();
    expect(element.querySelectorAll('.cards .card').length).toBe(3);
  });

  it('muestra los estados de carga, vacío y error', () => {
    const loading = render({ items: [], loadStatus: 'loading' });
    expect(loading.element.querySelector('app-state-view [role="status"]')?.textContent).toContain('Cargando');
    TestBed.resetTestingModule();
    const empty = render({ items: [], loadStatus: 'loaded' });
    expect(empty.element.textContent).toContain('Aún no hay usuarios');
    TestBed.resetTestingModule();
    const failed = render({
      items: [],
      loadStatus: 'failed',
      loadError: { kind: 'unexpected', status: 500, title: 't', message: 'm', fieldErrors: {} },
    });
    expect(failed.element.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
  });

  it('"Nuevo usuario" abre el diálogo de alta (sin usuario)', () => {
    const { element } = render();
    (element.querySelector('.header button') as HTMLButtonElement).click();
    expect(dialog.open).toHaveBeenCalledOnceWith(
      UserDialogComponent,
      jasmine.objectContaining({ data: { user: null, currentUserId: 'me' } }),
    );
  });

  it('"Editar" abre el diálogo con ese usuario y el id de quien tiene la sesión', () => {
    const { element } = render();
    (element.querySelectorAll('tbody button[data-action="edit"]')[1] as HTMLButtonElement).click();
    expect(dialog.open).toHaveBeenCalledWith(
      UserDialogComponent,
      jasmine.objectContaining({ data: { user: other, currentUserId: 'me' } }),
    );
  });
});
