import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/services/i18n.service';
import { MarkdownService } from '../../core/services/markdown.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 -z-10"></div>

      <!-- Grid Pattern Overlay -->
      <div class="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] -z-10"></div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Hero Section - Josh Comeau inspired -->
        <section class="text-center py-20 md:py-32 relative">
          <!-- Floating elements -->
          <div class="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl animate-float"></div>
          <div class="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-float" style="animation-delay: 1s;"></div>

          <div class="relative z-10 animate-slideUp">
            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 dark:from-blue-400 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent leading-tight pb-2">
              {{ t('blog.title') }}
            </h1>
            <p class="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              {{ t('blog.subtitle') }}
            </p>
            <div class="flex justify-center gap-4">
              <a
                routerLink="/blog"
                class="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/50 dark:shadow-blue-500/20 hover:-translate-y-0.5"
              >
                <span class="relative z-10">{{ t('blog.allPosts') }}</span>
                <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
              </a>
            </div>
          </div>
        </section>

        <!-- Tech Tags Section - Lee Robinson inspired -->
        <section class="py-16">
          <div class="text-center mb-12 animate-slideUp" style="animation-delay: 0.1s;">
            <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {{ t('home.techTopics') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {{ currentLang() === 'zh-TW' ? '探索我的技術文章和學習筆記' : 'Explore my technical articles and learning notes' }}
            </p>
          </div>

          @if (loading()) {
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-6 animate-pulse">
                  <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2 animate-shimmer"></div>
                  <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-shimmer"></div>
                </div>
              }
            </div>
          } @else {
            @let lang = currentLang();
            @let categories = techTags();
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              @for (tag of categories; track tag.category; let i = $index) {
                <a
                  [routerLink]="['/tags', tag.category]"
                  class="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:border-blue-500 dark:hover:border-blue-400 p-6 text-center transition-all duration-300 hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1 animate-slideUp"
                  [style.animation-delay]="(i * 0.05) + 's'"
                >
                  <!-- Hover gradient overlay -->
                  <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <!-- Content -->
                  <div class="relative z-10">
                    <h3 class="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 capitalize">
                      {{ t('categories.' + tag.category) }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {{ tag.count }} {{ lang === 'zh-TW' ? '篇文章' : 'posts' }}
                    </p>
                  </div>

                  <!-- Animated corner accent -->
                  <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              }
            </div>
          }
        </section>

        <!-- About Section -->
        <section class="py-16 text-center animate-slideUp" style="animation-delay: 0.2s;">
          <div class="max-w-2xl mx-auto">
            <div class="relative inline-block mb-6">
              <h2 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {{ t('home.aboutMe') }}
              </h2>
              <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>

            <p class="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {{ t('home.aboutDescription') }}
            </p>

            <a
              routerLink="/about"
              class="group inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>{{ t('nav.about') }}</span>
              <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </section>
      </div>
    </div>
  `
})
export class HomeComponent {
  i18nService = inject(I18nService);
  private markdownService = inject(MarkdownService);
  private destroyRef = inject(DestroyRef);

  currentLang = this.i18nService.currentLang;
  techTags = signal<{ category: string; count: number }[]>([]);
  loading = signal(true);

  constructor() {
    // 使用 constructor 代替 ngOnInit - Angular 20 best practice
    // 確保每次路由到此組件時都會重新載入數據
    this.markdownService.getAllPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          // Count posts per category
          const categoryMap = new Map<string, number>();
          posts.forEach(post => {
            if (post.category) {
              categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1);
            }
          });

          // Convert to array and sort by category name
          const categories = Array.from(categoryMap.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => a.category.localeCompare(b.category));

          this.techTags.set(categories);
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
