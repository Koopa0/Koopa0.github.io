import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../../core/services/page.service';
import { Page, CreatePageRequest, UpdatePageRequest } from '../../../core/models';

/**
 * Page Editor Component
 *
 * TODO: Install Tiptap editor packages:
 * npm install @tiptap/core @tiptap/starter-kit @tiptap/pm @tiptap/extension-link @tiptap/extension-image @tiptap/extension-table
 *
 * For now, using a simple textarea as placeholder.
 * The Page model already supports TiptapContent format for future integration.
 */
@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <!-- Top Bar -->
      <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
          <!-- Back Button -->
          <button
            routerLink="/workspace/pages"
            class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Pages
          </button>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <!-- Status Badge -->
            <span
              [class.bg-green-100]="form.publishStatus === 'published'"
              [class.text-green-700]="form.publishStatus === 'published'"
              [class.dark:bg-green-900/30]="form.publishStatus === 'published'"
              [class.dark:text-green-300]="form.publishStatus === 'published'"
              [class.bg-amber-100]="form.publishStatus === 'draft'"
              [class.text-amber-700]="form.publishStatus === 'draft'"
              [class.dark:bg-amber-900/30]="form.publishStatus === 'draft'"
              [class.dark:text-amber-300]="form.publishStatus === 'draft'"
              class="px-3 py-1 rounded-full text-sm font-medium capitalize"
            >
              {{ form.publishStatus }}
            </span>

            <!-- Save Button -->
            <button
              (click)="savePage()"
              [disabled]="saving()"
              class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (saving()) {
                <span class="flex items-center gap-2">
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              } @else {
                Save
              }
            </button>

            <!-- Publish Button -->
            @if (form.publishStatus === 'draft') {
              <button
                (click)="publishPage()"
                [disabled]="saving()"
                class="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publish
              </button>
            }

            <!-- More Actions Menu -->
            <div class="relative">
              <button
                (click)="moreMenuOpen.set(!moreMenuOpen())"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              @if (moreMenuOpen()) {
                <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <button
                    (click)="deletePage()"
                    class="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Page
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Editor Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="max-w-5xl mx-auto p-6 space-y-6">
          <!-- Icon Picker -->
          <div class="flex items-center gap-4">
            <button
              (click)="showIconPicker.set(!showIconPicker())"
              class="text-6xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-3 transition-colors"
            >
              {{ form.icon || '📄' }}
            </button>
            @if (showIconPicker()) {
              <div class="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                @for (emoji of commonEmojis; track emoji) {
                  <button
                    (click)="selectIcon(emoji)"
                    class="text-3xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-2 transition-colors"
                  >
                    {{ emoji }}
                  </button>
                }
              </div>
            }
          </div>

          <!-- Title -->
          <input
            type="text"
            [(ngModel)]="form.title"
            placeholder="Untitled"
            class="w-full text-5xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
          />

          <!-- Metadata -->
          <div class="flex flex-wrap gap-4">
            <!-- Category -->
            <div class="flex-1 min-w-[200px]">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <input
                type="text"
                [(ngModel)]="form.category"
                placeholder="e.g., Tutorial, Note, Article"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Tags -->
            <div class="flex-1 min-w-[200px]">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                [(ngModel)]="tagsInput"
                (ngModelChange)="onTagsChange()"
                placeholder="e.g., golang, tutorial, backend"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Content Editor -->
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                <strong>TODO:</strong> Integrate Tiptap editor here for rich text editing with blocks, similar to Notion.
                <br />
                For now, using a simple textarea. The backend already supports Tiptap JSON format.
              </p>
            </div>

            <textarea
              [(ngModel)]="contentText"
              placeholder="Start writing your content..."
              rows="20"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class PageEditorComponent implements OnInit {
  private pageService = inject(PageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  pageId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  showIconPicker = signal(false);
  moreMenuOpen = signal(false);

  // Form data
  form = {
    title: 'Untitled',
    icon: '📄',
    category: '',
    publishStatus: 'draft' as 'draft' | 'published' | 'archived'
  };

  tagsInput = '';
  contentText = '';

  commonEmojis = [
    '📄', '📝', '📋', '📌', '📍', '🚀', '💡', '🎯', '⚡', '🔥',
    '💻', '🖥️', '📱', '🛠️', '⚙️', '🔧', '🔨', '🧪', '🧬', '📊',
    '📈', '📉', '💰', '💵', '🎨', '🎭', '🎪', '🎬', '📷', '📸',
    '🏆', '🎖️', '🏅', '⭐', '🌟', '✨', '💫', '🌙', '☀️', '🌈'
  ];

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      this.pageId.set(id);
      await this.loadPage(id);
    }
  }

  private async loadPage(id: string) {
    this.loading.set(true);
    try {
      const page = await this.pageService.getByIdAsync(id);

      // Populate form
      this.form.title = page.title;
      this.form.icon = page.icon || '📄';
      this.form.category = page.category || '';
      this.form.publishStatus = page.publishStatus;

      // Tags
      this.tagsInput = page.tags?.join(', ') || '';

      // Content (convert Tiptap JSON to text for now)
      this.contentText = this.tiptapToText(page.content);
    } catch (error) {
      console.error('Failed to load page', error);
      alert('Failed to load page. Redirecting to page list.');
      await this.router.navigate(['/workspace/pages']);
    } finally {
      this.loading.set(false);
    }
  }

  async savePage() {
    if (!this.form.title.trim()) {
      alert('Please enter a title');
      return;
    }

    this.saving.set(true);
    try {
      const pageData = this.getPageData();

      if (this.pageId()) {
        // Update existing page
        await this.pageService.updateAsync(this.pageId()!, pageData);
      } else {
        // Create new page
        const newPage = await this.pageService.createAsync(pageData as CreatePageRequest);
        this.pageId.set(newPage.id);
        // Update URL without reloading
        this.router.navigate(['/workspace/pages', newPage.id], { replaceUrl: true });
      }

      // Show success (could use a toast notification service)
      console.log('Page saved successfully');
    } catch (error) {
      console.error('Failed to save page', error);
      alert('Failed to save page. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  async publishPage() {
    if (!this.pageId()) {
      // Save first if new page
      await this.savePage();
    }

    if (this.pageId()) {
      try {
        const slug = this.generateSlug(this.form.title);
        await this.pageService.publishAsync(this.pageId()!, { slug });
        this.form.publishStatus = 'published';
        alert('Page published successfully!');
      } catch (error) {
        console.error('Failed to publish page', error);
        alert('Failed to publish page. Please try again.');
      }
    }
  }

  async deletePage() {
    if (!this.pageId()) {
      await this.router.navigate(['/workspace/pages']);
      return;
    }

    if (confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      try {
        await this.pageService.deleteAsync(this.pageId()!);
        await this.router.navigate(['/workspace/pages']);
      } catch (error) {
        console.error('Failed to delete page', error);
        alert('Failed to delete page. Please try again.');
      }
    }
  }

  selectIcon(emoji: string) {
    this.form.icon = emoji;
    this.showIconPicker.set(false);
  }

  onTagsChange() {
    // Tags are processed when saving
  }

  private getPageData(): UpdatePageRequest | CreatePageRequest {
    const tags = this.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    return {
      title: this.form.title,
      icon: this.form.icon,
      category: this.form.category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      content: this.textToTiptap(this.contentText)
      // Note: publishStatus is not included in create/update requests
      // Publishing is handled through the separate publish endpoint
    };
  }

  /**
   * Convert plain text to Tiptap JSON format
   * TODO: This is a temporary solution. Replace with actual Tiptap editor.
   */
  private textToTiptap(text: string): any {
    const paragraphs = text.split('\n').filter(p => p.trim());

    return {
      type: 'doc',
      content: paragraphs.map(p => ({
        type: 'paragraph',
        content: [{ type: 'text', text: p }]
      }))
    };
  }

  /**
   * Convert Tiptap JSON to plain text
   * TODO: This is a temporary solution. Replace with actual Tiptap editor.
   */
  private tiptapToText(content: any): string {
    if (!content || !content.content) return '';

    return content.content
      .map((node: any) => {
        if (node.type === 'paragraph' && node.content) {
          return node.content
            .map((textNode: any) => textNode.text || '')
            .join('');
        }
        return '';
      })
      .join('\n');
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
