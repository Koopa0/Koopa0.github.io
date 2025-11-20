import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MockDataService } from '../services/mock-data.service';

/**
 * Mock API Interceptor
 * Intercepts HTTP requests and returns mock data when useMockApi is true
 */
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept if mock mode is enabled and URL starts with /mock
  if (!environment.useMockApi || !req.url.startsWith('/mock')) {
    return next(req);
  }

  const mockDataService = inject(MockDataService);

  // Extract endpoint from URL (remove /mock prefix)
  const endpoint = req.url.replace(/^\/mock\//, '');

  if (environment.enableDebugLogs) {
    console.log('[Mock Interceptor] Intercepting:', {
      method: req.method,
      endpoint,
      body: req.body,
      params: req.params
    });
  }

  // Route to appropriate mock handler
  try {
    const mockResponse = mockDataService.handleRequest(
      req.method,
      endpoint,
      req.body,
      req.params
    );

    // Simulate network delay (200-800ms)
    const simulatedDelay = Math.random() * 600 + 200;

    return of(
      new HttpResponse({
        status: 200,
        body: mockResponse
      })
    ).pipe(delay(simulatedDelay));

  } catch (error: any) {
    console.error('[Mock Interceptor] Error:', error);

    // Return error response
    return of(
      new HttpResponse({
        status: error.status || 500,
        body: {
          error: {
            code: error.code || 'MOCK_ERROR',
            message: error.message || 'Mock error occurred'
          }
        }
      })
    ).pipe(delay(200));
  }
};
