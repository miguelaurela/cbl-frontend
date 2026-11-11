import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { LoginRequest, LoginResponse } from '../models';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, request);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/auth/logout`, null);
  }
}
