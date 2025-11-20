# 🎨 前端實作計畫

## 📋 概覽

基於現有的 Angular 20 Blog 專案，擴展為「Blog + Workspace」雙模式架構。

### 當前狀態
```
✅ 已完成:
- Angular 20 + SSR
- Blog 系統 (首頁、文章列表、文章詳情、系列、標籤)
- Markdown 渲染
- 多語系 (i18n)
- 主題切換
- 搜尋功能
- SEO 優化

🎯 需要新增:
- Workspace (私密知識庫)
- Tiptap 編輯器
- AI Chat
- Notion 整合
- 認證系統
```

## 🏗️ 新架構規劃

```
src/app/
├── blog/                       # 公開 Blog (已有)
│   ├── blog-list.component.ts
│   ├── blog-detail.component.ts
│   └── ...
│
├── workspace/                  # 🆕 私密 Workspace
│   ├── dashboard/
│   │   └── dashboard.component.ts
│   │
│   ├── pages/
│   │   ├── page-list.component.ts
│   │   ├── page-tree.component.ts
│   │   └── page-editor/
│   │       ├── editor.component.ts
│   │       ├── blocks/
│   │       └── extensions/
│   │
│   ├── ai-chat/
│   │   ├── chat-panel.component.ts
│   │   ├── chat-bubble.component.ts
│   │   └── citation-preview.directive.ts
│   │
│   ├── integrations/
│   │   ├── notion-sync.component.ts
│   │   └── export-dialog.component.ts
│   │
│   └── settings/
│       └── settings.component.ts
│
├── core/
│   ├── services/
│   │   ├── api.service.ts          # 🆕 HTTP 客戶端
│   │   ├── auth.service.ts         # 🆕 認證服務
│   │   ├── page.service.ts         # 🆕 頁面管理
│   │   ├── ai.service.ts           # 🆕 AI 服務
│   │   ├── notion.service.ts       # 🆕 Notion 整合
│   │   ├── mock.service.ts         # 🆕 Mock 資料服務
│   │   └── ... (已有的 services)
│   │
│   ├── guards/
│   │   └── auth.guard.ts           # 🆕 路由守衛
│   │
│   ├── interceptors/
│   │   ├── jwt.interceptor.ts      # 🆕 JWT 攔截器
│   │   ├── error.interceptor.ts    # 🆕 錯誤處理
│   │   └── mock.interceptor.ts     # 🆕 Mock 攔截器
│   │
│   └── models/
│       ├── page.model.ts           # 🆕
│       ├── user.model.ts           # 🆕
│       ├── chat.model.ts           # 🆕
│       └── ...
│
├── shared/
│   ├── components/
│   │   ├── header/                 # 需修改，加入登入按鈕
│   │   ├── sidebar/                # 🆕 Workspace 側邊欄
│   │   ├── modal/                  # 🆕 通用 Modal
│   │   └── ...
│   │
│   └── utils/
│       └── tiptap-helpers.ts       # 🆕 Tiptap 工具函數
│
└── app.routes.ts                   # 需修改，加入 workspace 路由
```

## 🎯 實作階段

### 階段 1: 基礎架構 (Week 1)

#### 1.1 環境配置

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',  // Golang API
  useMockApi: true,  // 🔑 Mock 開關

  // Feature flags
  features: {
    workspace: true,
    aiChat: true,
    notionIntegration: true,
  }
};
```

#### 1.2 API Service 架構

```typescript
// src/app/core/services/api.service.ts

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private useMock = environment.useMockApi;

  // Generic HTTP methods
  get<T>(endpoint: string, options?: any): Observable<T> {
    if (this.useMock) {
      return this.mockService.get<T>(endpoint);
    }
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options);
  }

  post<T>(endpoint: string, body: any, options?: any): Observable<T> {
    if (this.useMock) {
      return this.mockService.post<T>(endpoint, body);
    }
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options);
  }

  // ... patch, put, delete
}
```

#### 1.3 Mock Service

```typescript
// src/app/core/services/mock.service.ts

@Injectable({ providedIn: 'root' })
export class MockService {
  private mockData = inject(MockDataService);

  get<T>(endpoint: string): Observable<T> {
    // 解析 endpoint 並返回對應的 mock data
    return of(this.getMockData(endpoint)).pipe(
      delay(500)  // 模擬網路延遲
    );
  }

  private getMockData(endpoint: string): any {
    // /api/pages -> return mockData.pages
    // /api/pages/123 -> return mockData.pages[0]
    // /api/ai/chat -> return mockData.chatResponse

    if (endpoint.startsWith('/pages')) {
      return this.handlePagesEndpoint(endpoint);
    }
    // ... 其他 endpoints
  }
}
```

### 階段 2: 認證系統 (Week 1)

#### 2.1 Auth Service

```typescript
// src/app/core/services/auth.service.ts

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor() {
    // 從 localStorage 載入 token
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.tokenSignal.set(token);
      this.loadCurrentUser();
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/login', { email, password })
    );

    this.setAuth(response.token, response.user);
    this.router.navigate(['/workspace']);
  }

  async register(data: RegisterData): Promise<void> {
    const response = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/register', data)
    );

    this.setAuth(response.token, response.user);
    this.router.navigate(['/workspace']);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    this.tokenSignal.set(token);
    this.currentUserSignal.set(user);
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.api.get<User>('/users/me')
      );
      this.currentUserSignal.set(user);
    } catch {
      this.logout();
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }
}
```

#### 2.2 Auth Guard

```typescript
// src/app/core/guards/auth.guard.ts

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // 重定向到登入頁，並帶上返回 URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

#### 2.3 JWT Interceptor

```typescript
// src/app/core/interceptors/jwt.interceptor.ts

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
```

### 階段 3: Workspace 基礎 (Week 2)

#### 3.1 路由配置

```typescript
// src/app/app.routes.ts

export const routes: Routes = [
  // Blog routes (已有)
  { path: '', component: HomeComponent },
  { path: 'blog', component: BlogListComponent },
  { path: 'blog/:slug', component: BlogDetailComponent },
  // ...

  // Auth routes (新增)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Workspace routes (新增)
  {
    path: 'workspace',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'pages', component: PageListComponent },
      { path: 'pages/:id', component: PageEditorComponent },
      { path: 'ai-chat', component: AiChatComponent },
      { path: 'settings', component: SettingsComponent },
    ]
  },

  { path: '**', component: NotFoundComponent }
];
```

#### 3.2 Workspace Layout

```typescript
// src/app/workspace/layout/workspace-layout.component.ts

@Component({
  selector: 'app-workspace-layout',
  standalone: true,
  template: `
    <div class="workspace-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Knowledge Base</h2>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/workspace/dashboard" routerLinkActive="active">
            📊 Dashboard
          </a>
          <a routerLink="/workspace/pages" routerLinkActive="active">
            📄 Pages
          </a>
          <a routerLink="/workspace/ai-chat" routerLinkActive="active">
            🤖 AI Chat
          </a>
        </nav>

        <!-- Page Tree -->
        <div class="page-tree">
          <app-page-tree [pages]="pages()" />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet />
      </main>

      <!-- AI Chat Panel (可摺疊) -->
      @if (showAiChat()) {
        <aside class="ai-panel">
          <app-ai-chat-panel />
        </aside>
      }
    </div>
  `
})
export class WorkspaceLayoutComponent {
  private pageService = inject(PageService);

  pages = signal<Page[]>([]);
  showAiChat = signal(false);

  constructor() {
    this.loadPages();
  }

  private async loadPages() {
    const pages = await firstValueFrom(
      this.pageService.getAll()
    );
    this.pages.set(pages);
  }
}
```

### 階段 4: Tiptap 編輯器 (Week 2-3)

#### 4.1 安裝依賴

```bash
npm install @tiptap/core @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-placeholder
npm install @tiptap/extension-typography
npm install @tiptap/extension-code-block-lowlight
npm install lowlight
```

#### 4.2 編輯器元件

```typescript
// src/app/workspace/pages/page-editor/editor.component.ts

@Component({
  selector: 'app-page-editor',
  standalone: true,
  template: `
    <div class="editor-container">
      <!-- Title -->
      <input
        type="text"
        class="editor-title"
        placeholder="Untitled"
        [(ngModel)]="title"
        (input)="onTitleChange()"
      />

      <!-- Tiptap Editor -->
      <div class="editor-content" #editorElement></div>

      <!-- Toolbar -->
      <div class="editor-toolbar">
        <button (click)="editor?.chain().focus().toggleBold().run()">
          Bold
        </button>
        <button (click)="editor?.chain().focus().toggleItalic().run()">
          Italic
        </button>
        <!-- ... more buttons -->
      </div>
    </div>
  `
})
export class PageEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editorElement') editorElement!: ElementRef;

  private route = inject(ActivatedRoute);
  private pageService = inject(PageService);

  title = signal('');
  editor: Editor | null = null;

  ngOnInit() {
    this.initEditor();
    this.loadPage();
  }

  private initEditor() {
    this.editor = new Editor({
      element: this.editorElement.nativeElement,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: 'Start writing...',
        }),
        // ... more extensions
      ],
      content: '',
      onUpdate: () => {
        this.autoSave();
      },
    });
  }

  private async loadPage() {
    const id = this.route.snapshot.params['id'];
    if (id === 'new') {
      return;
    }

    const page = await firstValueFrom(
      this.pageService.getById(id)
    );

    this.title.set(page.title);
    this.editor?.commands.setContent(page.content);
  }

  private autoSave = debounce(() => {
    const content = this.editor?.getJSON();
    // Save to backend
  }, 1000);

  ngOnDestroy() {
    this.editor?.destroy();
  }
}
```

### 階段 5: Mock Data (Week 1)

```typescript
// src/app/core/services/mock-data.service.ts

@Injectable({ providedIn: 'root' })
export class MockDataService {

  // Mock Users
  users: User[] = [
    {
      id: '1',
      email: 'demo@example.com',
      username: 'demo',
      displayName: 'Demo User',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    }
  ];

  // Mock Pages
  pages: Page[] = [
    {
      id: '1',
      title: 'Getting Started',
      icon: '🚀',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Welcome!' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'This is your first note.' }]
          }
        ]
      },
      parentId: null,
      position: 0,
      publishStatus: 'draft',
      tags: ['tutorial'],
      category: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Golang Notes',
      icon: '🐹',
      content: { type: 'doc', content: [] },
      parentId: null,
      position: 1,
      publishStatus: 'draft',
      tags: ['golang', 'programming'],
      category: 'golang',
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    }
  ];

  // Mock Conversations
  conversations: Conversation[] = [
    {
      id: '1',
      title: 'Golang Basics',
      messages: [
        {
          role: 'user',
          content: 'What is Golang?',
          timestamp: '2025-01-01T00:00:00Z'
        },
        {
          role: 'assistant',
          content: 'Golang (Go) is a statically typed, compiled programming language... [1]',
          citations: [
            {
              number: 1,
              pageId: '2',
              pageTitle: 'Golang Notes'
            }
          ],
          followUps: [
            'What are the benefits of Go?',
            'How does Go handle concurrency?'
          ],
          timestamp: '2025-01-01T00:00:01Z'
        }
      ],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:01Z'
    }
  ];

  // Mock Auth Response
  getMockAuthResponse(email: string): AuthResponse {
    return {
      user: this.users[0],
      token: 'mock_jwt_token_' + Date.now(),
      refreshToken: 'mock_refresh_token'
    };
  }

  // Mock Chat Response
  getMockChatResponse(message: string): ChatResponse {
    return {
      conversationId: '1',
      message: `I understand you asked about "${message}". Based on your notes [1][2], here's what I found...`,
      citations: [
        { number: 1, pageId: '1', pageTitle: 'Getting Started' },
        { number: 2, pageId: '2', pageTitle: 'Golang Notes' }
      ],
      followUps: [
        'Tell me more about this',
        'Can you give an example?',
        'What are the alternatives?'
      ],
      tokensUsed: 150
    };
  }
}
```

## 📦 套件安裝清單

```bash
# Tiptap
npm install @tiptap/core @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-placeholder
npm install @tiptap/extension-typography
npm install @tiptap/extension-code-block-lowlight
npm install @tiptap/extension-image
npm install @tiptap/extension-link
npm install lowlight

# Utilities
npm install lodash-es
npm install @types/lodash-es --save-dev
npm install uuid
npm install @types/uuid --save-dev

# Icons (optional)
npm install lucide-angular

# Date utilities
npm install date-fns
```

## 🎨 UI 設計原則

### 配色方案

```scss
// Workspace 主題色
--workspace-primary: #3b82f6;      // 藍色
--workspace-secondary: #8b5cf6;    // 紫色
--workspace-accent: #10b981;       // 綠色

// Blog 保持原有配色
```

### 布局

```
┌─────────────────────────────────────────────────────┐
│  Workspace Header (Logo, Search, User Menu)        │
├──────────┬──────────────────────────────┬──────────┤
│          │                              │          │
│ Sidebar  │     Main Content             │ AI Panel │
│          │                              │ (可摺疊) │
│ - Nav    │  ┌────────────────────────┐  │          │
│ - Tree   │  │                        │  │          │
│          │  │   Editor / Dashboard   │  │          │
│          │  │                        │  │          │
│          │  └────────────────────────┘  │          │
│          │                              │          │
└──────────┴──────────────────────────────┴──────────┘
```

## 🔄 開發工作流

### 1. 功能開發流程

```
1. 使用 Mock API 開發 UI
2. 完成 UI 後保持 mock 模式測試
3. 後端 API 完成後，切換到真實 API
4. 聯調測試
5. 修正問題
```

### 2. Mock ↔ Real API 切換

只需修改 `environment.ts`:

```typescript
export const environment = {
  useMockApi: false,  // true = mock, false = real API
};
```

### 3. 開發優先順序

**Phase 1 (Week 1-2):**
- ✅ API Service 架構
- ✅ Mock Service 完整實作
- ✅ 認證系統 (含 Mock)
- ✅ Workspace Layout
- ✅ Dashboard 頁面

**Phase 2 (Week 3-4):**
- ✅ Tiptap 編輯器整合
- ✅ 頁面管理 (CRUD)
- ✅ 頁面樹狀結構
- ✅ 自動儲存

**Phase 3 (Week 5-6):**
- ✅ AI Chat UI
- ✅ SSE Streaming
- ✅ Citation 系統
- ✅ Follow-up 建議

**Phase 4 (Week 7-8):**
- ✅ Notion 整合 UI
- ✅ 同步狀態顯示
- ✅ 匯入/匯出對話框

**Phase 5 (Week 9+):**
- ✅ 發布工作流 UI
- ✅ SEO 設定介面
- ✅ 統計儀表板
- ✅ 進階功能

## 🧪 測試策略

### Mock Data 測試

每個功能先用 Mock 完整測試:
- UI 顯示正確
- 互動流程順暢
- 錯誤處理完善
- Loading 狀態處理

### 真實 API 測試

切換到真實 API 後:
- API 串接正確
- 錯誤處理
- 效能測試

## 📝 開發注意事項

1. **所有 API 呼叫都透過 ApiService**，不要直接用 HttpClient
2. **使用 Signals** 進行狀態管理，避免過度使用 RxJS
3. **保持元件簡潔**，複雜邏輯放到 Service
4. **Mock 資料要完整**，涵蓋各種情境（成功、失敗、空狀態）
5. **遵循 Angular 20 最佳實踐**（已有 ANGULAR_BEST_PRACTICES.md）

## 🚀 下一步

您想讓我開始實作哪個部分？

1. **API Service 架構** - 建立可切換 mock/real 的 HTTP 服務層
2. **認證系統** - Login/Register/Auth Guard
3. **Workspace Layout** - 基礎框架和路由
4. **Mock Data 服務** - 完整的 mock 資料

我建議從 **#1 API Service** 開始，因為這是基礎設施，其他功能都會用到。
