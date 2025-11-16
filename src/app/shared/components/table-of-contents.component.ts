import { Component, Input, OnInit, OnDestroy, signal, HostListener, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { I18nService } from '../../core/services/i18n.service';

export interface TocItem {
  level: number;
  title: string;
  id: string;
}

@Component({
  selector: 'app-table-of-contents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hidden lg:block sticky top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <nav class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h3 class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          {{ currentLang() === 'zh-TW' ? '目錄' : 'Table of Contents' }}
        </h3>

        <ul class="space-y-2 text-sm">
          @for (item of toc(); track item.id) {
            <li [style.margin-left]="((item.level - 2) * 16) + 'px'">
              <a
                [href]="'#' + item.id"
                (click)="scrollToSection($event, item.id)"
                [class.active]="activeId() === item.id"
                class="block py-1.5 px-3 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 line-clamp-2"
                [class.text-blue-600]="activeId() === item.id"
                [class.dark:text-blue-400]="activeId() === item.id"
                [class.bg-blue-50]="activeId() === item.id"
                [class.dark:bg-gray-800]="activeId() === item.id"
                [class.font-medium]="activeId() === item.id"
                [class.border-l-2]="activeId() === item.id"
                [class.border-blue-600]="activeId() === item.id"
                [class.dark:border-blue-400]="activeId() === item.id"
              >
                {{ item.title }}
              </a>
            </li>
          }
        </ul>
      </nav>
    </div>

    <!-- Mobile TOC (Collapsible) -->
    <div class="lg:hidden mb-8">
      <button
        (click)="toggleMobileToc()"
        class="w-full flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <span class="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          {{ currentLang() === 'zh-TW' ? '目錄' : 'Table of Contents' }}
        </span>
        <svg
          class="w-5 h-5 transition-transform duration-300"
          [class.rotate-180]="mobileTocOpen()"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      @if (mobileTocOpen()) {
        <div class="mt-2 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl">
          <ul class="space-y-2 text-sm">
            @for (item of toc(); track item.id) {
              <li [style.margin-left]="((item.level - 2) * 12) + 'px'">
                <a
                  [href]="'#' + item.id"
                  (click)="scrollToSection($event, item.id); closeMobileToc()"
                  [class.active]="activeId() === item.id"
                  class="block py-1.5 px-3 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200"
                  [class.text-blue-600]="activeId() === item.id"
                  [class.dark:text-blue-400]="activeId() === item.id"
                  [class.bg-blue-50]="activeId() === item.id"
                  [class.dark:bg-gray-800]="activeId() === item.id"
                  [class.font-medium]="activeId() === item.id"
                >
                  {{ item.title }}
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Custom scrollbar for TOC */
    nav::-webkit-scrollbar {
      width: 6px;
    }

    nav::-webkit-scrollbar-track {
      background: transparent;
    }

    nav::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }

    nav::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    .dark nav::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }

    .dark nav::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class TableOfContentsComponent implements OnInit, OnDestroy {
  @Input() content: string = '';

  i18nService = inject(I18nService);
  private platformId = inject(PLATFORM_ID);
  currentLang = this.i18nService.currentLang;

  toc = signal<TocItem[]>([]);
  activeId = signal<string>('');
  mobileTocOpen = signal(false);

  private observer?: IntersectionObserver;
  private headingElements: Element[] = [];

  ngOnInit() {
    this.extractToc();
    // Only run in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private extractToc() {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const tocItems: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(this.content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      // Create ID from title (lowercase, replace spaces with hyphens)
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-|-$/g, '');

      // Only include H2 and H3 for cleaner TOC
      if (level === 2 || level === 3) {
        tocItems.push({ level, title, id });
      }
    }

    this.toc.set(tocItems);

    // Wait for DOM to render, then add IDs to headings (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.addHeadingIds();
      }, 100);
    }
  }

  private addHeadingIds() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Find all headings in the markdown content
    const contentElement = document.querySelector('.prose');
    if (!contentElement) return;

    const headings = contentElement.querySelectorAll('h2, h3');
    this.headingElements = Array.from(headings);

    this.headingElements.forEach((heading, index) => {
      const tocItem = this.toc()[index];
      if (tocItem) {
        heading.id = tocItem.id;
      }
    });
  }

  private setupIntersectionObserver() {
    // Wait for headings to be available
    setTimeout(() => {
      const options = {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeId.set(entry.target.id);
          }
        });
      }, options);

      this.headingElements.forEach((heading) => {
        this.observer!.observe(heading);
      });
    }, 150);
  }

  scrollToSection(event: Event, id: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    event.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      this.activeId.set(id);
    }
  }

  toggleMobileToc() {
    this.mobileTocOpen.update(v => !v);
  }

  closeMobileToc() {
    this.mobileTocOpen.set(false);
  }
}
