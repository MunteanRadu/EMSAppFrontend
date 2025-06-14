// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface CurrentUser {
  username: string;
  role: string;
  departmentId: string;
}

export interface AuthResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.tokenKey, res.accessToken);

          // decode payload
          const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
          const user: CurrentUser = {
            username: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'] || payload['unique_name'],
            role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'],
            departmentId: payload['departmentId'] || ''
          };
          localStorage.setItem('current_user', JSON.stringify(user));
        })
      );
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { username, email, password })
      .pipe(
        tap(res => localStorage.setItem(this.tokenKey, res.accessToken))
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): boolean {
    return !!this.tokenKey;
  }

  get currentUser(): CurrentUser | null {
    const json = localStorage.getItem('current_user');
    return json ? JSON.parse(json) : null;
  }

  get currentRole(): string | null {
    return this.currentUser?.role ?? null;
  }
}
