import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { MarkdownService, SeriesInfo } from '../../core/services/markdown.service';

@Component({
  selector: 'app-series-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 -z-10"></div>

      @let lang = currentLang();
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Header -->
        <div class="mb-16 animate-slideUp">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            {{ lang === 'zh-TW' ? '系列教學' : 'Tutorial Series' }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {{ lang === 'zh-TW'
              ? '探索深入的系列教學，一步步掌握技術知識'
              : 'Explore in-depth tutorial series and master technical knowledge step by step'
            }}
          </p>
          <div class="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
        </div>

        @if (loading()) {
          <!-- Loading skeleton -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-8 space-y-4">
                <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-shimmer"></div>
                <div class="space-y-2">
                  <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full animate-shimmer"></div>
                  <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6 animate-shimmer"></div>
                </div>
                <div class="flex gap-4">
                  <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20 animate-shimmer"></div>
                  <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-shimmer"></div>
                </div>
              </div>
            }
          </div>
        } @else if (series(); as seriesList) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            @for (s of seriesList; track s.id) {
              <article class="group animate-slideUp">
                <a
                  [routerLink]="['/series', s.id]"
                  class="block relative overflow-hidden border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1"
                >
                  <!-- Gradient overlay on hover -->
                  <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <!-- Content -->
                  <div class="relative z-10">
                    <!-- Series badge -->
                    <div class="mb-4">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold border border-purple-200 dark:border-purple-800">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {{ currentLang() === 'zh-TW' ? '系列教學' : 'Series' }}
                      </span>
                    </div>

                    <!-- Title -->
                    <h2 class="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      {{ s.title }}
                    </h2>

                    <!-- Description -->
                    <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      {{ s.description }}
                    </p>

                    <!-- Metadata -->
                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      <!-- Post count -->
                      <div class="flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="font-medium">
                          {{ s.totalPosts }} {{ currentLang() === 'zh-TW' ? '篇文章' : 'articles' }}
                        </span>
                      </div>

                      <span class="text-gray-300 dark:text-gray-700">•</span>

                      <!-- Last updated -->
                      <div class="flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {{ currentLang() === 'zh-TW' ? '更新於 ' : 'Updated ' }}{{ formatDate(s.lastUpdated) }}
                        </span>
                      </div>
                    </div>

                    <!-- Progress bar -->
                    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {{ currentLang() === 'zh-TW' ? '學習進度' : 'Learning Progress' }}
                        </span>
                        <span class="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          0 / {{ s.totalPosts }}
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                             style="width: 0%">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Arrow indicator -->
                  <div class="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </a>
              </article>
            }
          </div>
        } @else {
          <div class="text-center py-20 animate-fadeIn">
            <div class="mb-6">
              <svg class="w-24 h-24 mx-auto text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-xl font-medium mb-2">
              {{ currentLang() === 'zh-TW' ? '目前沒有系列教學' : 'No series available yet' }}
            </p>
            <p class="text-gray-500 dark:text-gray-500">
              {{ currentLang() === 'zh-TW'
                ? '系列教學建立中，敬請期待...'
                : 'Series coming soon...'
              }}
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class SeriesListComponent implements OnInit {
  i18nService = inject(I18nService);
  private markdownService = inject(MarkdownService);

  currentLang = this.i18nService.currentLang;
  series = signal<SeriesInfo[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.markdownService.getAllPosts().subscribe({
      next: (posts) => {
        const allSeries = this.markdownService.getAllSeries(posts);
        this.series.set(allSeries);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return this.currentLang() === 'zh-TW'
      ? d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
