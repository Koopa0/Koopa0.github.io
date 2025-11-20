import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard
 * Protects routes that require authentication
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log('[Auth Guard] Access granted');
    return true;
  }

  console.log('[Auth Guard] Access denied, redirecting to login');

  // Redirect to login with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guest Guard
 * Prevents authenticated users from accessing auth pages (login, register)
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('[Guest Guard] Access granted');
    return true;
  }

  console.log('[Guest Guard] Already authenticated, redirecting to workspace');

  // Already logged in, redirect to workspace
  return router.createUrlTree(['/workspace']);
};
