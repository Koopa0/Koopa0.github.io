import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { SearchDialogComponent } from '../search-dialog.component';
import { I18nService } from '../../../core/services/i18n.service';

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
  mobileMenuOpen = signal(false);
  searchOpen = signal(false);

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

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
