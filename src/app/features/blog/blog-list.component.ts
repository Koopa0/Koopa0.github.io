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
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 class="text-4xl font-bold mb-12">{{ t('blog.allPosts') }}</h1>

      @if (loading()) {
        <div class="space-y-6">
          @for (i of [1, 2, 3]; track i) {
            <div class="animate-pulse border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            </div>
          }
        </div>
      } @else if (posts().length > 0) {
        <div class="space-y-8">
          @for (post of posts(); track post.slug) {
            <article class="group">
              <a
                [routerLink]="['/blog', post.slug]"
                class="block border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
              >
                <h2 class="text-2xl font-bold mb-3 group-hover:text-blue-500 transition-colors">
                  {{ post.title }}
                </h2>

                @if (post.description) {
                  <p class="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {{ post.description }}
                  </p>
                }

                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                  <time [attr.datetime]="post.date">
                    {{ formatDate(post.date) }}
                  </time>

                  @if (post.tags && post.tags.length > 0) {
                    <span class="text-gray-300 dark:text-gray-700">•</span>
                    <div class="flex flex-wrap gap-2">
                      @for (tag of post.tags; track tag) {
                        <span class="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">
                          {{ tag }}
                        </span>
                      }
                    </div>
                  }
                </div>
              </a>
            </article>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <p class="text-gray-600 dark:text-gray-400 text-lg">
            {{ t('blog.noPostsFound') }}
          </p>
          <p class="text-gray-500 dark:text-gray-500 mt-4">
            {{ currentLang() === 'zh-TW'
              ? '文章建立中，敬請期待...'
              : 'Posts coming soon...'
            }}
          </p>
        </div>
      }
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
