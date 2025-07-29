import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';
import { tap, Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  user = signal<User | undefined>(undefined);
  private socketService = inject(WebSocketService);

  getUserProfile() {
    return this.http.get<ApiResponse<User>>('http://localhost:3000/api/auth/profile').pipe(
      tap((res) => this.user.set(res.data))
    );
  }

  getContacts(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>('http://localhost:3000/api/user/contacts');
  }

  uploadAvatar(formData: FormData): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>('http://localhost:3000/api/user/avatar/upload', formData).pipe(
      tap((res) => {
        if (res.data) {
          this.user.set(res.data);
        }
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>('http://localhost:3000/api/user/profile', userData).pipe(
      tap((res) => {
        if (res.data) {
          this.user.set(res.data);
        }
      })
    );
  }

  logout() {
    this.socketService.clearData();
    this.socketService.disconnect();
  }
}
