import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export type Language = 'zh-TW' | 'en';

interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private http = inject(HttpClient);

  // Signal for reactive language state
  currentLang = signal<Language>('zh-TW');

  // Store loaded translations
  private translations: Record<Language, Translations> = {
    'zh-TW': {},
    'en': {}
  };

  constructor() {
    // Load saved language preference
    if (this.isBrowser) {
      this.loadLanguage();
    }

    // Load translations when language changes
    effect(() => {
      const lang = this.currentLang();
      this.loadTranslations(lang).subscribe();
    });
  }

  /**
   * Switch to specific language
   */
  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    if (this.isBrowser) {
      localStorage.setItem('language', lang);
    }
  }

  /**
   * Toggle between zh-TW and en
   */
  toggleLanguage(): void {
    const newLang = this.currentLang() === 'zh-TW' ? 'en' : 'zh-TW';
    this.setLanguage(newLang);
  }

  /**
   * Get translation for a key
   */
  translate(key: string): string {
    const lang = this.currentLang();
    const keys = key.split('.');
    let value: any = this.translations[lang];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  }

  /**
   * Get translation with parameters
   */
  translateWith(key: string, params: Record<string, string>): string {
    let translation = this.translate(key);

    Object.keys(params).forEach(param => {
      // Use global regex to replace all occurrences
      translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param] ?? '');
    });

    return translation;
  }

  /**
   * Load language preference from localStorage
   */
  private loadLanguage(): void {
    if (!this.isBrowser) return;

    const savedLang = localStorage.getItem('language') as Language;

    if (savedLang && (savedLang === 'zh-TW' || savedLang === 'en')) {
      this.currentLang.set(savedLang);
    } else {
      // Default to zh-TW
      this.currentLang.set('zh-TW');
    }
  }

  /**
   * Load translation file for specific language
   */
  private loadTranslations(lang: Language): Observable<Translations> {
    // Check if already loaded
    if (Object.keys(this.translations[lang]).length > 0) {
      return new Observable(observer => {
        observer.next(this.translations[lang]);
        observer.complete();
      });
    }

    return this.http.get<Translations>(`/assets/i18n/${lang}.json`).pipe(
      tap(translations => {
        this.translations[lang] = translations;
      }),
      catchError(error => {
        console.error(`Failed to load translations for ${lang}:`, error);
        // Return empty translations as fallback
        return of({} as Translations);
      })
    );
  }
}
