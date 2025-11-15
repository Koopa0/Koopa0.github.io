import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ThemeToggleComponent,
    LanguageToggleComponent
  ],
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
              routerLink="/about"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.about') }}
            </a>
          </div>

          <!-- Theme and Language Toggles -->
          <div class="flex items-center space-x-2">
            <app-language-toggle />
            <app-theme-toggle />
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
        @if (mobileMenuOpen) {
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
              routerLink="/about"
              (click)="closeMobileMenu()"
              routerLinkActive="bg-gray-100 dark:bg-gray-800"
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {{ t('nav.about') }}
            </a>
          </div>
        }
      </nav>
    </header>
  `
})
export class HeaderComponent {
  i18nService = inject(I18nService);
  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
