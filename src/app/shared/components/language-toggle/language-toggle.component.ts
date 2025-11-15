import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="toggleLanguage()"
      class="px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
      [attr.aria-label]="'Switch to ' + (currentLang() === 'zh-TW' ? 'English' : '繁體中文')"
    >
      {{ currentLang() === 'zh-TW' ? 'EN' : '中' }}
    </button>
  `
})
export class LanguageToggleComponent {
  i18nService = inject(I18nService);
  currentLang = this.i18nService.currentLang;

  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }
}
