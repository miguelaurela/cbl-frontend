import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { LoanLimits } from '../models';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({ providedIn: 'root' })
export class ParametersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getLoanLimits(): Observable<LoanLimits> {
    return this.http.get<LoanLimits>(`${this.baseUrl}/api/parameters/loan-limits`);
  }

  updateLoanLimits(limits: LoanLimits): Observable<LoanLimits> {
    return this.http.put<LoanLimits>(`${this.baseUrl}/api/parameters/loan-limits`, limits);
  }
}
