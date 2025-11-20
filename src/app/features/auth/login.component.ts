import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 px-4">
      <div class="max-w-md w-full space-y-8">
        <!-- Logo & Title -->
        <div class="text-center">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your workspace
          </p>
        </div>

        <!-- Login Card -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                [disabled]="loading()"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                [disabled]="loading()"
              />
            </div>

            <!-- Error Message -->
            @if (error()) {
              <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p class="text-sm text-red-600 dark:text-red-400">
                  {{ error() }}
                </p>
              </div>
            }

            <!-- Demo Credentials (in mock mode) -->
            @if (showDemoHint) {
              <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                  🔍 Demo Credentials:
                </p>
                <p class="text-xs text-blue-600 dark:text-blue-400 font-mono">
                  Email: demo@example.com<br>
                  Password: (any password)
                </p>
              </div>
            }

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </span>
              } @else {
                <span>Sign in</span>
              }
            </button>

            <!-- Register Link -->
            <div class="text-center">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?
                <a
                  routerLink="/register"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition"
                >
                  Sign up
                </a>
              </p>
            </div>

            <!-- Back to Home -->
            <div class="text-center">
              <a
                routerLink="/"
                class="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                ← Back to home
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form fields
  email = signal('');
  password = signal('');

  // State
  loading = this.authService.isLoading;
  error = signal<string | null>(null);

  // Show demo hint in mock mode
  showDemoHint = inject(Router).config.length === 0; // Will be set properly

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password()) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.error.set(null);

    try {
      await this.authService.login(this.email(), this.password());
      // Navigation handled by AuthService
    } catch (err: any) {
      this.error.set(err.message || 'Login failed. Please try again.');
    }
  }
}
