import { Component, inject, OnInit, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarkdownService, Post, PostMetadata, SeriesInfo } from '../../core/services/markdown.service';
import { I18nService } from '../../core/services/i18n.service';
import { SeoService } from '../../core/services/seo.service';
import { ReadingProgressComponent } from '../../shared/components/reading-progress.component';
import { CodeBlockCopyButtonComponent } from '../../shared/components/code-block-copy-button.component';
import { TableOfContentsComponent } from '../../shared/components/table-of-contents.component';
import { forkJoin } from 'rxjs';

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
 *
 * 性能優化：使用 OnPush Change Detection 配合 Signal
 */
@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownModule, ReadingProgressComponent, CodeBlockCopyButtonComponent, TableOfContentsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <!-- Back button -->
          <div class="mb-8 max-w-3xl mx-auto lg:mx-0">
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

          <!-- Two Column Layout: TOC on left, Article on right -->
          <div class="flex gap-12 lg:gap-16">
            <!-- Table of Contents Sidebar (Desktop - Left) -->
            <!-- 目錄側邊欄：桌面版顯示在左側，sticky 定位保持在視窗內 -->
            <aside class="hidden lg:block flex-shrink-0">
              <app-table-of-contents [content]="post()!.content" />
            </aside>

            <!-- Main Content -->
            <!-- 文章主內容：使用 flex-1 佔據剩餘空間，max-w-3xl 限制最大寬度提升閱讀體驗 -->
            <article class="flex-1 min-w-0 max-w-3xl animate-fadeIn">

          <!-- Article header -->
          <header class="mb-12 animate-slideUp">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.3] pb-1 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
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

          <!-- Mobile TOC -->
          <div class="lg:hidden mb-8">
            <app-table-of-contents [content]="post()!.content" />
          </div>

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

          <!-- Series Navigation -->
          @if (post()!.series && seriesInfo()) {
            <div class="mt-16 border-t border-gray-200 dark:border-gray-800 pt-12">
              <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900/50 dark:to-gray-900/50 border border-blue-200 dark:border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
                <!-- Series Header -->
                <div class="flex items-center gap-3 mb-6">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ currentLang() === 'zh-TW' ? '本文是系列文章的一部分' : 'Part of a series' }}</p>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ seriesInfo()!.title }}</h3>
                  </div>
                </div>

                <p class="text-gray-700 dark:text-gray-300 mb-6">{{ seriesInfo()!.description }}</p>

                <!-- Progress -->
                <div class="mb-6">
                  <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>{{ currentLang() === 'zh-TW' ? '進度' : 'Progress' }}</span>
                    <span>{{ post()!.seriesOrder }} / {{ seriesInfo()!.totalPosts }}</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      [style.width]="(post()!.seriesOrder! / seriesInfo()!.totalPosts * 100) + '%'"
                    ></div>
                  </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  @if (seriesNav.previous) {
                    <a
                      [routerLink]="['/blog', seriesNav.previous.slug]"
                      class="group flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      <div class="flex-1 text-left">
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentLang() === 'zh-TW' ? '上一篇' : 'Previous' }}</p>
                        <p class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">{{ seriesNav.previous.title }}</p>
                      </div>
                    </a>
                  } @else {
                    <div class="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl opacity-50">
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentLang() === 'zh-TW' ? '這是第一篇' : 'First article' }}</p>
                    </div>
                  }

                  @if (seriesNav.next) {
                    <a
                      [routerLink]="['/blog', seriesNav.next.slug]"
                      class="group flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div class="flex-1 text-right">
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentLang() === 'zh-TW' ? '下一篇' : 'Next' }}</p>
                        <p class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">{{ seriesNav.next.title }}</p>
                      </div>
                      <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  } @else {
                    <div class="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl opacity-50">
                      <p class="text-xs text-gray-500 dark:text-gray-400 text-right">{{ currentLang() === 'zh-TW' ? '這是最後一篇' : 'Last article' }}</p>
                    </div>
                  }
                </div>

                <!-- View All Series Link -->
                <a
                  [routerLink]="['/series', post()!.series]"
                  class="block text-center py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {{ currentLang() === 'zh-TW' ? '查看完整系列' : 'View full series' }} ({{ seriesInfo()!.totalPosts }} {{ currentLang() === 'zh-TW' ? '篇' : 'articles' }})
                </a>
              </div>
            </div>
          }

          <!-- Related Posts -->
          @if (relatedPosts().length > 0) {
            <div class="mt-16 border-t border-gray-200 dark:border-gray-800 pt-12">
              <h2 class="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-900 dark:text-gray-100">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {{ currentLang() === 'zh-TW' ? '相關文章' : 'Related Articles' }}
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                @for (relatedPost of relatedPosts(); track relatedPost.slug) {
                  <a
                    [routerLink]="['/blog', relatedPost.slug]"
                    class="group block p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <!-- Category Badge -->
                    @if (relatedPost.category) {
                      <div class="mb-3">
                        @if (relatedPost.category === 'tutorial-series') {
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold">
                            {{ currentLang() === 'zh-TW' ? '系列' : 'Series' }}
                          </span>
                        } @else if (relatedPost.category === 'tutorial') {
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                            {{ currentLang() === 'zh-TW' ? '教學' : 'Tutorial' }}
                          </span>
                        } @else if (relatedPost.category === 'daily') {
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                            {{ currentLang() === 'zh-TW' ? '日常' : 'Daily' }}
                          </span>
                        }
                      </div>
                    }

                    <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {{ relatedPost.title }}
                    </h3>

                    @if (relatedPost.description) {
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {{ relatedPost.description }}
                      </p>
                    }

                    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <time [attr.datetime]="relatedPost.date">
                        {{ formatDate(relatedPost.date) }}
                      </time>
                      @if (relatedPost.readingTime) {
                        <span>•</span>
                        <span>{{ relatedPost.readingTime }} {{ currentLang() === 'zh-TW' ? '分鐘' : 'min' }}</span>
                      }
                    </div>
                  </a>
                }
              </div>
            </div>
          }
            </article>
          </div>
        </div>
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
  private seoService = inject(SeoService);
  private destroyRef = inject(DestroyRef);
  i18nService = inject(I18nService);

  currentLang = this.i18nService.currentLang;
  post = signal<Post | null>(null);
  loading = signal(true);
  seriesInfo = signal<SeriesInfo | null>(null);
  seriesNav: { previous: PostMetadata | null; next: PostMetadata | null } = { previous: null, next: null };
  relatedPosts = signal<PostMetadata[]>([]);

  ngOnInit() {
    // 訂閱路由參數變化，解決 OnPush 模式下的導航問題
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const slug = params.get('slug');
        if (!slug) {
          this.router.navigate(['/blog']);
          return;
        }

        // 重置狀態
        this.loading.set(true);
        this.post.set(null);
        this.seriesInfo.set(null);
        this.seriesNav = { previous: null, next: null };
        this.relatedPosts.set([]);

        // 滾動到頁面頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Load post and all posts for series navigation and related posts
        forkJoin({
          post: this.markdownService.getPost(slug),
          allPosts: this.markdownService.getAllPosts()
        })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: ({ post, allPosts }) => {
              this.post.set(post);

              if (post) {
                // 設置 SEO Meta Tags 和 Schema.org
                this.seoService.setArticle(post);

                // 設置麵包屑 Schema
                this.seoService.setBreadcrumbSchema([
                  { name: '首頁', url: '/' },
                  { name: '部落格', url: '/blog' },
                  { name: post.title, url: `/blog/${post.slug}` }
                ]);

                // If post is part of a series, load series info and navigation
                if (post.series) {
                  const series = this.markdownService.getSeriesById(allPosts, post.series);
                  this.seriesInfo.set(series);
                  this.seriesNav = this.markdownService.getSeriesNavigation(post, allPosts);
                }

                // Load related posts based on tags
                const related = this.markdownService.getRelatedPosts(post, allPosts, 3);
                this.relatedPosts.set(related);
              }

              this.loading.set(false);
            },
            error: () => {
              this.loading.set(false);
              this.router.navigate(['/blog']);
            }
          });
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
