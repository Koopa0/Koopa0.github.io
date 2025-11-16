import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { MarkdownService, PostMetadata } from '../../core/services/markdown.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-dark-bg-primary dark:to-gray-900 -z-10"></div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Header -->
        <div class="mb-16 animate-slideUp">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {{ t('blog.allPosts') }}
          </h1>
          <div class="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
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
      } @else if (posts().length > 0) {
        <div class="space-y-6">
          @for (post of posts(); track post.slug) {
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
                      @if (post.category === 'tutorial-series') {
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold border border-purple-200 dark:border-purple-800">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          {{ currentLang() === 'zh-TW' ? '系列教學' : 'Tutorial Series' }}
                          @if (post.seriesOrder) {
                            <span class="ml-1 px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold">
                              #{{ post.seriesOrder }}
                            </span>
                          }
                        </span>
                      } @else if (post.category === 'tutorial') {
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {{ currentLang() === 'zh-TW' ? '教學' : 'Tutorial' }}
                        </span>
                      } @else if (post.category === 'daily') {
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          {{ currentLang() === 'zh-TW' ? '日常分享' : 'Daily' }}
                        </span>
                      } @else if (post.category === 'note') {
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold border border-green-200 dark:border-green-800">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          {{ currentLang() === 'zh-TW' ? '筆記' : 'Note' }}
                        </span>
                      } @else if (post.category === 'project') {
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-800">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {{ currentLang() === 'zh-TW' ? '專案' : 'Project' }}
                        </span>
                      }
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
                        {{ post.readingTime }} {{ currentLang() === 'zh-TW' ? '分鐘' : 'min' }}
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
            {{ currentLang() === 'zh-TW'
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
export class BlogListComponent implements OnInit {
  i18nService = inject(I18nService);
  private markdownService = inject(MarkdownService);

  currentLang = this.i18nService.currentLang;
  posts = signal<PostMetadata[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.markdownService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts.set(posts);
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

  t(key: string): string {
    return this.i18nService.translate(key);
  }
}
