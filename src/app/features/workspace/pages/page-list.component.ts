import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../../core/services/page.service';
import { Page } from '../../../core/models';

type FilterType = 'all' | 'draft' | 'published' | 'archived';

@Component({
  selector: 'app-page-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">All Pages</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ filteredPages().length }} page{{ filteredPages().length !== 1 ? 's' : '' }}
          </p>
        </div>
        <button
          routerLink="/workspace/pages/new"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
                placeholder="Search pages..."
                class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="flex gap-2 overflow-x-auto">
            @for (filter of filters(); track filter.value) {
              <button
                (click)="currentFilter.set(filter.value)"
                [class.bg-blue-600]="currentFilter() === filter.value"
                [class.text-white]="currentFilter() === filter.value"
                [class.bg-gray-100]="currentFilter() !== filter.value"
                [class.dark:bg-gray-800]="currentFilter() !== filter.value"
                [class.text-gray-700]="currentFilter() !== filter.value"
                [class.dark:text-gray-300]="currentFilter() !== filter.value"
                class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                {{ filter.label }}
                @if (filter.count !== undefined) {
                  <span class="ml-1 opacity-75">({{ filter.count }})</span>
                }
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse">
              <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-4"></div>
              <div class="flex gap-2">
                <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
                <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @else if (filteredPages().length === 0) {
        <div class="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg class="w-20 h-20 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          @if (searchQuery()) {
            <p class="text-gray-500 dark:text-gray-400 mb-2">No pages found matching "{{ searchQuery() }}"</p>
            <button
              (click)="clearSearch()"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear search
            </button>
          } @else {
            <p class="text-gray-500 dark:text-gray-400 mb-4">No pages yet</p>
            <button
              routerLink="/workspace/pages/new"
              class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all"
            >
              Create your first page
            </button>
          }
        </div>
      }

      <!-- Page Grid -->
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (page of filteredPages(); track page.id) {
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all group">
              <!-- Card Header -->
              <a
                [routerLink]="['/workspace/pages', page.id]"
                class="block p-6 pb-4"
              >
                <div class="flex items-start gap-3 mb-3">
                  @if (page.icon) {
                    <span class="text-3xl flex-shrink-0">{{ page.icon }}</span>
                  }
                  <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {{ page.title }}
                    </h3>
                  </div>
                </div>

                <!-- Metadata -->
                <div class="flex flex-wrap gap-2 mb-3">
                  @if (page.category) {
                    <span class="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                      {{ page.category }}
                    </span>
                  }
                  @for (tag of page.tags?.slice(0, 2); track tag) {
                    <span class="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                      #{{ tag }}
                    </span>
                  }
                  @if (page.tags && page.tags.length > 2) {
                    <span class="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                      +{{ page.tags.length - 2 }}
                    </span>
                  }
                </div>

                <!-- Status and Date -->
                <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{{ formatDate(page.updatedAt) }}</span>
                  <div class="flex items-center gap-1">
                    @if (page.publishStatus === 'published') {
                      <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    } @else if (page.publishStatus === 'draft') {
                      <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    }
                    <span class="capitalize text-xs">{{ page.publishStatus }}</span>
                  </div>
                </div>
              </a>

              <!-- Actions -->
              <div class="px-6 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <button
                  (click)="editPage(page)"
                  class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Edit
                </button>
                <div class="flex items-center gap-3">
                  @if (page.publishStatus === 'draft') {
                    <button
                      (click)="publishPage(page)"
                      class="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    >
                      Publish
                    </button>
                  }
                  <button
                    (click)="deletePage(page)"
                    class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class PageListComponent implements OnInit {
  private pageService = inject(PageService);

  // State
  pages = signal<Page[]>([]);
  loading = this.pageService.loading;
  searchQuery = signal('');
  currentFilter = signal<FilterType>('all');

  // Computed
  filters = computed(() => {
    const allPages = this.pages();
    return [
      { label: 'All', value: 'all' as FilterType, count: allPages.length },
      { label: 'Draft', value: 'draft' as FilterType, count: allPages.filter(p => p.publishStatus === 'draft').length },
      { label: 'Published', value: 'published' as FilterType, count: allPages.filter(p => p.publishStatus === 'published').length },
      { label: 'Archived', value: 'archived' as FilterType, count: allPages.filter(p => p.publishStatus === 'archived').length }
    ];
  });

  filteredPages = computed(() => {
    let result = this.pages();

    // Filter by status
    const filter = this.currentFilter();
    if (filter !== 'all') {
      result = result.filter(p => p.publishStatus === filter);
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort by updated date (newest first)
    return result.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  async ngOnInit() {
    await this.loadPages();
  }

  private async loadPages() {
    try {
      const pages = await this.pageService.getAllAsync();
      this.pages.set(pages);
    } catch (error) {
      console.error('Failed to load pages', error);
    }
  }

  onSearchChange() {
    // Search is reactive through signal, no need to do anything
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  editPage(page: Page) {
    // Navigation is handled by routerLink in template
  }

  async publishPage(page: Page) {
    if (confirm(`Publish "${page.title}" to your blog?`)) {
      try {
        await this.pageService.publishAsync(page.id, {
          slug: page.publishedSlug || this.generateSlug(page.title)
        });
        // Reload pages to reflect changes
        await this.loadPages();
      } catch (error) {
        console.error('Failed to publish page', error);
        alert('Failed to publish page. Please try again.');
      }
    }
  }

  async deletePage(page: Page) {
    if (confirm(`Are you sure you want to delete "${page.title}"? This action cannot be undone.`)) {
      try {
        await this.pageService.deleteAsync(page.id);
        // Remove from local state
        this.pages.update(pages => pages.filter(p => p.id !== page.id));
      } catch (error) {
        console.error('Failed to delete page', error);
        alert('Failed to delete page. Please try again.');
      }
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
