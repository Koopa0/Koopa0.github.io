import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Page, PageListResponse } from '../../../core/models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-8">
      <!-- Welcome Section -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 class="text-3xl font-bold mb-2">
          Welcome back, {{ (currentUser()?.displayName || '').split(' ')[0] || 'there' }}! 👋
        </h1>
        <p class="text-blue-100">
          Your personal knowledge management workspace
        </p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Total Pages -->
        <div class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pages</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ stats().totalPages }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Published Posts -->
        <div class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Published</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ stats().publishedPages }}
              </p>
            </div>
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Draft Pages -->
        <div class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Drafts</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ stats().draftPages }}
              </p>
            </div>
            <div class="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg class="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            routerLink="/workspace/pages/new"
            class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
          >
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900 dark:text-gray-100">New Page</p>
              <p class="text-xs text-gray-500 dark:text-gray-500">Create a new note</p>
            </div>
          </button>

          <button
            routerLink="/workspace/ai-chat"
            class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
          >
            <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900 dark:text-gray-100">AI Chat</p>
              <p class="text-xs text-gray-500 dark:text-gray-500">Ask AI anything</p>
            </div>
          </button>

          <button
            routerLink="/workspace/pages"
            class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
          >
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900 dark:text-gray-100">All Pages</p>
              <p class="text-xs text-gray-500 dark:text-gray-500">Browse all notes</p>
            </div>
          </button>

          <button
            routerLink="/workspace/learning-paths"
            class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
          >
            <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
              <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900 dark:text-gray-100">Learning Paths</p>
              <p class="text-xs text-gray-500 dark:text-gray-500">Structured learning</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Recent Pages -->
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Pages</h2>

        @if (loading()) {
          <div class="space-y-4">
            @for (i of [1,2,3]; track i) {
              <div class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse">
                <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            }
          </div>
        } @else if (recentPages().length > 0) {
          <div class="space-y-4">
            @for (page of recentPages(); track page.id) {
              <a
                [routerLink]="['/workspace/pages', page.id]"
                class="block bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all group"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      @if (page.icon) {
                        <span class="text-2xl">{{ page.icon }}</span>
                      }
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {{ page.title }}
                      </h3>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      <span>Updated {{ formatDate(page.updatedAt) }}</span>
                      @if (page.category) {
                        <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                          {{ page.category }}
                        </span>
                      }
                      @if (page.publishStatus === 'published') {
                        <span class="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                          </svg>
                          <span class="text-xs">Published</span>
                        </span>
                      }
                    </div>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            }
          </div>
        } @else {
          <div class="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500 dark:text-gray-500 mb-4">No pages yet</p>
            <button
              routerLink="/workspace/pages/new"
              class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all"
            >
              Create your first page
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);

  // State
  loading = signal(true);
  recentPages = signal<Page[]>([]);
  stats = signal({
    totalPages: 0,
    publishedPages: 0,
    draftPages: 0
  });

  // Auth
  currentUser = this.authService.currentUser;

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      // Load all pages
      const response = await firstValueFrom(
        this.api.get<PageListResponse>('pages')
      );

      const pages = response.pages;

      // Calculate stats
      this.stats.set({
        totalPages: pages.length,
        publishedPages: pages.filter(p => p.publishStatus === 'published').length,
        draftPages: pages.filter(p => p.publishStatus === 'draft').length
      });

      // Get recent pages (last 5, sorted by updated date)
      const recent = [...pages]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      this.recentPages.set(recent);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  }
}
