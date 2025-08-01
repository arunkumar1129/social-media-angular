import { inject, Injectable, signal } from '@angular/core';
import { TokenRequest, TokenResponse } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = `${environment.apiUrl}/api`;
  private http = inject(HttpClient);
  private router = inject(Router);
  token = signal<string | undefined>(undefined);

  constructor() {
    // Initialize token from localStorage if available
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      this.token.set(storedToken);
    }
  }

  login(req: TokenRequest) {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/auth/login`, req).pipe(
      tap((res) => {
        const token = res.data?.token;
        if (!token) {
          return;
        }
        this.token.set(token);
        localStorage.setItem('authToken', token.toString());
      })
    );
  }

  logout() {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/auth/logout`).pipe(
      tap((res) => {
        this.clearSession();
      })
    );
  }

  clearSession() {
    this.token.set(undefined);
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}
