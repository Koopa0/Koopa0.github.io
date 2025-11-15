# Angular 2025 最佳實踐指南

本專案作為 Angular v20 最佳實踐的參考實作，展示了現代 Angular 開發的推薦模式與技術。

## 目錄

1. [Signals vs RxJS](#signals-vs-rxjs)
2. [依賴注入](#依賴注入)
3. [元件架構](#元件架構)
4. [狀態管理](#狀態管理)
5. [SSR 支援](#ssr-支援)
6. [效能優化](#效能優化)
7. [型別安全](#型別安全)
8. [專案結構](#專案結構)

---

## Signals vs RxJS

### 何時使用 Signals

**適用場景：**
- 元件本地狀態
- 衍生狀態（computed values）
- 簡單的響應式數據
- UI 狀態管理

**範例：**
```typescript
// ✅ 正確：使用 Signal 管理元件狀態
export class ThemeService {
  readonly theme = signal<Theme>('dark');

  toggleTheme(): void {
    this.theme.update(current => current === 'dark' ? 'light' : 'dark');
  }
}

// ✅ 使用 computed 衍生狀態
export class UserComponent {
  private userService = inject(UserService);

  user = this.userService.currentUser;
  userName = computed(() => this.user()?.name ?? '訪客');
  isAdmin = computed(() => this.user()?.role === 'admin');
}
```

### 何時使用 RxJS

**適用場景：**
- HTTP 請求（Angular HttpClient 回傳 Observable）
- 複雜的非同步操作流
- 需要使用 RxJS operators（map, filter, debounce 等）
- WebSocket 連接
- 事件流處理

**範例：**
```typescript
// ✅ 正確：HTTP 請求使用 RxJS
export class PostService {
  private http = inject(HttpClient);

  loadPost(id: string): Observable<Post> {
    return this.http.get<Post>(`/api/posts/${id}`).pipe(
      map(post => this.transformPost(post)),
      catchError(error => {
        console.error('載入文章失敗', error);
        return of(null);
      })
    );
  }
}

// ✅ 正確：搜尋功能使用 RxJS operators
export class SearchComponent {
  searchTerm = signal('');

  results$ = toObservable(this.searchTerm).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.searchService.search(term))
  );
}
```

### Signals 與 RxJS 的互操作性

```typescript
// Signal → Observable
import { toObservable } from '@angular/core/rxjs-interop';

const signal = signal(0);
const observable$ = toObservable(signal);

// Observable → Signal
import { toSignal } from '@angular/core/rxjs-interop';

const observable$ = this.http.get('/api/data');
const signal = toSignal(observable$, { initialValue: null });
```

---

## 依賴注入

### 使用 inject() 函數

Angular 2025 推薦使用 `inject()` 函數進行依賴注入，而非建構子注入。

**優點：**
- 更簡潔的程式碼
- 可在建構子外使用
- 更好的樹搖優化
- 支援功能性程式設計風格

**範例：**
```typescript
// ✅ 推薦：使用 inject()
export class MyComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // 可選的依賴
  private readonly logger = inject(Logger, { optional: true });
}

// ❌ 舊寫法：建構子注入
export class OldComponent {
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    @Optional() private logger?: Logger
  ) {}
}
```

### 自訂注入函數

```typescript
// 建立可重用的注入函數
export function injectCurrentUser() {
  const userService = inject(UserService);
  return computed(() => userService.currentUser());
}

// 在元件中使用
export class ProfileComponent {
  user = injectCurrentUser();
}
```

---

## 元件架構

### Standalone Components

所有新元件都應使用 standalone 模式。

**範例：**
```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,  // ✅ 獨立元件
  imports: [         // 直接匯入需要的模組
    CommonModule,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  // 使用 inject() 注入服務
  private readonly router = inject(Router);

  // 使用 signal 管理狀態
  count = signal(0);

  // 使用 computed 衍生狀態
  doubleCount = computed(() => this.count() * 2);

  increment(): void {
    this.count.update(n => n + 1);
  }
}
```

### 元件命名規範

Angular 2025 更新的命名規範：

```typescript
// ✅ 新規範：不使用後綴
// 檔案名稱：home.ts
export class Home { }

// ✅ 或保持 component 後綴（本專案採用）
// 檔案名稱：home.component.ts
export class HomeComponent { }

// 建議：保持一致性，選擇一種風格並全專案使用
```

---

## 狀態管理

### Signal 最佳實踐

```typescript
export class CounterComponent {
  // ✅ readonly 保護 signal 不被外部直接修改
  readonly count = signal(0);

  // ✅ 使用 computed 計算衍生值
  readonly isEven = computed(() => this.count() % 2 === 0);

  // ✅ 使用 update 基於當前值更新
  increment(): void {
    this.count.update(n => n + 1);
  }

  // ✅ 使用 set 直接設定新值
  reset(): void {
    this.count.set(0);
  }
}
```

### Effect 使用指南

```typescript
export class ThemeComponent {
  theme = signal<Theme>('dark');

  constructor() {
    // ✅ effect 用於副作用
    effect(() => {
      const currentTheme = this.theme();
      document.body.className = currentTheme;
      localStorage.setItem('theme', currentTheme);
    });
  }

  // ❌ 避免：不要在 effect 中修改 signal
  // effect(() => {
  //   this.theme.set('light'); // 可能造成無限迴圈
  // });
}
```

---

## SSR 支援

### 平台檢測

```typescript
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

export class MyService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  loadData(): void {
    // ✅ 保護瀏覽器特定 API
    if (this.isBrowser) {
      const data = localStorage.getItem('key');
      // ...
    }
  }
}
```

### SSR 最佳實踐

```typescript
// ✅ 提供伺服器端安全的預設值
export class DataService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  data = signal(this.getInitialData());

  private getInitialData() {
    // SSR 環境返回安全的預設值
    if (!this.isBrowser) {
      return { items: [] };
    }

    // 瀏覽器環境可以存取 localStorage
    const cached = localStorage.getItem('data');
    return cached ? JSON.parse(cached) : { items: [] };
  }
}
```

---

## 效能優化

### OnPush 變更檢測

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-my-component',
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ 效能優化
  standalone: true,
  template: `...`
})
export class MyComponent {
  // Signals 自動觸發 OnPush 檢測
  count = signal(0);
}
```

### 懶加載路由

```typescript
// ✅ 使用 loadComponent 進行懶加載
export const routes: Routes = [
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/blog-list.component')
      .then(m => m.BlogListComponent)
  }
];
```

### TrackBy 函數

```typescript
@Component({
  template: `
    @for (item of items(); track trackById) {
      <div>{{ item.name }}</div>
    }
  `
})
export class ListComponent {
  items = signal<Item[]>([]);

  // ✅ 提供 trackBy 函數提升效能
  trackById(index: number, item: Item): string {
    return item.id;
  }
}
```

---

## 型別安全

### 嚴格型別定義

```typescript
// ✅ 明確的型別定義
export type Theme = 'dark' | 'light';
export type Language = 'zh-TW' | 'en';

export interface Post {
  id: string;
  title: string;
  content: string;
  tags: readonly string[];  // readonly 防止意外修改
  publishedAt: Date;
}

// ✅ 使用 readonly 保護 signal
export class PostService {
  readonly posts = signal<readonly Post[]>([]);
}
```

### Typed Forms

```typescript
import { FormControl, FormGroup } from '@angular/forms';

// ✅ Angular 2025 預設使用 typed forms
interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

export class LoginComponent {
  form = new FormGroup<LoginForm>({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true })
  });

  onSubmit(): void {
    const value = this.form.value;
    // TypeScript 知道 value.email 和 value.password 的型別
  }
}
```

---

## 專案結構

### 推薦的目錄結構

```
src/app/
├── core/                    # 核心功能（單例服務）
│   ├── services/
│   │   ├── theme.service.ts
│   │   ├── i18n.service.ts
│   │   └── auth.service.ts
│   ├── guards/
│   └── interceptors/
│
├── shared/                  # 共用元件與工具
│   ├── components/
│   │   ├── header/
│   │   └── footer/
│   ├── directives/
│   ├── pipes/
│   └── utils/
│
├── features/                # 功能模組
│   ├── home/
│   │   └── home.component.ts
│   ├── blog/
│   │   ├── blog-list.component.ts
│   │   └── blog-post.component.ts
│   └── auth/
│       ├── login.component.ts
│       └── register.component.ts
│
├── app.component.ts         # 根元件
├── app.routes.ts            # 路由配置
└── app.config.ts            # 應用配置
```

### 檔案命名規範

```
✅ 推薦的命名：
- 元件：user-profile.component.ts
- 服務：user.service.ts
- 指令：highlight.directive.ts
- Pipe：date-format.pipe.ts

❌ 避免：
- 過於通用：utils.ts, helpers.ts
- 不明確：data.ts, common.ts
```

---

## 程式碼品質

### ESLint 配置

確保使用 Angular ESLint 推薦規則：

```json
{
  "extends": [
    "plugin:@angular-eslint/recommended",
    "plugin:@angular-eslint/template/process-inline-templates"
  ],
  "rules": {
    "@angular-eslint/directive-selector": [
      "error",
      { "type": "attribute", "prefix": "app", "style": "camelCase" }
    ],
    "@angular-eslint/component-selector": [
      "error",
      { "type": "element", "prefix": "app", "style": "kebab-case" }
    ]
  }
}
```

### 註解規範

```typescript
/**
 * 載入使用者資料
 *
 * @param userId - 使用者 ID
 * @returns Observable，包含使用者資料或 null（載入失敗時）
 *
 * @example
 * ```typescript
 * this.userService.loadUser('123').subscribe(user => {
 *   console.log(user);
 * });
 * ```
 */
loadUser(userId: string): Observable<User | null> {
  return this.http.get<User>(`/api/users/${userId}`).pipe(
    catchError(() => of(null))
  );
}
```

---

## 延伸閱讀

- [Angular 官方文件](https://angular.dev)
- [Angular Signals 指南](https://angular.dev/guide/signals)
- [Angular 風格指南](https://angular.dev/style-guide)
- [RxJS 官方文件](https://rxjs.dev)

---

## 學習資源

本專案的各個服務和元件都包含詳細的註解和說明，建議按以下順序學習：

1. `src/app/core/services/theme.service.ts` - Signal 基礎用法
2. `src/app/core/services/i18n.service.ts` - Signal + RxJS 整合
3. `src/app/shared/components/header/header.component.ts` - 元件最佳實踐
4. `src/app/features/home/home.component.ts` - 完整的元件範例

每個檔案都包含：
- 為什麼這樣寫的解釋
- 最佳實踐說明
- 常見錯誤提醒
- 使用範例

---

最後更新：2025-11-15
