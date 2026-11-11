import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type ActivatedRouteSnapshot, type RouterStateSnapshot, type UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NotificationService } from '../notifications/notification.service';
import { AuthActions } from '../../store/auth/auth.actions';
import { initialAuthState, type AuthState } from '../../store/auth/auth.state';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { adminGuard, borrowerGuard } from './role.guard';

const future = () => new Date(Date.now() + 60_000).toISOString();
const past = () => new Date(Date.now() - 60_000).toISOString();
const user = (role: 'Admin' | 'Borrower') => ({ id: '1', email: 'a@b.com', fullName: 'A', role });

describe('guards', () => {
  let router: Router;
  let store: MockStore;
  let notifications: jasmine.SpyObj<NotificationService>;

  function setup(auth: Partial<AuthState>): void {
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['error', 'success', 'info']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: { auth: { ...initialAuthState, ...auth } } }),
        { provide: NotificationService, useValue: notifications },
      ],
    });
    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
  }

  const run = (guard: typeof authGuard, url = '/admin/loans') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    ) as boolean | UrlTree;

  const serialize = (result: boolean | UrlTree) => (result === true || result === false ? result : router.serializeUrl(result));

  describe('authGuard', () => {
    it('sin sesión redirige a /login?returnUrl=…', () => {
      setup({});
      expect(serialize(run(authGuard, '/admin/loans'))).toBe('/login?returnUrl=%2Fadmin%2Floans');
    });

    it('con sesión vencida cierra la sesión con aviso y redirige', () => {
      setup({ token: 't', expiresAt: past(), user: user('Borrower') });
      const dispatch = spyOn(store, 'dispatch');
      expect(serialize(run(authGuard, '/loans'))).toBe('/login?returnUrl=%2Floans');
      expect(dispatch).toHaveBeenCalledWith(AuthActions.sessionExpired({ reason: 'expired' }));
    });

    it('con sesión válida deja pasar', () => {
      setup({ token: 't', expiresAt: future(), user: user('Borrower') });
      expect(run(authGuard)).toBeTrue();
    });
  });

  describe('roleGuard', () => {
    it('adminGuard y borrowerGuard dejan pasar al rol correcto', () => {
      setup({ token: 't', expiresAt: future(), user: user('Admin') });
      expect(run(adminGuard)).toBeTrue();
      expect(serialize(run(borrowerGuard))).toBe('/admin/loans');
    });

    it('con el rol equivocado redirige a la vista propia con aviso', () => {
      setup({ token: 't', expiresAt: future(), user: user('Borrower') });
      expect(serialize(run(adminGuard))).toBe('/loans');
      expect(notifications.error).toHaveBeenCalled();
    });

    it('sin sesión redirige al acceso', () => {
      setup({});
      expect(serialize(run(adminGuard))).toBe('/login');
    });
  });

  describe('guestGuard', () => {
    it('sin sesión deja ver el acceso', () => {
      setup({});
      expect(run(guestGuard)).toBeTrue();
    });

    it('con sesión redirige a la vista propia', () => {
      setup({ token: 't', expiresAt: future(), user: user('Admin') });
      expect(serialize(run(guestGuard))).toBe('/admin/loans');
    });
  });

  it('volver atrás a una ruta privada sin sesión redirige al acceso', () => {
    setup({});
    expect(serialize(run(authGuard, '/loans'))).toContain('/login');
  });
});
