import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AuthActions } from './store/auth/auth.actions';
import { initialAuthState, type AuthState } from './store/auth/auth.state';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let store: MockStore;

  function create(auth: Partial<AuthState> = {}) {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideMockStore({ initialState: { auth: { ...initialAuthState, ...auth } } })],
    });
    store = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const session = (role: 'Admin' | 'Borrower') => ({
    token: 't',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    user: { id: '1', email: 'persona@test.com', fullName: 'Persona', role },
  });

  it('muestra la barra superior con el nombre "CBL" y el espacio de contenido', () => {
    const element = create();
    expect(element.querySelector('mat-toolbar')?.textContent).toContain('CBL');
    expect(element.querySelector('main router-outlet')).not.toBeNull();
  });

  it('sin sesión no muestra usuario, rol, navegación ni "Cerrar sesión"', () => {
    const element = create();
    expect(element.querySelector('nav')).toBeNull();
    expect(element.textContent).not.toContain('Cerrar sesión');
  });

  it('el prestamista ve su correo, su rol y "Mis préstamos"', () => {
    const element = create(session('Borrower'));
    expect(element.textContent).toContain('persona@test.com');
    expect(element.textContent).toContain('Prestamista');
    expect(element.querySelector('nav')?.textContent).toContain('Mis préstamos');
    expect(element.querySelector('nav')?.textContent).not.toContain('Solicitudes');
  });

  it('el administrador ve su rol y "Solicitudes"', () => {
    const element = create(session('Admin'));
    expect(element.textContent).toContain('Administrador');
    expect(element.querySelector('nav')?.textContent).toContain('Solicitudes');
  });

  it('"Cerrar sesión" despacha logout', () => {
    const element = create(session('Admin'));
    const dispatch = spyOn(store, 'dispatch');
    const button = Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.includes('Cerrar sesión'));
    button?.click();
    expect(dispatch).toHaveBeenCalledWith(AuthActions.logout());
  });
});
