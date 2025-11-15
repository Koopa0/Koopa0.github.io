import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <!-- 404 Number -->
        <div class="mb-8">
          <h1 class="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
        </div>

        <!-- Error Message -->
        <h2 class="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {{ currentLang() === 'zh-TW' ? '找不到頁面' : 'Page Not Found' }}
        </h2>

        <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
          {{ currentLang() === 'zh-TW'
            ? '抱歉，您訪問的頁面不存在或已被移除。'
            : 'Sorry, the page you are looking for does not exist or has been removed.'
          }}
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            routerLink="/"
            class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            {{ currentLang() === 'zh-TW' ? '回到首頁' : 'Back to Home' }}
          </a>

          <a
            routerLink="/blog"
            class="px-6 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
          >
            {{ currentLang() === 'zh-TW' ? '瀏覽文章' : 'Browse Posts' }}
          </a>
        </div>

        <!-- Helpful Links -->
        <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">
            {{ currentLang() === 'zh-TW' ? '您可能在尋找：' : 'You might be looking for:' }}
          </p>
          <div class="flex flex-wrap gap-3 justify-center">
            <a
              routerLink="/tags"
              class="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {{ currentLang() === 'zh-TW' ? '技術標籤' : 'Tech Tags' }}
            </a>
            <span class="text-gray-300 dark:text-gray-700">•</span>
            <a
              routerLink="/about"
              class="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {{ currentLang() === 'zh-TW' ? '關於我' : 'About Me' }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  i18nService = inject(I18nService);
  currentLang = this.i18nService.currentLang;
}
