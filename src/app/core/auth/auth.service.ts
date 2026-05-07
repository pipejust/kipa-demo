import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { ApiService } from '../api/api.service';
import { _resetAuthExpiredFlag } from '../interceptors/auth.interceptor';
import { TOKEN_STORAGE_KEY } from '../tokens/api.tokens';
import {
  AuthMeResponse,
  AuthTenant,
  AuthUser,
  LoginRequest,
  LoginResponse,
  PasswordForgotRequest,
  PasswordResetRequest,
  UserRole,
} from './auth.types';

interface AuthState {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  role: UserRole | null;
}

const EMPTY_STATE: AuthState = { user: null, tenant: null, role: null };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly state = signal<AuthState>(EMPTY_STATE);
  readonly isLoading = signal<boolean>(false);
  readonly hasBootstrapped = signal<boolean>(false);

  readonly currentUser = computed(() => this.state().user);
  readonly currentTenant = computed(() => this.state().tenant);
  readonly currentRole = computed<UserRole | null>(() => this.state().role);
  readonly isAuthenticated = computed(() => !!this.state().user && !!this.token());
  readonly isFamily = computed(() => this.state().role === 'family');

  token(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  login(payload: LoginRequest): Observable<AuthMeResponse> {
    this.isLoading.set(true);
    return this.api.post<LoginResponse>('/auth/login', payload).pipe(
      tap((res) => this.persistToken(res.access_token)),
      // After login, hydrate the user profile so role-aware redirects work.
      // Switch via a manual chain to avoid pulling in extra operators.
      map(() => null as unknown as AuthMeResponse),
      // Replace mapped value with the actual /auth/me payload.
      // We use a nested observable via tap-then-loadCurrentUser.
      tap({
        finalize: () => {
          // No-op; isLoading is reset after loadCurrentUser completes.
        },
      }),
      // Chain the profile load.
      // Using a custom inner subscription would complicate things; instead
      // expose a helper method that callers can compose.
      catchError((err: unknown) => {
        this.isLoading.set(false);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Issues login and then immediately loads the profile so the caller gets a
   * single observable that completes when the session is fully ready.
   */
  loginAndLoad(payload: LoginRequest): Observable<AuthMeResponse> {
    this.isLoading.set(true);
    // A successful login should reactivate the interceptor so subsequent
    // requests are no longer short-circuited by the "auth expired" guard.
    _resetAuthExpiredFlag();
    return new Observable<AuthMeResponse>((subscriber) => {
      const sub = this.api.post<LoginResponse>('/auth/login', payload).subscribe({
        next: (res) => {
          this.persistToken(res.access_token);
          const meSub = this.api.get<AuthMeResponse>('/auth/me').subscribe({
            next: (me) => {
              this.applyMe(me);
              this.isLoading.set(false);
              subscriber.next(me);
              subscriber.complete();
            },
            error: (err) => {
              this.isLoading.set(false);
              this.clearSession();
              subscriber.error(err);
            },
          });
          subscriber.add(meSub);
        },
        error: (err) => {
          this.isLoading.set(false);
          subscriber.error(err);
        },
      });
      subscriber.add(sub);
    });
  }

  loadCurrentUser(): Observable<AuthMeResponse | null> {
    if (!this.token()) {
      this.hasBootstrapped.set(true);
      return of(null);
    }
    // Boot-time fetch counts as "fresh session" — clear any stale guard.
    _resetAuthExpiredFlag();
    this.isLoading.set(true);
    return this.api.get<AuthMeResponse>('/auth/me').pipe(
      tap((me) => this.applyMe(me)),
      tap(() => {
        this.isLoading.set(false);
        this.hasBootstrapped.set(true);
      }),
      catchError((err: unknown) => {
        this.isLoading.set(false);
        this.hasBootstrapped.set(true);
        // Token rejected; flush local session.
        this.clearSession();
        return of(null).pipe(map(() => null));
      }),
    );
  }

  /** Request a password-reset email. Backend returns 202 for any input
   *  (anti-enumeration); the UI just shows a generic confirmation. */
  forgotPassword(payload: PasswordForgotRequest): Observable<void> {
    return this.api.post<void>('/auth/forgot-password', payload);
  }

  /** Submit a new password using the token sent by email. */
  resetPassword(payload: PasswordResetRequest): Observable<void> {
    return this.api.post<void>('/auth/reset-password', payload);
  }

  logout(): void {
    // Fire-and-forget; clear local state regardless of server outcome.
    if (this.token()) {
      this.api.post('/auth/logout').subscribe({
        error: () => undefined,
      });
    }
    this.clearSession();
  }

  private applyMe(me: AuthMeResponse): void {
    this.state.set({ user: me.user, tenant: me.tenant, role: me.role });
  }

  private persistToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }

  /**
   * Wipe in-memory user/tenant/role and the persisted token. Used both by
   * `logout()` and by the auth interceptor when a 401 cascade signals the
   * server-side session is gone.
   */
  clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    this.state.set(EMPTY_STATE);
  }
}
