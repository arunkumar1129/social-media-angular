import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';
import { tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  user = signal<User | undefined>(undefined);

  getUserProfile() {
    return this.http.get<ApiResponse<User>>('http://localhost:3000/api/auth/profile').pipe(
      tap((res) => this.user.set(res.data))
    );
  }
}
