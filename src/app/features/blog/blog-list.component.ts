import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 class="text-4xl font-bold mb-8">{{ t('blog.allPosts') }}</h1>

      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400 text-lg">
          {{ t('blog.noPostsFound') }}
        </p>
        <p class="text-gray-500 dark:text-gray-500 mt-4">
          {{ currentLang() === 'zh-TW'
            ? '文章建立中，敬請期待...'
            : 'Posts coming soon...'
          }}
        </p>
      </div>
    </div>
  `
})
export class BlogListComponent {
  i18nService = inject(I18nService);
  currentLang = this.i18nService.currentLang;

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
