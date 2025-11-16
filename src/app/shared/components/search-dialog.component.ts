import { Component, output, signal, inject, HostListener, PLATFORM_ID, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarkdownService, PostMetadata } from '../../core/services/markdown.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
      (click)="close()"
    ></div>

    <!-- Dialog -->
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div
        class="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-slideUp"
        (click)="$event.stopPropagation()"
      >
        <!-- Search Input -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              #searchInput
              type="text"
              [(ngModel)]="query"
              (input)="search()"
              [placeholder]="currentLang() === 'zh-TW' ? '搜尋文章...' : 'Search articles...'"
              class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            @if (query) {
              <button
                (click)="clearSearch()"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Results -->
        <div class="max-h-[60vh] overflow-y-auto p-2">
          @if (query && filteredPosts().length > 0) {
            <div class="space-y-1">
              @for (post of filteredPosts(); track post.slug; let i = $index) {
                <a
                  [routerLink]="['/blog', post.slug]"
                  (click)="close()"
                  [class]="'group block p-4 rounded-xl transition-colors ' +
                          (i === selectedIndex()
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent')"
                >
                  <!-- Category Badge -->
                  @if (post.category) {
                    <div class="mb-2">
                      @if (post.category === 'tutorial-series') {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          {{ currentLang() === 'zh-TW' ? '系列' : 'Series' }}
                        </span>
                      } @else if (post.category === 'tutorial') {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {{ currentLang() === 'zh-TW' ? '教學' : 'Tutorial' }}
                        </span>
                      } @else if (post.category === 'daily') {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {{ currentLang() === 'zh-TW' ? '日常' : 'Daily' }}
                        </span>
                      }
                    </div>
                  }

                  <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {{ post.title }}
                  </h3>

                  @if (post.description) {
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {{ post.description }}
                    </p>
                  }

                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <time [attr.datetime]="post.date">
                      {{ formatDate(post.date) }}
                    </time>
                    @if (post.tags && post.tags.length > 0) {
                      <span>•</span>
                      <div class="flex gap-1">
                        @for (tag of post.tags.slice(0, 2); track tag) {
                          <span class="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {{ tag }}
                          </span>
                        }
                        @if (post.tags.length > 2) {
                          <span>+{{ post.tags.length - 2 }}</span>
                        }
                      </div>
                    }
                  </div>
                </a>
              }
            </div>
          } @else if (query) {
            <div class="py-12 text-center">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-gray-600 dark:text-gray-400 font-medium mb-1">
                {{ currentLang() === 'zh-TW' ? '找不到相關文章' : 'No articles found' }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-500">
                {{ currentLang() === 'zh-TW' ? '試試其他關鍵字' : 'Try different keywords' }}
              </p>
            </div>
          } @else {
            <div class="py-12 text-center">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p class="text-gray-600 dark:text-gray-400 font-medium">
                {{ currentLang() === 'zh-TW' ? '搜尋文章' : 'Search articles' }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {{ currentLang() === 'zh-TW' ? '輸入關鍵字開始搜尋' : 'Start typing to search' }}
              </p>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">↑↓</kbd>
              <span>{{ currentLang() === 'zh-TW' ? '導航' : 'Navigate' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">Enter</kbd>
              <span>{{ currentLang() === 'zh-TW' ? '選擇' : 'Select' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">Esc</kbd>
              <span>{{ currentLang() === 'zh-TW' ? '關閉' : 'Close' }}</span>
            </div>
          </div>
          <div>
            {{ filteredPosts().length }} {{ currentLang() === 'zh-TW' ? '篇文章' : 'articles' }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    .dark ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }

    .dark ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class SearchDialogComponent {
  /** 關閉對話框事件 - 使用 Output Function (Angular 20+) */
  closeDialog = output<void>();

  private markdownService = inject(MarkdownService);
  private i18nService = inject(I18nService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentLang = this.i18nService.currentLang;
  allPosts = signal<PostMetadata[]>([]);
  filteredPosts = signal<PostMetadata[]>([]);
  selectedIndex = signal<number>(-1);
  query = '';

  constructor() {
    this.markdownService.getAllPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          this.allPosts.set(posts);
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    this.close();
  }

  @HostListener('document:keydown.arrowdown')
  onArrowDown() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.filteredPosts().length === 0) return;

    const currentIndex = this.selectedIndex();
    const maxIndex = this.filteredPosts().length - 1;

    if (currentIndex < maxIndex) {
      this.selectedIndex.set(currentIndex + 1);
    } else {
      this.selectedIndex.set(0); // Loop back to start
    }
  }

  @HostListener('document:keydown.arrowup')
  onArrowUp() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.filteredPosts().length === 0) return;

    const currentIndex = this.selectedIndex();
    const maxIndex = this.filteredPosts().length - 1;

    if (currentIndex > 0) {
      this.selectedIndex.set(currentIndex - 1);
    } else {
      this.selectedIndex.set(maxIndex); // Loop to end
    }
  }

  @HostListener('document:keydown.enter')
  onEnter() {
    if (!isPlatformBrowser(this.platformId)) return;
    const index = this.selectedIndex();

    if (index >= 0 && index < this.filteredPosts().length) {
      const selectedPost = this.filteredPosts()[index];
      this.router.navigate(['/blog', selectedPost.slug]);
      this.close();
    }
  }

  search() {
    const q = this.query.toLowerCase().trim();

    if (!q) {
      this.filteredPosts.set([]);
      this.selectedIndex.set(-1);
      return;
    }

    const results = this.allPosts().filter(post => {
      // Search in title
      if (post.title.toLowerCase().includes(q)) {
        return true;
      }

      // Search in description
      if (post.description && post.description.toLowerCase().includes(q)) {
        return true;
      }

      // Search in tags
      if (post.tags.some(tag => tag.toLowerCase().includes(q))) {
        return true;
      }

      return false;
    });

    this.filteredPosts.set(results);
    // Reset selection to first item when search results change
    this.selectedIndex.set(results.length > 0 ? 0 : -1);
  }

  clearSearch() {
    this.query = '';
    this.filteredPosts.set([]);
    this.selectedIndex.set(-1);
  }

  close() {
    this.closeDialog.emit();  // output() 使用相同的 emit() API
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return this.currentLang() === 'zh-TW'
      ? d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
