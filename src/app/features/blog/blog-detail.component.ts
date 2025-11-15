import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownService, Post } from '../../core/services/markdown.service';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Blog Detail Component
 *
 * 顯示單篇文章的詳細內容，包含：
 * - 文章標題與 metadata
 * - Markdown 內容渲染
 * - 標籤列表
 * - 閱讀時間估算
 *
 * 風格設計參考 Zed.dev：
 * - 簡潔的排版
 * - 清晰的內容層級
 * - 適當的留白空間
 */
@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownModule],
  template: `
    <div class="min-h-screen">
      @if (loading()) {
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <!-- Modern skeleton loader with shimmer effect -->
          <div class="animate-pulse space-y-8">
            <!-- Back button skeleton -->
            <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded w-24 animate-shimmer bg-[length:200%_100%]"></div>

            <!-- Title skeleton -->
            <div class="space-y-4">
              <div class="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded w-3/4 animate-shimmer bg-[length:200%_100%]"></div>
              <div class="flex gap-4">
                <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded w-32 animate-shimmer bg-[length:200%_100%]"></div>
                <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded w-24 animate-shimmer bg-[length:200%_100%]"></div>
              </div>
              <div class="flex gap-2">
                <div class="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-full w-16 animate-shimmer bg-[length:200%_100%]"></div>
                <div class="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-full w-20 animate-shimmer bg-[length:200%_100%]"></div>
              </div>
            </div>

            <!-- Content skeleton -->
            <div class="space-y-4 pt-8">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="space-y-3">
                  <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded animate-shimmer bg-[length:200%_100%]" [style.animation-delay]="i * 0.1 + 's'"></div>
                  <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded animate-shimmer bg-[length:200%_100%]" [style.width]="90 - i * 2 + '%'" [style.animation-delay]="i * 0.1 + 's'"></div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else if (post()) {
        <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <!-- Back button -->
          <div class="mb-8">
            <a
              routerLink="/blog"
              class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              {{ t('blog.allPosts') }}
            </a>
          </div>

          <!-- Article header -->
          <header class="mb-12">
            <h1 class="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              {{ post()!.title }}
            </h1>

            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <time [attr.datetime]="post()!.date">
                {{ formatDate(post()!.date) }}
              </time>
              <span class="text-gray-300 dark:text-gray-700">•</span>
              <span>{{ post()!.readingTime }} {{ currentLang() === 'zh-TW' ? '分鐘閱讀' : 'min read' }}</span>
            </div>

            @if (post()!.tags && post()!.tags.length > 0) {
              <div class="flex flex-wrap gap-2">
                @for (tag of post()!.tags; track tag) {
                  <a
                    [routerLink]="['/tags', tag.toLowerCase()]"
                    class="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {{ tag }}
                  </a>
                }
              </div>
            }
          </header>

          <!-- Article content -->
          <div class="prose prose-lg dark:prose-invert max-w-none
                      prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-4xl prose-h1:mb-4
                      prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
                      prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
                      prose-p:leading-relaxed prose-p:mb-4
                      prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
                      prose-code:text-blue-600 dark:prose-code:text-blue-400
                      prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                      prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                      prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-gray-900 prose-pre:text-gray-100
                      prose-pre:rounded-lg prose-pre:border prose-pre:border-gray-800
                      prose-img:rounded-lg prose-img:shadow-lg
                      prose-blockquote:border-l-4 prose-blockquote:border-blue-500
                      prose-blockquote:pl-4 prose-blockquote:italic
                      prose-ul:my-4 prose-ol:my-4
                      prose-li:my-1">
            <markdown [data]="post()!.content"></markdown>
          </div>
        </article>
      } @else {
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 class="text-2xl font-bold mb-4">{{ t('blog.noPostsFound') }}</h2>
          <a
            routerLink="/blog"
            class="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {{ t('blog.allPosts') }}
          </a>
        </div>
      }
    </div>
  `
})
export class BlogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private markdownService = inject(MarkdownService);
  i18nService = inject(I18nService);

  currentLang = this.i18nService.currentLang;
  post = signal<Post | null>(null);
  loading = signal(true);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/blog']);
      return;
    }

    this.markdownService.getPost(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/blog']);
      }
    });
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return this.currentLang() === 'zh-TW'
      ? d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
