import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CreateLoanRequest, DecideLoanRequest, Loan, LoanStatus } from '../models';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({ providedIn: 'root' })
export class LoansApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listMine(): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.baseUrl}/api/loans/mine`);
  }

  /** La interfaz carga la lista completa; `status` existe en el contrato y se admite por completitud. */
  listAll(status?: LoanStatus): Observable<Loan[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Loan[]>(`${this.baseUrl}/api/loans`, params ? { params } : {});
  }

  create(request: CreateLoanRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.baseUrl}/api/loans`, request);
  }

  approve(id: string, version: number): Observable<Loan> {
    const body: DecideLoanRequest = { version };
    return this.http.post<Loan>(`${this.baseUrl}/api/loans/${encodeURIComponent(id)}/approve`, body);
  }

  reject(id: string, version: number): Observable<Loan> {
    const body: DecideLoanRequest = { version };
    return this.http.post<Loan>(`${this.baseUrl}/api/loans/${encodeURIComponent(id)}/reject`, body);
  }
}
