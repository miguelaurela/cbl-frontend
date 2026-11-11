import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api-base-url.token';
import { AuthApi } from './auth.api';
import { LoansApi } from './loans.api';
import { ParametersApi } from './parameters.api';
import { UsersApi } from './users.api';

const BASE = 'http://api.test';

describe('servicios HTTP', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('AuthApi.login hace POST /api/auth/login con las credenciales', () => {
    TestBed.inject(AuthApi).login({ email: 'a@b.com', password: 'x' }).subscribe();
    const req = http.expectOne(`${BASE}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'x' });
    req.flush({});
  });

  it('AuthApi.logout hace POST /api/auth/logout', () => {
    TestBed.inject(AuthApi).logout().subscribe();
    const req = http.expectOne(`${BASE}/api/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('LoansApi.listMine y listAll usan las rutas del contrato', () => {
    const api = TestBed.inject(LoansApi);
    api.listMine().subscribe();
    expect(http.expectOne(`${BASE}/api/loans/mine`).request.method).toBe('GET');
    api.listAll().subscribe();
    expect(http.expectOne(`${BASE}/api/loans`).request.params.keys()).toEqual([]);
    api.listAll('Pending').subscribe();
    expect(http.expectOne(`${BASE}/api/loans?status=Pending`).request.method).toBe('GET');
  });

  it('LoansApi.create hace POST /api/loans con monto y plazo', () => {
    TestBed.inject(LoansApi).create({ amount: 5000, termMonths: 12 }).subscribe();
    const req = http.expectOne(`${BASE}/api/loans`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 5000, termMonths: 12 });
  });

  it('LoansApi.approve y reject envían { version }', () => {
    const api = TestBed.inject(LoansApi);
    api.approve('id-1', 3).subscribe();
    const approve = http.expectOne(`${BASE}/api/loans/id-1/approve`);
    expect(approve.request.method).toBe('POST');
    expect(approve.request.body).toEqual({ version: 3 });
    api.reject('id-2', 0).subscribe();
    const reject = http.expectOne(`${BASE}/api/loans/id-2/reject`);
    expect(reject.request.body).toEqual({ version: 0 });
  });

  it('UsersApi usa GET, POST y PUT', () => {
    const api = TestBed.inject(UsersApi);
    api.list().subscribe();
    expect(http.expectOne(`${BASE}/api/users`).request.method).toBe('GET');
    api.create({ email: 'n@x.com', fullName: 'N', password: '12345678', role: 'Borrower' }).subscribe();
    expect(http.expectOne(`${BASE}/api/users`).request.method).toBe('POST');
    api.update('u1', { fullName: 'N', role: 'Admin', isActive: false }).subscribe();
    const put = http.expectOne(`${BASE}/api/users/u1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ fullName: 'N', role: 'Admin', isActive: false });
  });

  it('ParametersApi lee y guarda los límites', () => {
    const api = TestBed.inject(ParametersApi);
    api.getLoanLimits().subscribe();
    expect(http.expectOne(`${BASE}/api/parameters/loan-limits`).request.method).toBe('GET');
    api.updateLoanLimits({ minAmount: 500, maxAmount: 90000 }).subscribe();
    const put = http.expectOne(`${BASE}/api/parameters/loan-limits`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ minAmount: 500, maxAmount: 90000 });
  });
});
