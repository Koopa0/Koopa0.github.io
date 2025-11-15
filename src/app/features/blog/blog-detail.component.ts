import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownService, Post } from '../../core/services/markdown.service';
import { I18nService } from '../../core/services/i18n.service';
import { ReadingProgressComponent } from '../../shared/components/reading-progress.component';
import { CodeBlockCopyButtonComponent } from '../../shared/components/code-block-copy-button.component';

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
  imports: [CommonModule, RouterLink, MarkdownModule, ReadingProgressComponent, CodeBlockCopyButtonComponent],
  template: `
    <!-- Reading Progress Bar -->
    <app-reading-progress />

    <div class="min-h-screen relative">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 -z-10"></div>
      @if (loading()) {
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <!-- Clean skeleton loader -->
          <div class="space-y-8">
            <!-- Back button skeleton -->
            <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 animate-shimmer"></div>

            <!-- Title skeleton -->
            <div class="space-y-4">
              <div class="h-12 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-shimmer"></div>
              <div class="flex gap-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-shimmer"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 animate-shimmer"></div>
              </div>
              <div class="flex gap-2">
                <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16 animate-shimmer"></div>
                <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20 animate-shimmer"></div>
              </div>
            </div>

            <!-- Content skeleton -->
            <div class="space-y-3 pt-8">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-shimmer" [style.width]="(95 - i * 3) + '%'"></div>
              }
            </div>
          </div>
        </div>
      } @else if (post()) {
        <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
          <!-- Back button -->
          <div class="mb-8">
            <a
              routerLink="/blog"
              class="group inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
            >
              <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              {{ t('blog.allPosts') }}
            </a>
          </div>

          <!-- Article header -->
          <header class="mb-12 animate-slideUp">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {{ post()!.title }}
            </h1>

            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <time [attr.datetime]="post()!.date" class="font-medium">
                {{ formatDate(post()!.date) }}
              </time>
              <span class="text-gray-300 dark:text-gray-700">•</span>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ post()!.readingTime }} {{ currentLang() === 'zh-TW' ? '分鐘閱讀' : 'min read' }}</span>
              </div>
            </div>

            @if (post()!.tags && post()!.tags.length > 0) {
              <div class="flex flex-wrap gap-2">
                @for (tag of post()!.tags; track tag) {
                  <a
                    [routerLink]="['/tags', tag.toLowerCase()]"
                    class="group px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {{ tag }}
                  </a>
                }
              </div>
            }

            <!-- Divider -->
            <div class="mt-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-24"></div>
          </header>

          <!-- Article content -->
          <div class="relative">
            <!-- Code copy button handler -->
            <app-code-block-copy-button />

            <div class="prose prose-lg dark:prose-invert max-w-none
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
                        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-800 prose-h2:pb-3
                        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                        prose-p:leading-relaxed prose-p:mb-6 prose-p:text-gray-700 dark:prose-p:text-gray-300
                        prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline prose-a:font-medium hover:prose-a:underline prose-a:transition-colors
                        prose-code:text-gray-800 dark:prose-code:text-gray-100
                        prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                        prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                        prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:shadow-xl
                        prose-pre:rounded-xl prose-pre:border prose-pre:border-gray-800
                        prose-pre:p-6 prose-pre:my-8
                        prose-img:rounded-xl prose-img:shadow-2xl prose-img:my-8
                        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400
                        prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:my-8
                        prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-gray-900/50
                        prose-blockquote:rounded-r-lg
                        prose-ul:my-6 prose-ol:my-6
                        prose-li:my-2
                        prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
                        prose-hr:my-12 prose-hr:border-gray-300 dark:prose-hr:border-gray-700
                        animate-slideUp"
                 style="animation-delay: 0.1s;">
              <markdown [data]="post()!.content"></markdown>
            </div>
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
