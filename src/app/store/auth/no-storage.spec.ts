import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { loginResponse } from '../../testing/fixtures';
import { AuthActions } from './auth.actions';
import { AuthEffects } from './auth.effects';
import { authReducer } from './auth.reducer';

/** Constitución III y VI, FR-005, SC-008: el token nunca se escribe en el almacenamiento del navegador. */
describe('la sesión no toca el almacenamiento del navegador', () => {
  let store: Store;
  let setItem: jasmine.Spy;

  const expectNothingStored = () => {
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setItem = spyOn(Storage.prototype, 'setItem').and.callThrough();
    const api = jasmine.createSpyObj<AuthApi>('AuthApi', ['login', 'logout']);
    api.logout.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideStore({ auth: authReducer }),
        provideEffects(AuthEffects),
        { provide: AuthApi, useValue: api },
      ],
    });
    store = TestBed.inject(Store);
  });

  it('tras loginSuccess', () => {
    store.dispatch(AuthActions.loginSuccess({ response: loginResponse() }));
    expectNothingStored();
  });

  it('tras logout', () => {
    store.dispatch(AuthActions.loginSuccess({ response: loginResponse() }));
    store.dispatch(AuthActions.logout());
    expectNothingStored();
  });

  it('tras sessionExpired', () => {
    store.dispatch(AuthActions.loginSuccess({ response: loginResponse() }));
    store.dispatch(AuthActions.sessionExpired({ reason: 'expired' }));
    expectNothingStored();
  });
});
