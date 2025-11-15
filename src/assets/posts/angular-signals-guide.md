---
title: "Angular Signals 完整指南"
date: "2025-11-15"
tags: ["google", "system"]
description: "深入探討 Angular 16+ 引入的 Signals API，了解如何使用 Signals 進行響應式狀態管理，以及 Signals 與 RxJS 的差異和使用時機。"
---

# Angular Signals 完整指南

Angular 16 引入了全新的響應式原語（Reactive Primitives）—— **Signals**，這是 Angular 框架在響應式程式設計方面的重大進展。本文將深入探討 Signals 的使用方式、最佳實踐，以及與 RxJS 的比較。

## 什麼是 Signals？

Signals 是一種追蹤狀態變化並自動更新相依項目的機制。當 Signal 的值改變時，所有使用該 Signal 的地方都會自動更新。

### 核心概念

```typescript
import { signal, computed, effect } from '@angular/core';

// 建立一個 Signal
const count = signal(0);

// 讀取 Signal 的值
console.log(count()); // 0

// 更新 Signal 的值
count.set(1);
count.update(value => value + 1);
```

## 三種主要的 Signal API

### 1. signal() - 可寫入的 Signal

`signal()` 建立一個可以讀取和修改的響應式值：

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <button (click)="increment()">+1</button>
      <button (click)="decrement()">-1</button>
      <button (click)="reset()">Reset</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.update(value => value + 1);
  }

  decrement() {
    this.count.update(value => value - 1);
  }

  reset() {
    this.count.set(0);
  }
}
```

### 2. computed() - 衍生的 Signal

`computed()` 建立一個基於其他 Signal 計算而來的值：

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-shopping-cart',
  template: `
    <div>
      <p>Items: {{ itemCount() }}</p>
      <p>Price per item: ${{ pricePerItem() }}</p>
      <p>Total: ${{ totalPrice() }}</p>
    </div>
  `
})
export class ShoppingCartComponent {
  itemCount = signal(3);
  pricePerItem = signal(10);

  // computed Signal 會自動追蹤依賴並更新
  totalPrice = computed(() =>
    this.itemCount() * this.pricePerItem()
  );
}
```

### 3. effect() - 副作用處理

`effect()` 用於執行副作用，當 Signal 變化時自動執行：

```typescript
import { Component, signal, effect } from '@angular/core';

@Component({
  selector: 'app-theme',
  template: `
    <button (click)="toggleTheme()">
      Current theme: {{ theme() }}
    </button>
  `
})
export class ThemeComponent {
  theme = signal<'light' | 'dark'>('dark');

  constructor() {
    // 當 theme Signal 改變時，自動更新 DOM
    effect(() => {
      const currentTheme = this.theme();
      document.body.classList.toggle('dark', currentTheme === 'dark');
      localStorage.setItem('theme', currentTheme);
      console.log(`Theme changed to: ${currentTheme}`);
    });
  }

  toggleTheme() {
    this.theme.update(current =>
      current === 'dark' ? 'light' : 'dark'
    );
  }
}
```

## Signals vs RxJS

### 何時使用 Signals？

✅ **適合 Signals 的場景：**

- 元件內部的本地狀態管理
- 簡單的衍生狀態（computed values）
- 同步的狀態更新
- 表單輸入的即時驗證

```typescript
// ✅ 使用 Signals
class UserFormComponent {
  email = signal('');
  password = signal('');

  isValid = computed(() =>
    this.email().includes('@') &&
    this.password().length >= 8
  );
}
```

### 何時使用 RxJS？

✅ **適合 RxJS 的場景：**

- HTTP 請求
- 複雜的非同步操作流
- 需要使用 operators（debounce、throttle、switchMap 等）
- 跨元件的事件流

```typescript
// ✅ 使用 RxJS
class SearchComponent {
  private http = inject(HttpClient);
  searchTerm$ = new Subject<string>();

  results$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.http.get(`/api/search?q=${term}`))
  );
}
```

## 混合使用 Signals 和 RxJS

在實際應用中，Signals 和 RxJS 可以完美配合：

```typescript
import { Component, signal, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-user-search',
  template: `
    <input
      [value]="searchTerm()"
      (input)="searchTerm.set($any($event.target).value)"
      placeholder="Search users..."
    >

    @if (loading()) {
      <p>Loading...</p>
    }

    @if (users(); as userList) {
      <ul>
        @for (user of userList; track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
    }
  `
})
export class UserSearchComponent {
  private http = inject(HttpClient);

  // Signal 作為輸入
  searchTerm = signal('');

  // 將 Signal 轉換為 Observable
  private searchTerm$ = toObservable(this.searchTerm);

  // 使用 RxJS operators 處理
  private users$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term =>
      term ? this.http.get<User[]>(`/api/users?q=${term}`) : []
    )
  );

  // 將 Observable 轉換回 Signal
  users = toSignal(this.users$, { initialValue: [] });
  loading = signal(false);
}
```

## 效能優化

### 1. Change Detection 優化

Signals 與 `OnPush` change detection 完美配合：

```typescript
@Component({
  selector: 'app-optimized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ data() }}</p>`
})
export class OptimizedComponent {
  data = signal('initial');

  // Signal 的變化會自動觸發 change detection
  updateData() {
    this.data.set('updated');
  }
}
```

### 2. 避免不必要的計算

使用 `computed()` 確保衍生值只在依賴變化時重新計算：

```typescript
class DataComponent {
  items = signal<Item[]>([]);
  filter = signal('');

  // ❌ 每次都重新計算
  get filteredItems() {
    return this.items().filter(item =>
      item.name.includes(this.filter())
    );
  }

  // ✅ 只在 items 或 filter 變化時計算
  filteredItems = computed(() =>
    this.items().filter(item =>
      item.name.includes(this.filter())
    )
  );
}
```

## 最佳實踐

### 1. 使用 Signals 管理狀態

```typescript
// ✅ 推薦
class UserService {
  private userSignal = signal<User | null>(null);
  readonly user = this.userSignal.asReadonly();

  updateUser(user: User) {
    this.userSignal.set(user);
  }
}
```

### 2. 使用 inject() 函數

```typescript
@Component({
  selector: 'app-modern'
})
export class ModernComponent {
  // ✅ 使用 inject() 函數
  private userService = inject(UserService);
  user = this.userService.user;
}
```

### 3. 避免在 effect() 中執行複雜邏輯

```typescript
// ❌ 避免
effect(() => {
  const data = this.complexComputation();
  this.processData(data);
  this.updateUI(data);
});

// ✅ 推薦
const processedData = computed(() => this.complexComputation());

effect(() => {
  const data = processedData();
  this.updateUI(data);
});
```

## 實際應用範例：主題服務

完整的 Signals 應用範例：

```typescript
import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // 私有的可寫 Signal
  private themeSignal = signal<Theme>('dark');

  // 公開的唯讀 Signal
  readonly theme = this.themeSignal.asReadonly();

  // 衍生狀態
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    if (this.isBrowser) {
      this.loadTheme();

      // 自動同步到 DOM 和 localStorage
      effect(() => {
        const currentTheme = this.theme();
        document.body.classList.toggle('dark', currentTheme === 'dark');
        localStorage.setItem('theme', currentTheme);
      });
    }
  }

  toggleTheme(): void {
    this.themeSignal.update(current =>
      current === 'dark' ? 'light' : 'dark'
    );
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  private loadTheme(): void {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      this.themeSignal.set(saved);
    }
  }
}
```

## 結論

Angular Signals 為狀態管理帶來了更簡潔、更高效的解決方案。主要優勢包括：

1. **更好的效能**：細粒度的響應式更新
2. **更簡單的 API**：相比 RxJS 更容易理解和使用
3. **更好的型別安全**：完整的 TypeScript 支援
4. **更少的樣板程式碼**：不需要手動訂閱/取消訂閱

記住這個簡單的原則：
- **Signals** 用於狀態管理
- **RxJS** 用於複雜的非同步操作
- 兩者可以完美配合使用

開始在您的 Angular 專案中使用 Signals，體驗更現代、更高效的開發方式！
