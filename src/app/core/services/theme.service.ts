import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * ============================================================================
 * Theme Service
 * ============================================================================
 *
 * 1. **Signals 用於狀態管理**
 *    - 使用 signal() 管理主題狀態
 *    - 相比 BehaviorSubject，Signals 提供更好的效能和類型安全
 *    - Signals 是 Angular 未來的核心響應式原語
 *
 * 2. **inject() 函數注入**
 *    - 使用 inject() 取代建構子注入
 *    - 更簡潔、更靈活的依賴注入方式
 *
 * 3. **effect() 副作用處理**
 *    - 使用 effect() 監聽 signal 變化並執行副作用
 *    - 自動追蹤依賴，不需手動訂閱/取消訂閱
 *
 * 4. **平台檢測（SSR 支援）**
 *    - 使用 isPlatformBrowser 確保瀏覽器特定 API 只在客戶端執行
 *    - 避免 SSR 環境中的 localStorage、window 錯誤
 *
 * 5. **TypeScript 嚴格模式**
 *    - 使用明確的型別定義（Theme type）
 *    - 提供良好的型別推導和自動完成
 *
 * @example
 * ```typescript
 * // 在元件中使用
 * export class MyComponent {
 *   themeService = inject(ThemeService);
 *
 *   // 讀取當前主題（響應式）
 *   currentTheme = this.themeService.theme;
 *
 *   // 切換主題
 *   toggle() {
 *     this.themeService.toggleTheme();
 *   }
 * }
 * ```
 */

/**
 * 主題類型定義
 * 使用 type 而非 enum 提供更好的樹搖優化
 */
export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root' // 單例服務，整個應用共用
})
export class ThemeService {
  // ========== 依賴注入 ==========
  // 使用 inject() 函數注入，這是 Angular 2025 的推薦方式
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ========== 狀態管理 ==========
  /**
   * 主題狀態 Signal
   *
   * 為什麼使用 Signal 而非 RxJS BehaviorSubject？
   * 1. 更好的效能：Signal 使用細粒度的變更檢測
   * 2. 更簡潔的 API：不需要 subscribe/unsubscribe
   * 3. 更好的型別安全：編譯時型別檢查
   * 4. 與 Angular 的變更檢測深度整合
   *
   * 何時使用 RxJS？
   * - HTTP 請求（已經是 Observable）
   * - 複雜的非同步操作流
   * - 需要 operators（map, filter, debounce 等）的場景
   */
  readonly theme = signal<Theme>('dark');

  constructor() {
    /**
     * SSR 支援：只在瀏覽器環境中執行
     * 這避免了伺服器端渲染時存取 localStorage、window 等瀏覽器 API
     */
    if (this.isBrowser) {
      this.loadTheme();

      /**
       * effect() 示範：響應式副作用
       *
       * 當 theme Signal 變化時，自動執行副作用
       * 不需要手動 subscribe/unsubscribe
       * Angular 會自動管理 effect 的生命週期
       */
      effect(() => {
        const currentTheme = this.theme();
        this.applyTheme(currentTheme);
      }, {
        // allowSignalWrites: false 是預設值
        // 在 effect 中修改 signal 需要特別註明
      });
    }
  }

  // ========== 公開 API ==========

  /**
   * 切換主題（深色 ↔ 淺色）
   *
   * 使用 update() 方法基於當前值計算新值
   * 這是 Signal 的推薦寫法，確保原子性操作
   */
  toggleTheme(): void {
    this.theme.update(current => current === 'dark' ? 'light' : 'dark');
  }

  /**
   * 設定特定主題
   *
   * 使用 set() 方法直接設定新值
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  // ========== 私有方法 ==========

  /**
   * 從 localStorage 或系統偏好載入主題
   *
   * 最佳實踐：
   * 1. 優先使用使用者設定（localStorage）
   * 2. 回退到系統偏好（prefers-color-scheme）
   * 3. 最後使用預設值（dark）
   */
  private loadTheme(): void {
    if (!this.isBrowser) return;

    try {
      // 1. 檢查 localStorage
      const savedTheme = localStorage.getItem('theme');

      // Validate saved theme is a valid Theme value
      if (savedTheme === 'dark' || savedTheme === 'light') {
        this.theme.set(savedTheme);
      } else {
        // 2. 檢查系統偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme.set(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Fallback to default dark theme
      this.theme.set('dark');
    }
  }

  /**
   * 應用主題到 DOM 並持久化
   *
   * 副作用處理：
   * 1. 更新 DOM（body class）
   * 2. 持久化到 localStorage
   *
   * 注意：這個方法由 effect() 自動調用，不需要手動呼叫
   */
  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    try {
      const body = document.body;

      // 移除所有主題 class，避免衝突
      body.classList.remove('dark', 'light');

      // 添加當前主題 class
      // Tailwind CSS 會根據這個 class 應用對應的樣式
      body.classList.add(theme);

      // 持久化到 localStorage，下次訪問時記住使用者偏好
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }
}

/**
 * ============================================================================
 * 學習重點總結
 * ============================================================================
 *
 * 1. **Signals vs RxJS**
 *    ✓ 組件狀態 → Signals
 *    ✓ HTTP 請求 → RxJS Observable
 *    ✓ 事件流處理 → RxJS Observable
 *
 * 2. **inject() vs Constructor Injection**
 *    ✓ 新程式碼使用 inject()
 *    ✓ 更靈活，可在函數中使用
 *    ✓ 更簡潔的程式碼
 *
 * 3. **effect() 的使用時機**
 *    ✓ 執行副作用（DOM 操作、localStorage）
 *    ✓ 不要在 effect 中修改 signal（除非明確標記）
 *    ✓ Angular 自動管理清理
 *
 * 4. **SSR 最佳實踐**
 *    ✓ 使用 isPlatformBrowser 保護瀏覽器 API
 *    ✓ 避免在 constructor 中執行瀏覽器特定程式碼
 *    ✓ 提供合理的預設值
 *
 * 5. **型別安全**
 *    ✓ 使用 TypeScript 的 type 定義
 *    ✓ readonly 保護公開的 signal
 *    ✓ 明確的返回型別
 */
