import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';
import { tap, Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { WebSocketService } from './websocket.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api`;
  user = signal<User | undefined>(undefined);
  private socketService = inject(WebSocketService);

  getUserProfile() {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/auth/profile`).pipe(
      tap((res) => this.user.set(res.data))
    );
  }

  getContacts(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/user/contacts`);
  }

  uploadAvatar(formData: FormData): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/user/avatar/upload`, formData).pipe(
      tap((res) => {
        if (res.data) {
          this.user.set(res.data);
        }
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/user/profile`, userData).pipe(
      tap((res) => {
        if (res.data) {
          this.user.set(res.data);
        }
      })
    );
  }

  removeAvatar(): Observable<ApiResponse<User>> {
    return this.http.delete<ApiResponse<User>>(`${this.apiUrl}/user/avatar`).pipe(
      tap((res) => {
        if (res.data) {
          this.user.set(res.data);
        }
      })
    );
  }

  deleteAccount(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/user/account`);
  }

  logout() {
    this.socketService.clearData();
    this.socketService.disconnect();
  }
}
