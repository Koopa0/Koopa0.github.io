import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // State
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private loadingSignal = signal(false);

  // Public readonly signals
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.currentUserSignal());
  isLoading = this.loadingSignal.asReadonly();

  constructor() {
    // Load token and user from localStorage on init
    this.initAuth();
  }

  /**
   * Initialize auth state from localStorage
   */
  private initAuth(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.tokenSignal.set(token);
      this.currentUserSignal.set(user);

      // Validate token by fetching current user
      this.loadCurrentUser().catch(() => {
        // Token invalid, clear auth
        this.clearAuth();
      });
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    this.loadingSignal.set(true);

    try {
      const request: LoginRequest = { email, password };
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('auth/login', request)
      );

      this.setAuth(response.token, response.user);

      // Navigate to workspace
      await this.router.navigate(['/workspace']);

      console.log('[Auth] Login successful', response.user);
    } catch (error) {
      console.error('[Auth] Login failed', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<void> {
    this.loadingSignal.set(true);

    try {
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('auth/register', data)
      );

      this.setAuth(response.token, response.user);

      // Navigate to workspace
      await this.router.navigate(['/workspace']);

      console.log('[Auth] Registration successful', response.user);
    } catch (error) {
      console.error('[Auth] Registration failed', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional, for server-side cleanup)
      await firstValueFrom(
        this.api.post('auth/logout', {})
      ).catch(() => {
        // Ignore logout API errors, still clear local auth
      });
    } finally {
      this.clearAuth();
      await this.router.navigate(['/']);
      console.log('[Auth] Logout successful');
    }
  }

  /**
   * Load current user from API
   */
  private async loadCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.api.get<User>('users/me')
      );

      this.currentUserSignal.set(user);
      this.storeUser(user);

      console.log('[Auth] Current user loaded', user);
    } catch (error) {
      console.error('[Auth] Failed to load current user', error);
      throw error;
    }
  }

  /**
   * Set authentication state
   */
  private setAuth(token: string, user: User): void {
    // Update signals
    this.tokenSignal.set(token);
    this.currentUserSignal.set(user);

    // Store in localStorage
    this.storeToken(token);
    this.storeUser(user);

    console.log('[Auth] Auth state set', { user: user.username, token: token.substring(0, 10) + '...' });
  }

  /**
   * Clear authentication state
   */
  private clearAuth(): void {
    // Clear signals
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);

    // Clear localStorage
    this.clearStorage();

    console.log('[Auth] Auth state cleared');
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Check if user has valid token
   */
  hasValidToken(): boolean {
    return !!this.tokenSignal();
  }

  // ========== LocalStorage Operations (SSR-safe) ==========

  private storeToken(token: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(environment.storage.tokenKey, token);
  }

  private storeUser(user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(environment.storage.userKey, JSON.stringify(user));
  }

  private getStoredToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(environment.storage.tokenKey);
  }

  private getStoredUser(): User | null {
    if (!this.isBrowser) return null;
    const userJson = localStorage.getItem(environment.storage.userKey);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(environment.storage.tokenKey);
    localStorage.removeItem(environment.storage.userKey);
    localStorage.removeItem(environment.storage.refreshTokenKey);
  }
}
