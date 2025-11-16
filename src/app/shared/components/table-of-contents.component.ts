import { Component, Input, OnInit, OnDestroy, signal, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Table of Contents 組件
 *
 * 功能：
 * 1. 自動從 Markdown 內容中提取 H2/H3 標題生成目錄
 * 2. 使用 IntersectionObserver 追蹤當前閱讀位置並高亮對應標題
 * 3. 桌面版：左側 sticky 固定目錄，方便導航
 * 4. 行動版：可摺疊的目錄按鈕
 *
 * Angular 最佳實踐：
 * - 使用 Signal API 管理狀態 (toc, activeId, mobileTocOpen)
 * - 使用 inject() 函數注入依賴而非 constructor
 * - 實作 OnDestroy 清理 IntersectionObserver 避免記憶體洩漏
 * - 使用 isPlatformBrowser 確保 DOM 操作只在瀏覽器執行 (SSR 相容)
 * - 使用 OnPush Change Detection 提升性能（配合 Signal 使用）
 */
export interface TocItem {
  level: number;    // 標題層級 (2 = H2, 3 = H3)
  title: string;    // 標題文字
  id: string;       // 錨點 ID (從標題自動生成)
}

@Component({
  selector: 'app-table-of-contents',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  /** Markdown 文章內容 (從父組件傳入) */
  @Input() content: string = '';

  // Angular 依賴注入 - 使用 inject() 函數 (Angular 14+ 推薦方式)
  i18nService = inject(I18nService);
  private platformId = inject(PLATFORM_ID);
  currentLang = this.i18nService.currentLang;

  // Signals - Angular 16+ 的響應式狀態管理
  toc = signal<TocItem[]>([]);           // 目錄項目列表
  activeId = signal<string>('');         // 當前激活的標題 ID
  mobileTocOpen = signal(false);         // 行動版目錄展開狀態

  // IntersectionObserver 用於追蹤標題進入視窗
  private observer?: IntersectionObserver;
  private headingElements: Element[] = [];

  ngOnInit() {
    // 從 Markdown 內容提取標題生成目錄
    this.extractToc();

    // SSR 相容性：只在瀏覽器環境執行 DOM 操作
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    }
  }

  /**
   * 組件銷毀時清理資源
   * Angular 最佳實踐：避免記憶體洩漏
   */
  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * 從 Markdown 內容中提取標題生成目錄
   * 使用正則表達式匹配 Markdown 標題語法 (## Title, ### Subtitle)
   *
   * 重要修正：排除代碼塊內的標題，避免提取示例代碼中的標題
   */
  private extractToc() {
    // 先移除所有代碼塊（避免匹配到代碼塊內的標題）
    // 使用正則表達式移除 ```...``` 之間的內容
    const contentWithoutCodeBlocks = this.content.replace(/```[\s\S]*?```/g, '');

    // 正則表達式：匹配 Markdown 標題 (## 或 ### 開頭)
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const tocItems: TocItem[] = [];
    let match;

    // 逐一匹配所有標題（從移除代碼塊後的內容中提取）
    while ((match = headingRegex.exec(contentWithoutCodeBlocks)) !== null) {
      const level = match[1].length;      // 標題層級 (2 = ##, 3 = ###)
      const title = match[2].trim();       // 標題文字

      // 生成錨點 ID：小寫、空格轉連字號、移除特殊字符
      // 例如："Hello World!" → "hello-world"
      const id = this.generateId(title);

      // 只提取 H2 和 H3，保持目錄簡潔
      if (level === 2 || level === 3) {
        tocItems.push({ level, title, id });
      }
    }

    this.toc.set(tocItems);

    // 等待 DOM 渲染完成，然後為實際的 HTML 標題添加 ID
    // SSR 相容性：只在瀏覽器執行
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.addHeadingIds();
      }, 100);
    }
  }

  /**
   * 從標題文字生成 URL 友善的 ID
   * 支援中文、英文、數字
   */
  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')  // 保留英文、數字、中文，其他轉為 -
      .replace(/^-|-$/g, '');                     // 移除開頭和結尾的 -
  }

  /**
   * 為 DOM 中的標題元素添加 ID
   *
   * 重要修正：
   * 舊版本假設 DOM headings 和 toc 陣列順序完全一致，這是不可靠的！
   * 新版本：根據標題文字內容來匹配對應的 ID，更加穩健
   */
  private addHeadingIds() {
    if (!isPlatformBrowser(this.platformId)) return;

    // 找到文章內容區域
    const contentElement = document.querySelector('.prose');
    if (!contentElement) return;

    // 取得所有 H2 和 H3 標題元素
    const headings = contentElement.querySelectorAll('h2, h3');
    this.headingElements = Array.from(headings);

    // 根據標題文字內容匹配對應的 ID (而非依賴索引)
    this.headingElements.forEach((heading) => {
      const headingText = heading.textContent?.trim() || '';

      // 在 TOC 中找到對應的項目
      const tocItem = this.toc().find(item => item.title === headingText);

      if (tocItem) {
        // 設定標題的 ID，讓錨點導航可以正常工作
        heading.id = tocItem.id;
      }
    });
  }

  /**
   * 設置 IntersectionObserver 追蹤標題進入視窗
   *
   * IntersectionObserver 是瀏覽器原生 API，用於高效能地追蹤元素是否進入視窗
   * 相比傳統的 scroll 事件監聽，效能更好且更準確
   */
  private setupIntersectionObserver() {
    // 等待 DOM 完全渲染並且標題 ID 設置完成
    setTimeout(() => {
      const options = {
        // rootMargin: 從視窗頂部 80px 到底部 80% 的區域為觀察範圍
        // 這樣可以讓標題在接近視窗頂部時就被標記為激活
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0  // 只要元素進入觀察範圍就觸發
      };

      // 創建觀察器：當標題進入視窗時，更新 activeId
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 使用 Signal 的 set 方法更新狀態
            // Signal 會自動通知所有使用此狀態的地方重新渲染
            this.activeId.set(entry.target.id);
          }
        });
      }, options);

      // 觀察所有標題元素
      this.headingElements.forEach((heading) => {
        this.observer!.observe(heading);
      });
    }, 150);
  }

  /**
   * 點擊目錄項目時平滑滾動到對應標題
   * @param event - 點擊事件 (需要 preventDefault 避免錨點跳轉)
   * @param id - 目標標題的 ID
   */
  scrollToSection(event: Event, id: string) {
    // SSR 相容性檢查
    if (!isPlatformBrowser(this.platformId)) return;

    event.preventDefault();  // 阻止預設的錨點跳轉行為

    const element = document.getElementById(id);
    if (element) {
      // 計算滾動位置：考慮固定的 header 高度 (100px offset)
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      // 平滑滾動到目標位置
      window.scrollTo({ top: y, behavior: 'smooth' });

      // 手動設置激活狀態 (補充 IntersectionObserver 的延遲)
      this.activeId.set(id);
    }
  }

  /**
   * 切換行動版目錄展開/收合狀態
   * Signal.update() 接收一個函數，參數是當前值，返回新值
   */
  toggleMobileToc() {
    this.mobileTocOpen.update(v => !v);
  }

  /**
   * 關閉行動版目錄 (點擊項目後自動關閉)
   */
  closeMobileToc() {
    this.mobileTocOpen.set(false);
  }
}
