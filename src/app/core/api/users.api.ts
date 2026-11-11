import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CreateUserRequest, UpdateUserRequest, User } from '../models';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/api/users`);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/api/users`, request);
  }

  update(id: string, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/api/users/${encodeURIComponent(id)}`, request);
  }
}
