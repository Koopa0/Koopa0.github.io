import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { MarkdownService, SeriesInfo, PostMetadata } from '../../core/services/markdown.service';

@Component({
  selector: 'app-series-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 -z-10"></div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        @if (loading()) {
          <!-- Loading skeleton -->
          <div class="animate-fadeIn space-y-8">
            <div class="space-y-4">
              <div class="h-12 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-shimmer"></div>
              <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-full animate-shimmer"></div>
              <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 animate-shimmer"></div>
            </div>
            <div class="space-y-4">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-shimmer"></div>
              }
            </div>
          </div>
        } @else if (series()) {
          <div class="animate-slideUp">
            <!-- Back button -->
            <div class="mb-8">
              <a
                routerLink="/series"
                class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span class="font-medium">
                  {{ currentLang() === 'zh-TW' ? '返回系列列表' : 'Back to Series' }}
                </span>
              </a>
            </div>

            <!-- Series Header -->
            <div class="mb-12">
              <!-- Badge -->
              <div class="mb-4">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold border border-purple-200 dark:border-purple-800">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {{ currentLang() === 'zh-TW' ? '系列教學' : 'Tutorial Series' }}
                </span>
              </div>

              <!-- Title -->
              <h1 class="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                {{ series()!.title }}
              </h1>

              <!-- Description -->
              <p class="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {{ series()!.description }}
              </p>

              <!-- Metadata -->
              <div class="flex flex-wrap items-center gap-6 text-sm">
                <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="font-medium">
                    {{ series()!.totalPosts }} {{ currentLang() === 'zh-TW' ? '篇文章' : 'articles' }}
                  </span>
                </div>

                <span class="text-gray-300 dark:text-gray-700">•</span>

                <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {{ currentLang() === 'zh-TW' ? '更新於 ' : 'Updated ' }}{{ formatDate(series()!.lastUpdated) }}
                  </span>
                </div>
              </div>

              <!-- Divider -->
              <div class="mt-8 w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
            </div>

            <!-- Articles List -->
            <div class="space-y-4">
              @for (post of series()!.posts; track post.slug) {
                <article class="group">
                  <a
                    [routerLink]="['/blog', post.slug]"
                    class="flex items-start gap-6 p-6 border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 hover:shadow-card dark:hover:shadow-card-dark hover:-translate-y-0.5"
                  >
                    <!-- Order number -->
                    <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-lg shadow-glow-sm group-hover:shadow-glow-md transition-shadow duration-300">
                      {{ post.seriesOrder }}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <h3 class="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                        {{ post.title }}
                      </h3>

                      @if (post.description) {
                        <p class="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed text-sm">
                          {{ post.description }}
                        </p>
                      }

                      <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <time [attr.datetime]="post.date" class="font-medium">
                          {{ formatDate(post.date) }}
                        </time>

                        @if (post.tags && post.tags.length > 0) {
                          <span class="text-gray-300 dark:text-gray-700">•</span>
                          <div class="flex flex-wrap gap-1.5">
                            @for (tag of post.tags.slice(0, 3); track tag) {
                              <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {{ tag }}
                              </span>
                            }
                            @if (post.tags.length > 3) {
                              <span class="px-2 py-0.5 text-gray-500">
                                +{{ post.tags.length - 3 }}
                              </span>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Arrow indicator -->
                    <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                </article>
              }
            </div>

            <!-- Start Learning CTA -->
            <div class="mt-12 p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900/50 dark:to-gray-900/50 border-2 border-purple-200 dark:border-purple-900 rounded-2xl text-center">
              <h3 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                {{ currentLang() === 'zh-TW' ? '準備好開始學習了嗎？' : 'Ready to start learning?' }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {{ currentLang() === 'zh-TW'
                  ? '從第一篇文章開始，循序漸進掌握知識'
                  : 'Start from the first article and master the knowledge step by step'
                }}
              </p>
              <a
                [routerLink]="['/blog', series()!.posts[0].slug]"
                class="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-glow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <span>{{ currentLang() === 'zh-TW' ? '開始學習' : 'Start Learning' }}</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        } @else {
          <!-- Series not found -->
          <div class="text-center py-20 animate-fadeIn">
            <div class="mb-6">
              <svg class="w-24 h-24 mx-auto text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-xl font-medium mb-4">
              {{ currentLang() === 'zh-TW' ? '找不到此系列' : 'Series not found' }}
            </p>
            <a
              routerLink="/series"
              class="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>{{ currentLang() === 'zh-TW' ? '返回系列列表' : 'Back to Series' }}</span>
            </a>
          </div>
        }
      </div>
    </div>
  `
})
export class SeriesDetailComponent implements OnInit {
  i18nService = inject(I18nService);
  private markdownService = inject(MarkdownService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentLang = this.i18nService.currentLang;
  series = signal<SeriesInfo | null>(null);
  loading = signal(true);

  ngOnInit() {
    const seriesId = this.route.snapshot.paramMap.get('id');

    if (!seriesId) {
      this.router.navigate(['/series']);
      return;
    }

    this.markdownService.getAllPosts().subscribe({
      next: (posts) => {
        const foundSeries = this.markdownService.getSeriesById(posts, seriesId);
        this.series.set(foundSeries);
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
