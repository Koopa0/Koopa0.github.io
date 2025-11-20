import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiRequestOptions {
  params?: HttpParams | { [param: string]: string | string[] };
  headers?: { [header: string]: string | string[] };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private useMock = environment.useMockApi;

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);

    if (environment.enableDebugLogs) {
      console.log(`[API GET] ${url}`, { useMock: this.useMock, options });
    }

    return this.http.get<T>(url, options).pipe(
      tap(response => this.logResponse('GET', url, response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);

    if (environment.enableDebugLogs) {
      console.log(`[API POST] ${url}`, { useMock: this.useMock, body, options });
    }

    return this.http.post<T>(url, body, options).pipe(
      tap(response => this.logResponse('POST', url, response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);

    if (environment.enableDebugLogs) {
      console.log(`[API PUT] ${url}`, { useMock: this.useMock, body, options });
    }

    return this.http.put<T>(url, body, options).pipe(
      tap(response => this.logResponse('PUT', url, response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);

    if (environment.enableDebugLogs) {
      console.log(`[API PATCH] ${url}`, { useMock: this.useMock, body, options });
    }

    return this.http.patch<T>(url, body, options).pipe(
      tap(response => this.logResponse('PATCH', url, response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);

    if (environment.enableDebugLogs) {
      console.log(`[API DELETE] ${url}`, { useMock: this.useMock, options });
    }

    return this.http.delete<T>(url, options).pipe(
      tap(response => this.logResponse('DELETE', url, response)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    endpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // In mock mode, add /mock prefix
    if (this.useMock) {
      return `/mock/${endpoint}`;
    }

    return `${this.baseUrl}/${endpoint}`;
  }

  /**
   * Log response (debug mode only)
   */
  private logResponse(method: string, url: string, response: any): void {
    if (environment.enableDebugLogs) {
      console.log(`[API ${method} Response]`, url, response);
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('[API Error]', error);

    // You can add more sophisticated error handling here
    // e.g., show toast notifications, redirect to error page, etc.

    return throwError(() => ({
      status: error.status,
      message: error.error?.message || error.message || 'An error occurred',
      details: error.error
    }));
  }

  /**
   * Check if using mock API
   */
  isUsingMockApi(): boolean {
    return this.useMock;
  }
}
