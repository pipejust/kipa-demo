import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { TOKEN_STORAGE_KEY } from '../tokens/api.tokens';

/**
 * Bearer attach + 401 handling.
 *
 * Why the module-level flag?
 *   When the access token expires, multiple in-flight calls (KPI summary,
 *   notifications poll, periodic refreshes…) each get their own 401 in
 *   parallel. Without coordination, every one of them would:
 *     - delete the token (idempotent, OK)
 *     - call `router.navigate(['/login'])` (queued, eventually 1 navigation)
 *     - print an Angular error in the console
 *
 *   Multiplied by HMR re-instantiating the dashboard during a long-lived dev
 *   session that produced 1000+ identical "401 Unauthorized" lines. The flag
 *   ensures we navigate exactly once and short-circuit any subsequent
 *   requests until the user logs in again. It's a per-tab singleton, so the
 *   reset on successful login (auth.service.ts) brings everything back.
 */
let _authExpired = false;

/** Public reset hook — called from AuthService.login on success. */
export function _resetAuthExpiredFlag(): void {
  _authExpired = false;
}

const SKIPPABLE_PATHS = ['/auth/login', '/auth/refresh', '/tenants/public'];

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const isSkippable = SKIPPABLE_PATHS.some((p) => req.url.includes(p));

  // After a 401 cascade, swallow every non-auth request silently until the
  // user signs in again. This stops the console spam and prevents components
  // from receiving spurious errors that re-trigger navigation.
  if (_authExpired && !isSkippable) {
    return EMPTY;
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isSkippable) {
        if (!_authExpired) {
          _authExpired = true;
          auth.clearSession();
          // Use replaceUrl so the protected page is removed from history,
          // keeping the back button from looping into the same 401.
          router.navigateByUrl('/login', { replaceUrl: true });
        }
        // Return EMPTY instead of an error so subscribers don't trip their
        // error handlers (which often re-trigger fetches).
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};
