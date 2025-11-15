import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownService, PostMetadata } from '../../core/services/markdown.service';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Tag Posts Component
 *
 * 顯示特定標籤的所有文章列表
 *
 * 功能：
 * - 從路由參數獲取標籤名稱
 * - 載入並篩選該標籤的文章
 * - 顯示文章數量統計
 * - 提供返回所有標籤的連結
 */
@Component({
  selector: 'app-tag-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <!-- Back to all tags -->
      <div class="mb-8">
        <a
          routerLink="/tags"
          class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ t('tags.allTags') }}
        </a>
      </div>

      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div class="space-y-4 mt-8">
            @for (i of [1,2,3]; track i) {
              <div class="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            }
          </div>
        </div>
      } @else {
        <!-- Tag header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-4 capitalize">
            {{ t('tags.' + tag()) }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {{ posts().length }} {{ currentLang() === 'zh-TW' ? '篇文章' : 'posts' }}
          </p>
        </div>

        <!-- Posts list -->
        @if (posts().length > 0) {
          <div class="space-y-6">
            @for (post of posts(); track post.slug) {
              <article class="group border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg">
                <a [routerLink]="['/blog', post.slug]" class="block">
                  <h2 class="text-2xl font-bold mb-3 group-hover:text-blue-500 transition-colors">
                    {{ post.title }}
                  </h2>

                  @if (post.description) {
                    <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
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
                        @for (postTag of post.tags; track postTag) {
                          <a
                            [routerLink]="['/tags', postTag.toLowerCase()]"
                            class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            (click)="$event.stopPropagation()"
                          >
                            {{ postTag }}
                          </a>
                        }
                      </div>
                    }
                  </div>
                </a>
              </article>
            }
          </div>
        } @else {
          <div class="text-center py-16">
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              {{ currentLang() === 'zh-TW' ? '此標籤尚無文章' : 'No posts found for this tag' }}
            </p>
            <a
              routerLink="/blog"
              class="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {{ t('blog.allPosts') }}
            </a>
          </div>
        }
      }
    </div>
  `
})
export class TagPostsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private markdownService = inject(MarkdownService);
  i18nService = inject(I18nService);

  currentLang = this.i18nService.currentLang;
  tag = signal<string>('');
  posts = signal<PostMetadata[]>([]);
  loading = signal(true);

  ngOnInit() {
    const tag = this.route.snapshot.paramMap.get('tag');
    if (!tag) {
      this.router.navigate(['/tags']);
      return;
    }

    this.tag.set(tag);

    // Load all posts and filter by tag
    this.markdownService.getAllPosts().subscribe({
      next: (allPosts) => {
        const filteredPosts = this.markdownService.getPostsByTag(allPosts, tag);
        // Sort by date (newest first)
        const sortedPosts = filteredPosts.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.posts.set(sortedPosts);
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
