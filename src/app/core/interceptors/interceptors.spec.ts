import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AuthActions } from '../../store/auth/auth.actions';
import { initialAuthState } from '../../store/auth/auth.state';
import { API_BASE_URL } from '../api/api-base-url.token';
import { NotificationService } from '../notifications/notification.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

const BASE = 'http://api.test';

describe('interceptores', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let store: MockStore;
  let notifications: jasmine.SpyObj<NotificationService>;

  function setup(token: string | null): void {
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['error', 'success', 'info']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        provideMockStore({ initialState: { auth: { ...initialAuthState, token } } }),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
  }

  afterEach(() => controller.verify());

  describe('authInterceptor', () => {
    it('añade Bearer solo a las URLs de la API y solo con token', () => {
      setup('abc');
      http.get(`${BASE}/api/loans/mine`).subscribe();
      expect(controller.expectOne(`${BASE}/api/loans/mine`).request.headers.get('Authorization')).toBe('Bearer abc');
      http.get('https://otro.com/datos').subscribe();
      expect(controller.expectOne('https://otro.com/datos').request.headers.has('Authorization')).toBeFalse();
    });

    it('sin token no añade la cabecera', () => {
      setup(null);
      http.get(`${BASE}/api/loans/mine`).subscribe();
      expect(controller.expectOne(`${BASE}/api/loans/mine`).request.headers.has('Authorization')).toBeFalse();
    });
  });

  describe('errorInterceptor', () => {
    const fail = (url: string, status: number) => {
      http.get(url).subscribe({ error: () => undefined });
      controller.expectOne(url).flush({ title: 'x', status }, { status, statusText: 'err' });
    };

    it('un 401 de una petición autenticada despacha sessionExpired', () => {
      setup('abc');
      const dispatch = spyOn(store, 'dispatch');
      fail(`${BASE}/api/loans/mine`, 401);
      expect(dispatch).toHaveBeenCalledWith(AuthActions.sessionExpired({ reason: 'unauthorized' }));
    });

    it('el 401 de login y el de logout no cierran la sesión', () => {
      setup('abc');
      const dispatch = spyOn(store, 'dispatch');
      fail(`${BASE}/api/auth/login`, 401);
      fail(`${BASE}/api/auth/logout`, 401);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('un 403 avisa y no cierra la sesión', () => {
      setup('abc');
      const dispatch = spyOn(store, 'dispatch');
      fail(`${BASE}/api/users`, 403);
      expect(notifications.error).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('siempre relanza el error al llamador', () => {
      setup('abc');
      let received: number | undefined;
      http.get(`${BASE}/api/loans`).subscribe({ error: (e: { status: number }) => (received = e.status) });
      controller.expectOne(`${BASE}/api/loans`).flush({ title: 'x', status: 500 }, { status: 500, statusText: 'err' });
      expect(received).toBe(500);
    });
  });
});
