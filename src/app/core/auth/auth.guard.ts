import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Allows navigation only when the user has an active session. Redirects to
 * /login otherwise, preserving the attempted URL via `redirect` query param.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' ? { redirect: state.url } : undefined,
  });
};

/**
 * Guards admin shell routes. Family-role users get redirected to /f.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.isFamily()) {
    return router.createUrlTree(['/f']);
  }
  return true;
};

/**
 * Guards family shell routes. Non-family users get redirected to /a.
 */
export const familyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.isFamily()) {
    return router.createUrlTree(['/a']);
  }
  return true;
};
