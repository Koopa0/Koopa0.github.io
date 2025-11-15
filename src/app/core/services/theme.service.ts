import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signal for reactive theme state
  theme = signal<Theme>('dark');

  constructor() {
    // Only load theme in browser environment
    if (this.isBrowser) {
      this.loadTheme();

      // Apply theme whenever it changes
      effect(() => {
        this.applyTheme(this.theme());
      });
    }
  }

  /**
   * Toggle between dark and light themes
   */
  toggleTheme(): void {
    this.theme.update(current => current === 'dark' ? 'light' : 'dark');
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  /**
   * Load theme from localStorage or system preference
   */
  private loadTheme(): void {
    if (!this.isBrowser) return;

    const savedTheme = localStorage.getItem('theme') as Theme;

    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Apply theme to document body and save to localStorage
   */
  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    const body = document.body;

    // Remove both classes first
    body.classList.remove('dark', 'light');

    // Add the current theme class
    body.classList.add(theme);

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }
}
