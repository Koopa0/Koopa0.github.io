import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ObsidianService, ObsidianImportResult } from '../../../core/services/obsidian.service';

/**
 * Obsidian Import Component
 *
 * Allows users to import their Obsidian vault as a ZIP file
 * Features:
 * - Drag & drop ZIP upload
 * - Import progress tracking
 * - Results display (imported, skipped, errors)
 * - Navigation to imported pages
 */
@Component({
  selector: 'app-obsidian-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      <div class="max-w-4xl mx-auto p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Import from Obsidian
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Upload a ZIP file containing your Obsidian vault's markdown files
            </p>
          </div>
          <button
            routerLink="/workspace/pages"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Pages
          </button>
        </div>

        <!-- Info Card -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex gap-3">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <h3 class="text-sm font-medium text-blue-900 dark:text-blue-100">
                What gets imported?
              </h3>
              <ul class="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ Markdown files (.md) with frontmatter</li>
                <li>✓ Wikilinks [[Page Name]] converted to internal links</li>
                <li>✓ Tags from frontmatter and #hashtags</li>
                <li>✓ Basic formatting (headings, lists, bold, italic, code)</li>
                <li>✗ Attachments/images (coming soon)</li>
                <li>✗ Plugins and custom syntax</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Upload Section -->
        @if (!importing() && !importResult()) {
          <div
            class="border-2 border-dashed rounded-lg p-12 text-center transition-colors"
            [class.border-gray-300]="!dragOver()"
            [class.dark:border-gray-700]="!dragOver()"
            [class.border-blue-500]="dragOver()"
            [class.dark:border-blue-400]="dragOver()"
            [class.bg-blue-50]="dragOver()"
            [class.dark:bg-blue-900/20]="dragOver()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <svg class="mx-auto w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>

            @if (selectedFile()) {
              <div class="mb-4">
                <p class="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {{ selectedFile()!.name }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatFileSize(selectedFile()!.size) }}
                </p>
              </div>
            } @else {
              <p class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Drag & drop your ZIP file here
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                or
              </p>
            }

            <label class="inline-block">
              <input
                type="file"
                accept=".zip"
                (change)="onFileSelected($event)"
                class="hidden"
              />
              <span class="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer inline-block transition-colors">
                Choose File
              </span>
            </label>

            @if (selectedFile()) {
              <div class="mt-6 flex justify-center gap-3">
                <button
                  (click)="startImport()"
                  class="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                >
                  Start Import
                </button>
                <button
                  (click)="clearFile()"
                  class="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            }
          </div>
        }

        <!-- Importing Progress -->
        @if (importing()) {
          <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Importing your vault...
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                This may take a few moments depending on the number of files
              </p>
            </div>
          </div>
        }

        <!-- Import Results -->
        @if (importResult() && !importing()) {
          <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            <!-- Success Header -->
            @if (importResult()!.success) {
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Import Completed
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Your Obsidian vault has been successfully imported
                  </p>
                </div>
              </div>
            } @else {
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Import Failed
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    There was an error importing your vault
                  </p>
                </div>
              </div>
            }

            <!-- Statistics -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                  {{ importResult()!.importedPages }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Imported
                </p>
              </div>
              <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                <p class="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {{ importResult()!.skippedFiles }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Skipped
                </p>
              </div>
              <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <p class="text-3xl font-bold text-red-600 dark:text-red-400">
                  {{ importResult()!.errors.length }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Errors
                </p>
              </div>
            </div>

            <!-- Errors -->
            @if (importResult()!.errors.length > 0) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 class="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Errors:
                </h4>
                <ul class="text-sm text-red-800 dark:text-red-200 space-y-1">
                  @for (error of importResult()!.errors; track error) {
                    <li>• {{ error }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                routerLink="/workspace/pages"
                class="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                View Imported Pages
              </button>
              <button
                (click)="resetImport()"
                class="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Import Another
              </button>
            </div>
          </div>
        }

        <!-- Help Section -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            How to export from Obsidian
          </h3>
          <ol class="space-y-3 text-gray-600 dark:text-gray-400">
            <li class="flex gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center">1</span>
              <span>Open your Obsidian vault folder in your file system</span>
            </li>
            <li class="flex gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center">2</span>
              <span>Select the files and folders you want to import</span>
            </li>
            <li class="flex gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center">3</span>
              <span>Right-click and select "Compress" (Mac) or "Send to > Compressed folder" (Windows)</span>
            </li>
            <li class="flex gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center">4</span>
              <span>Upload the resulting ZIP file here</span>
            </li>
          </ol>
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
export class ObsidianImportComponent {
  private obsidianService = inject(ObsidianService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  dragOver = signal(false);
  importing = signal(false);
  importResult = signal<ObsidianImportResult | null>(null);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        this.selectedFile.set(file);
      } else {
        alert('Please select a ZIP file');
      }
    }
  }

  clearFile() {
    this.selectedFile.set(null);
  }

  async startImport() {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.importing.set(true);

    try {
      const result = await this.obsidianService.importFromZip({
        file,
        preserveStructure: true
      });

      this.importResult.set(result);
    } catch (error: any) {
      this.importResult.set({
        success: false,
        importedPages: 0,
        skippedFiles: 0,
        errors: [error.message || 'Failed to import vault'],
        pageIds: []
      });
    } finally {
      this.importing.set(false);
    }
  }

  resetImport() {
    this.selectedFile.set(null);
    this.importResult.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
