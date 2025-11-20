import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { SearchDialogComponent } from '../search-dialog.component';
import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ThemeToggleComponent,
    LanguageToggleComponent,
    SearchDialogComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-dark-bg-primary/80 backdrop-blur-md">
      <nav class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center space-x-2">
              <span class="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                Koopa
              </span>
            </a>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-1">
            <a
              routerLink="/"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              [routerLinkActiveOptions]="{exact: true}"
              class="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.home') }}
            </a>
            <a
              routerLink="/blog"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.blog') }}
            </a>
            <a
              routerLink="/tags"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.tags') }}
            </a>
            <a
              routerLink="/about"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.about') }}
            </a>
          </div>

          <!-- Search and Toggles -->
          <div class="flex items-center space-x-2">
            <!-- Search Button -->
            <button
              (click)="openSearch()"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              [attr.aria-label]="t('nav.search')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <!-- RSS Feed Link -->
            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              [attr.aria-label]="'RSS Feed'"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z"/>
              </svg>
            </a>

            <app-language-toggle />
            <app-theme-toggle />

            <!-- Auth Buttons / User Menu -->
            @if (isAuthenticated()) {
              <!-- User Menu (when logged in) -->
              <div class="relative">
                <button
                  (click)="toggleUserMenu()"
                  class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="User menu"
                >
                  <img
                    [src]="currentUser()?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'"
                    alt="User avatar"
                    class="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                  />
                </button>

                <!-- User Dropdown Menu -->
                @if (userMenuOpen()) {
                  <div class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50">
                    <!-- User Info -->
                    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ currentUser()?.displayName }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-500">
                        {{ currentUser()?.email }}
                      </p>
                    </div>

                    <!-- Menu Items -->
                    <div class="py-2">
                      <a
                        routerLink="/workspace"
                        (click)="closeUserMenu()"
                        class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Workspace
                      </a>

                      <a
                        routerLink="/workspace/settings"
                        (click)="closeUserMenu()"
                        class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </a>
                    </div>

                    <!-- Logout -->
                    <div class="border-t border-gray-200 dark:border-gray-800 pt-2">
                      <button
                        (click)="onLogout()"
                        class="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!-- Login Button (when not logged in) -->
              <a
                routerLink="/login"
                class="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium transition-all"
              >
                Login
              </a>
            }
          </div>

          <!-- Mobile Menu Button -->
          <button
            (click)="toggleMobileMenu()"
            class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        @if (mobileMenuOpen()) {
          <div class="md:hidden py-4 space-y-2">
            <a
              routerLink="/"
              (click)="closeMobileMenu()"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              [routerLinkActiveOptions]="{exact: true}"
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.home') }}
            </a>
            <a
              routerLink="/blog"
              (click)="closeMobileMenu()"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.blog') }}
            </a>
            <a
              routerLink="/tags"
              (click)="closeMobileMenu()"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.tags') }}
            </a>
            <a
              routerLink="/about"
              (click)="closeMobileMenu()"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.about') }}
            </a>

            <!-- Mobile Auth Section -->
            @if (isAuthenticated()) {
              <div class="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                <div class="px-4 py-2 text-xs text-gray-500 dark:text-gray-500">
                  Signed in as {{ currentUser()?.displayName }}
                </div>
                <a
                  routerLink="/workspace"
                  (click)="closeMobileMenu()"
                  class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Workspace
                </a>
                <a
                  routerLink="/workspace/settings"
                  (click)="closeMobileMenu()"
                  class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Settings
                </a>
                <button
                  (click)="onLogout()"
                  class="w-full text-left px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            } @else {
              <div class="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                <a
                  routerLink="/login"
                  (click)="closeMobileMenu()"
                  class="block px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Login
                </a>
              </div>
            }
          </div>
        }
      </nav>

      <!-- Search Dialog -->
      @if (searchOpen()) {
        <app-search-dialog (closeDialog)="closeSearch()" />
      }
    </header>
  `
})
export class HeaderComponent {
  i18nService = inject(I18nService);
  private authService = inject(AuthService);

  // State
  mobileMenuOpen = signal(false);
  searchOpen = signal(false);
  userMenuOpen = signal(false);

  // Auth state from service
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openSearch(): void {
    this.searchOpen.set(true);
    this.closeMobileMenu();
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  async onLogout(): Promise<void> {
    this.closeUserMenu();
    await this.authService.logout();
  }

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
