import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'owner' | 'freight' | 'supervisor';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const TOKEN_KEY = 'railway_token';
const USER_KEY = 'railway_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(null);
  private _user = signal<User | null>(null);

  token = this._token.asReadonly();
  user = this._user.asReadonly();
  isAuthenticated = computed(() => !!this._token());
  role = computed(() => this._user()?.role);

  constructor(private http: HttpClient, private router: Router) {}

  restoreSession() {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      try {
        this._token.set(t);
        this._user.set(JSON.parse(u));
      } catch {}
    }
  }

  async login(username: string, password: string, role: UserRole) {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>('/api/auth/login', { username, password, role }),
    );
    this._token.set(res.accessToken);
    this._user.set(res.user);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    return res.user;
  }

  async getDemoUsers() {
    return firstValueFrom(this.http.get<User[]>('/api/auth/demo-users'));
  }

  logout() {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  getHomeRoute(role?: UserRole): string {
    const r = role || this._user()?.role;
    switch (r) {
      case 'owner': return '/owner/dashboard';
      case 'freight': return '/freight/dashboard';
      case 'supervisor': return '/supervisor/dashboard';
      default: return '/login';
    }
  }
}
