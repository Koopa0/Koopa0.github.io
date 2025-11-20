import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Error Interceptor
 * Handles HTTP errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('[Error Interceptor]', {
        status: error.status,
        message: error.message,
        url: req.url
      });

      // Handle specific error codes
      switch (error.status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          console.log('[Error Interceptor] 401 Unauthorized, logging out');
          authService.logout();
          break;

        case 403:
          // Forbidden
          console.log('[Error Interceptor] 403 Forbidden');
          break;

        case 404:
          // Not Found
          console.log('[Error Interceptor] 404 Not Found');
          break;

        case 500:
          // Server Error
          console.log('[Error Interceptor] 500 Server Error');
          break;

        default:
          console.log('[Error Interceptor] Unknown error', error.status);
      }

      // Re-throw the error so it can be caught by the caller
      return throwError(() => error);
    })
  );
};
