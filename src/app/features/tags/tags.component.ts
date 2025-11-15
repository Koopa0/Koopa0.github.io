import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 class="text-4xl font-bold mb-8">{{ t('tags.allTags') }}</h1>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (tag of tags; track tag) {
          <a
            [routerLink]="['/tags', tag.toLowerCase()]"
            class="group p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg text-center"
          >
            <h3 class="font-medium text-lg group-hover:text-blue-500 transition-colors">
              {{ t('tags.' + tag.toLowerCase()) }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">0 {{ currentLang() === 'zh-TW' ? '篇文章' : 'posts' }}</p>
          </a>
        }
      </div>
    </div>
  `
})
export class TagsComponent {
  i18nService = inject(I18nService);
  currentLang = this.i18nService.currentLang;

  tags = ['golang', 'rust', 'algorithm', 'system', 'sql', 'ai', 'google'];

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
