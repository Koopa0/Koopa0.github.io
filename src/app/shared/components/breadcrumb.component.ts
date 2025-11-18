import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  translateKey?: string; // Optional i18n key
}

/**
 * Breadcrumb Component
 *
 * 顯示階層式導航路徑，提升用戶體驗和 SEO
 *
 * 使用範例：
 * <app-breadcrumb [items]="[
 *   { label: '首頁', url: '/' },
 *   { label: 'Golang', url: '/tags/golang', translateKey: 'categories.golang' },
 *   { label: '文章標題' }
 * ]" />
 *
 * 性能優化：使用 OnPush Change Detection 配合 Signal-based input
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb" class="mb-6">
      <ol class="flex flex-wrap items-center gap-2 text-sm">
        @for (item of items(); track $index; let isLast = $last) {
          <li class="flex items-center gap-2">
            @if (!isLast && item.url) {
              <a
                [routerLink]="item.url"
                class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {{ item.translateKey ? t(item.translateKey) : item.label }}
              </a>
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            } @else {
              <span class="text-gray-900 dark:text-gray-100 font-medium">
                {{ item.translateKey ? t(item.translateKey) : item.label }}
              </span>
            }
          </li>
        }
      </ol>
    </nav>
  `
})
export class BreadcrumbComponent {
  items = input.required<BreadcrumbItem[]>();
  private i18nService = inject(I18nService);

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
