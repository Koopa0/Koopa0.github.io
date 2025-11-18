import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/services/i18n.service';
import { MarkdownService } from '../../core/services/markdown.service';

/**
 * Tags Component
 *
 * 顯示所有標籤及其文章數量
 *
 * 功能：
 * - 自動從文章中提取所有標籤
 * - 計算每個標籤的文章數量
 * - 提供標籤篩選連結
 *
 * 性能優化：使用 OnPush Change Detection 配合 Signal
 */
@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 class="text-4xl font-bold mb-8">{{ t('tags.allTags') }}</h1>

      @if (loading()) {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="animate-pulse p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          }
        </div>
      } @else {
        @let lang = currentLang();
        @let tags = tagList();
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (tagInfo of tags; track tagInfo.tag) {
            <a
              [routerLink]="['/tags', tagInfo.tag.toLowerCase()]"
              class="group p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg text-center"
            >
              <h3 class="font-medium text-lg group-hover:text-blue-500 transition-colors capitalize">
                {{ t('categories.' + tagInfo.tag.toLowerCase()) }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {{ tagInfo.count }} {{ lang === 'zh-TW' ? '篇文章' : 'posts' }}
              </p>
            </a>
          }
        </div>
      }
    </div>
  `
})
export class TagsComponent {
  i18nService = inject(I18nService);
  private markdownService = inject(MarkdownService);
  private destroyRef = inject(DestroyRef);

  currentLang = this.i18nService.currentLang;
  tagList = signal<{ tag: string; count: number }[]>([]);
  loading = signal(true);

  constructor() {
    // 使用 constructor 代替 ngOnInit - Angular 20 best practice
    this.markdownService.getAllPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          const tagCounts = new Map<string, number>();

          // Count posts for each tag
          posts.forEach(post => {
            post.tags.forEach(tag => {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
          });

          // Convert to array and sort by tag name
          const tagArray = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => a.tag.localeCompare(b.tag));

          this.tagList.set(tagArray);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
