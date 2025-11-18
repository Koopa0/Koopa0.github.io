import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/services/i18n.service';
import { MarkdownService, PostMetadata } from '../../core/services/markdown.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 -z-10"></div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Header -->
        <div class="mb-12 animate-slideUp">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {{ t('blog.allPosts') }}
          </h1>
          <div class="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        <!-- Search and Filters -->
        <div class="mb-8 space-y-4 animate-slideUp" style="animation-delay: 0.1s;">
          <!-- Search Input -->
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              [placeholder]="t('blog.searchPlaceholder')"
              class="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all outline-none"
            />
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Category Filter -->
            <select
              [(ngModel)]="selectedCategory"
              class="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all outline-none"
            >
              <option value="">{{ currentLang() === 'zh-TW' ? '所有分類' : 'All Categories' }}</option>
              @for (category of categories(); track category) {
                <option [value]="category">{{ t('categories.' + category) }}</option>
              }
            </select>

            <!-- Series Filter -->
            <select
              [(ngModel)]="selectedSeries"
              class="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all outline-none"
            >
              <option value="">{{ currentLang() === 'zh-TW' ? '所有系列' : 'All Series' }}</option>
              @for (series of availableSeries(); track series) {
                <option [value]="series">{{ series }}</option>
              }
            </select>

            <!-- Clear Filters Button -->
            @if (searchQuery() || selectedCategory() || selectedSeries()) {
              <button
                (click)="clearFilters()"
                class="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                {{ currentLang() === 'zh-TW' ? '清除篩選' : 'Clear Filters' }}
              </button>
            }
          </div>

          <!-- Results Count -->
          @if (!loading()) {
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ currentLang() === 'zh-TW'
                ? '共 ' + filteredPosts().length + ' 篇文章'
                : filteredPosts().length + ' posts found'
              }}
            </div>
          }
        </div>

      @if (loading()) {
        <!-- Clean skeleton loader -->
        <div class="space-y-6">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
              <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-shimmer"></div>
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full animate-shimmer"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6 animate-shimmer"></div>
              </div>
              <div class="flex gap-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-shimmer"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16 animate-shimmer"></div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredPosts(); as postList) {
        @let lang = currentLang();
        <div class="space-y-6">
          @for (post of postList; track post.slug) {
            <article class="group animate-slideUp">
              <a
                [routerLink]="['/blog', post.slug]"
                class="block relative overflow-hidden border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1"
              >
                <!-- Gradient overlay on hover -->
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <!-- Content -->
                <div class="relative z-10">
                  <!-- Category Badge -->
                  @if (post.category) {
                    <div class="mb-3 flex items-center gap-2">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize"
                        [ngClass]="{
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800': post.category === 'ai',
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800': post.category === 'algorithm',
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800': post.category === 'angular',
                          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800': post.category === 'daily',
                          'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800': post.category === 'devops',
                          'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800': post.category === 'flutter',
                          'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800': post.category === 'golang',
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800': post.category === 'google',
                          'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800': post.category === 'rust',
                          'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800': post.category === 'sql',
                          'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800': post.category === 'system'
                        }">
                        {{ t('categories.' + post.category) }}
                        @if (post.series && post.seriesOrder) {
                          <span class="ml-1 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs font-bold">
                            #{{ post.seriesOrder }}
                          </span>
                        }
                      </span>
                    </div>
                  }

                  <h2 class="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {{ post.title }}
                  </h2>

                  @if (post.description) {
                    <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-lg">
                      {{ post.description }}
                    </p>
                  }

                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    <time [attr.datetime]="post.date" class="flex items-center gap-1.5 font-medium">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ formatDate(post.date) }}
                    </time>

                    @if (post.readingTime) {
                      <span class="text-gray-300 dark:text-gray-700">•</span>
                      <span class="flex items-center gap-1.5 font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ post.readingTime }} {{ lang === 'zh-TW' ? '分鐘' : 'min' }}
                      </span>
                    }

                    @if (post.tags && post.tags.length > 0) {
                      <span class="text-gray-300 dark:text-gray-700">•</span>
                      <div class="flex flex-wrap gap-2">
                        @for (tag of post.tags; track tag) {
                          <span class="px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 text-blue-700 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-gray-700">
                            {{ tag }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Arrow indicator -->
                <div class="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </a>
            </article>
          }
        </div>
      } @else {
        @let lang = currentLang();
        <!-- No Posts -->
        <div class="text-center py-20 animate-fadeIn">
          <div class="mb-6">
            <svg class="w-24 h-24 mx-auto text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400 text-xl font-medium mb-2">
            {{ t('blog.noPostsFound') }}
          </p>
          <p class="text-gray-500 dark:text-gray-500">
            {{ lang === 'zh-TW'
              ? '文章建立中，敬請期待...'
              : 'Posts coming soon...'
            }}
          </p>
        </div>
      }
      </div>
    </div>
  `
})
export class BlogListComponent {
  i18nService = inject(I18nService);
  private markdownService = inject(MarkdownService);
  private destroyRef = inject(DestroyRef);

  currentLang = this.i18nService.currentLang;
  posts = signal<PostMetadata[]>([]);
  loading = signal(true);

  // Search and filter signals
  searchQuery = signal('');
  selectedCategory = signal('');
  selectedSeries = signal('');
  categories = signal<string[]>([]);
  seriesList = signal<string[]>([]);

  // Available series based on selected category
  availableSeries = computed(() => {
    const category = this.selectedCategory();
    if (!category) {
      // If no category selected, show all series
      return this.seriesList();
    }

    // Filter series that belong to the selected category
    const seriesInCategory = new Set<string>();
    this.posts().forEach(post => {
      if (post.category === category && post.series) {
        seriesInCategory.add(post.series);
      }
    });

    return Array.from(seriesInCategory).sort();
  });

  // Filtered posts computed signal
  filteredPosts = computed(() => {
    let filtered = this.posts();

    // Filter by search query (title and description)
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (this.selectedCategory()) {
      filtered = filtered.filter(post => post.category === this.selectedCategory());
    }

    // Filter by series
    if (this.selectedSeries()) {
      filtered = filtered.filter(post => post.series === this.selectedSeries());
    }

    return filtered;
  });

  constructor() {
    // 使用 constructor 代替 ngOnInit - Angular 20 best practice
    this.markdownService.getAllPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          this.posts.set(posts);

          // Extract unique categories and series
          const categoriesSet = new Set<string>();
          const seriesSet = new Set<string>();

          posts.forEach(post => {
            if (post.category) {
              categoriesSet.add(post.category);
            }
            if (post.series) {
              seriesSet.add(post.series);
            }
          });

          this.categories.set(Array.from(categoriesSet).sort());
          this.seriesList.set(Array.from(seriesSet).sort());
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });

    // Auto-clear series selection when category changes
    effect(() => {
      const category = this.selectedCategory();
      const series = this.selectedSeries();

      // If category changed and current series doesn't belong to new category
      if (category && series) {
        const availableSeries = this.availableSeries();
        if (!availableSeries.includes(series)) {
          this.selectedSeries.set('');
        }
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedSeries.set('');
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
