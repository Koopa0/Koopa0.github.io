# Obsidian 整合提案

## 概述

Obsidian 是一個強大的本地優先 (Local-first) 知識管理工具，使用純 Markdown 格式。整合 Obsidian 可以讓使用者：

1. **匯入現有的 Obsidian vault** 到我們的平台
2. **雙向同步**：在 Obsidian 和我們的平台之間同步內容
3. **保持 Markdown 兼容性**：使用標準 Markdown + Obsidian 擴展語法
4. **利用雙向連結**：支援 [[wikilink]] 語法
5. **知識圖譜**：視覺化頁面之間的連結關係

---

## Obsidian 核心特性

### 1. Markdown 格式
- **純文字檔案**：所有筆記都是 `.md` 檔案
- **Frontmatter**：YAML 格式的 metadata
- **本地儲存**：檔案存在本地檔案系統

### 2. 雙向連結 (Backlinks)
```markdown
這是一個連結到 [[另一個頁面]] 的範例。
還可以使用別名：[[頁面名稱|顯示文字]]
```

### 3. 標籤系統
```markdown
#技術 #教學 #golang

也支援巢狀標籤：#技術/後端/golang
```

### 4. Frontmatter (YAML)
```yaml
---
title: 頁面標題
tags: [golang, tutorial]
created: 2025-01-21
updated: 2025-01-21
aliases: [別名1, 別名2]
---
```

### 5. 嵌入內容
```markdown
![[其他頁面]]  # 嵌入整個頁面
![[頁面#標題]]  # 嵌入特定章節
![[image.png]] # 嵌入圖片
```

---

## 整合策略

### 方案 A：檔案系統同步 (推薦)

**概念**：直接讀取使用者的 Obsidian vault 資料夾

**優點**：
- ✅ 真正的雙向同步
- ✅ 保持 Obsidian 為單一真實來源
- ✅ 即時更新
- ✅ 不需要複雜的轉換

**實作方式**：

1. **後端 File Watcher**
```go
// Golang 後端監聽 Obsidian vault 變更
type ObsidianVault struct {
    Path string
    Watcher *fsnotify.Watcher
}

func (v *ObsidianVault) Watch() {
    for {
        select {
        case event := <-v.Watcher.Events:
            if event.Op&fsnotify.Write == fsnotify.Write {
                v.handleFileChange(event.Name)
            }
        }
    }
}
```

2. **Markdown 解析器**
```go
func ParseObsidianMarkdown(content string) (*Page, error) {
    // 1. 解析 Frontmatter
    frontmatter := ParseFrontmatter(content)

    // 2. 轉換 [[wikilink]] 為內部連結
    body := ConvertWikilinks(content)

    // 3. 處理標籤
    tags := ExtractTags(content)

    // 4. 轉換為 Tiptap JSON
    tiptapContent := MarkdownToTiptap(body)

    return &Page{
        Title: frontmatter.Title,
        Content: tiptapContent,
        Tags: tags,
        // ...
    }
}
```

3. **雙向同步**
```go
// Obsidian → Platform
func SyncFromObsidian(vaultPath string) {
    files := ScanMarkdownFiles(vaultPath)
    for _, file := range files {
        page := ParseObsidianMarkdown(file.Content)
        db.Upsert(page)
    }
}

// Platform → Obsidian
func SyncToObsidian(page *Page, vaultPath string) {
    markdown := TiptapToMarkdown(page.Content)
    markdown = AddFrontmatter(markdown, page)
    WriteFile(vaultPath + "/" + page.Title + ".md", markdown)
}
```

### 方案 B：匯入/匯出工具

**概念**：提供工具讓使用者手動匯入/匯出

**優點**：
- ✅ 簡單實作
- ✅ 不需要檔案系統存取
- ✅ 更安全（使用者控制）

**實作方式**：

1. **ZIP 匯入**
   - 使用者上傳 Obsidian vault 的 ZIP 檔案
   - 後端解壓縮並解析所有 `.md` 檔案
   - 批量匯入到系統

2. **單檔匯入**
   - 拖放 `.md` 檔案到編輯器
   - 即時轉換並預覽

3. **匯出為 Obsidian 格式**
   - 將頁面匯出為標準 Markdown
   - 保留 frontmatter 和 wikilinks
   - 打包為 ZIP 下載

---

## 資料轉換

### 1. Frontmatter → Page Model

```typescript
// Obsidian Frontmatter
---
title: Golang 學習筆記
tags: [golang, backend, tutorial]
created: 2025-01-21T10:00:00
updated: 2025-01-21T15:30:00
aliases: [Go語言, Go教學]
category: 技術
---

// 轉換為
{
  title: "Golang 學習筆記",
  tags: ["golang", "backend", "tutorial"],
  category: "技術",
  createdAt: "2025-01-21T10:00:00Z",
  updatedAt: "2025-01-21T15:30:00Z",
  metadata: {
    aliases: ["Go語言", "Go教學"]
  }
}
```

### 2. Wikilink → Internal Link

```markdown
<!-- Obsidian -->
[[另一個頁面]]
[[頁面#標題]]
[[頁面|顯示文字]]

<!-- 轉換為 Tiptap -->
<a href="/workspace/pages/{pageId}">另一個頁面</a>
<a href="/workspace/pages/{pageId}#標題">頁面</a>
<a href="/workspace/pages/{pageId}">顯示文字</a>
```

### 3. Tag 語法

```markdown
<!-- Obsidian -->
#技術 #golang #後端

<!-- 解析為 -->
tags: ["技術", "golang", "後端"]

<!-- 支援巢狀 -->
#技術/程式語言/golang
→ tags: ["技術", "程式語言", "golang"]
```

### 4. 嵌入內容

```markdown
<!-- Obsidian -->
![[其他頁面]]

<!-- 轉換為 -->
<div class="embedded-page">
  <!-- 嵌入其他頁面的內容 -->
</div>
```

---

## 資料庫 Schema 擴展

```sql
-- 新增 Obsidian 同步設定表
CREATE TABLE obsidian_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    vault_name VARCHAR(255) NOT NULL,
    vault_path TEXT,  -- 本地路徑（如果使用檔案系統同步）
    sync_enabled BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional',  -- 'from_obsidian', 'to_obsidian', 'bidirectional'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 頁面別名表（支援 Obsidian aliases）
CREATE TABLE page_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(page_id, alias)
);

CREATE INDEX idx_page_aliases_alias ON page_aliases(alias);

-- 雙向連結表
CREATE TABLE page_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    target_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    target_title VARCHAR(255),  -- 如果目標頁面不存在
    link_type VARCHAR(20) DEFAULT 'wikilink',  -- 'wikilink', 'embed', 'external'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_page_id, target_page_id)
);

CREATE INDEX idx_page_links_source ON page_links(source_page_id);
CREATE INDEX idx_page_links_target ON page_links(target_page_id);

-- 擴展 pages 表
ALTER TABLE pages ADD COLUMN obsidian_file_path TEXT;
ALTER TABLE pages ADD COLUMN original_markdown TEXT;  -- 保留原始 Markdown
ALTER TABLE pages ADD COLUMN aliases TEXT[];  -- PostgreSQL array
```

---

## API 設計

### 1. Vault 管理

```typescript
// POST /api/obsidian/vaults
interface CreateVaultRequest {
  vaultName: string;
  vaultPath?: string;  // 本地路徑（檔案系統同步）
  syncDirection: 'from_obsidian' | 'to_obsidian' | 'bidirectional';
}

// GET /api/obsidian/vaults
interface VaultListResponse {
  vaults: ObsidianVault[];
}

// DELETE /api/obsidian/vaults/:id
// 解除 vault 連結（不刪除實際檔案）
```

### 2. 匯入/匯出

```typescript
// POST /api/obsidian/import
// Content-Type: multipart/form-data
interface ImportRequest {
  file: File;  // ZIP 檔案或單個 .md 檔案
  targetFolder?: string;
  overwriteExisting: boolean;
}

interface ImportResponse {
  importedPages: number;
  skippedPages: number;
  errors: string[];
  pages: Page[];
}

// POST /api/obsidian/export
interface ExportRequest {
  pageIds: string[];  // 要匯出的頁面
  includeAttachments: boolean;
  format: 'zip' | 'folder';
}

// 回傳 ZIP 檔案或資料夾結構
```

### 3. 同步

```typescript
// POST /api/obsidian/sync/:vaultId
interface SyncRequest {
  direction?: 'from_obsidian' | 'to_obsidian' | 'bidirectional';
  dryRun?: boolean;  // 預覽變更
}

interface SyncResponse {
  changes: {
    created: number;
    updated: number;
    deleted: number;
  };
  conflicts: ConflictInfo[];  // 需要手動解決的衝突
  details: SyncDetail[];
}
```

### 4. 雙向連結

```typescript
// GET /api/pages/:id/backlinks
interface BacklinksResponse {
  backlinks: {
    pageId: string;
    pageTitle: string;
    linkType: 'wikilink' | 'embed';
    context: string;  // 連結周圍的文字
  }[];
  total: number;
}

// GET /api/pages/:id/graph
// 回傳知識圖譜資料（用於視覺化）
interface GraphResponse {
  nodes: {
    id: string;
    title: string;
    type: 'page' | 'tag';
  }[];
  edges: {
    source: string;
    target: string;
    type: 'link' | 'tag';
  }[];
}
```

---

## 前端組件設計

### 1. Obsidian Import Component

```typescript
@Component({
  selector: 'app-obsidian-import',
  template: `
    <div class="import-wizard">
      <!-- 步驟 1: 選擇匯入方式 -->
      <div class="step">
        <h3>選擇匯入方式</h3>
        <div class="options">
          <button (click)="importType = 'zip'">
            上傳 ZIP 檔案
          </button>
          <button (click)="importType = 'folder'">
            選擇本地資料夾（需要桌面應用）
          </button>
          <button (click)="importType = 'single'">
            匯入單個檔案
          </button>
        </div>
      </div>

      <!-- 步驟 2: 上傳檔案 -->
      <div class="step" *ngIf="importType">
        <input
          type="file"
          [accept]="importType === 'zip' ? '.zip' : '.md'"
          (change)="onFileSelect($event)"
        />
      </div>

      <!-- 步驟 3: 預覽 -->
      <div class="preview" *ngIf="previewData">
        <h3>將匯入 {{ previewData.files.length }} 個檔案</h3>
        <ul>
          <li *ngFor="let file of previewData.files">
            {{ file.name }}
          </li>
        </ul>
      </div>

      <!-- 步驟 4: 匯入設定 -->
      <div class="settings">
        <label>
          <input type="checkbox" [(ngModel)]="overwriteExisting" />
          覆蓋現有頁面
        </label>
        <label>
          <input type="checkbox" [(ngModel)]="preserveStructure" />
          保留資料夾結構
        </label>
      </div>

      <!-- 執行匯入 -->
      <button
        (click)="startImport()"
        [disabled]="!canImport()"
      >
        開始匯入
      </button>
    </div>
  `
})
export class ObsidianImportComponent {
  // ...implementation
}
```

### 2. Wikilink Autocomplete

在 Tiptap 編輯器中支援 `[[` 自動完成：

```typescript
// Tiptap Extension
export const WikilinkExtension = Node.create({
  name: 'wikilink',

  addInputRules() {
    return [
      {
        find: /\[\[([^\]]+)\]\]/,
        handler: ({ state, range, match }) => {
          const title = match[1];
          // 搜尋匹配的頁面
          const suggestions = await searchPages(title);
          // 顯示自動完成選單
          showAutocompleteSuggestions(suggestions);
        }
      }
    ];
  },

  renderHTML({ node }) {
    return ['a', {
      href: `/workspace/pages/${node.attrs.pageId}`,
      class: 'wikilink'
    }, node.attrs.title];
  }
});
```

### 3. Knowledge Graph Viewer

```typescript
@Component({
  selector: 'app-knowledge-graph',
  template: `
    <div class="graph-container">
      <canvas #graphCanvas></canvas>

      <div class="controls">
        <button (click)="resetView()">重置視圖</button>
        <button (click)="togglePhysics()">
          {{ physicsEnabled ? '停止' : '開始' }} 物理模擬
        </button>
        <select [(ngModel)]="layoutType">
          <option value="force">力導向</option>
          <option value="hierarchical">階層式</option>
          <option value="circular">圓形</option>
        </select>
      </div>
    </div>
  `
})
export class KnowledgeGraphComponent {
  // 使用 D3.js 或 vis.js 繪製知識圖譜
  // 節點 = 頁面
  // 邊 = 連結
}
```

### 4. Backlinks Panel

在頁面編輯器中顯示反向連結：

```typescript
@Component({
  selector: 'app-backlinks-panel',
  template: `
    <div class="backlinks-panel">
      <h3>反向連結 ({{ backlinks().length }})</h3>

      <ul class="backlinks-list">
        <li *ngFor="let backlink of backlinks()">
          <a [routerLink]="['/workspace/pages', backlink.pageId]">
            {{ backlink.pageTitle }}
          </a>
          <p class="context">{{ backlink.context }}</p>
        </li>
      </ul>

      <div *ngIf="backlinks().length === 0" class="empty-state">
        <p>此頁面尚未被其他頁面連結</p>
      </div>
    </div>
  `
})
export class BacklinksPanelComponent {
  backlinks = signal<Backlink[]>([]);

  async ngOnInit() {
    const pageId = this.route.snapshot.params['id'];
    this.backlinks.set(
      await this.obsidianService.getBacklinks(pageId)
    );
  }
}
```

---

## Markdown ↔ Tiptap 轉換

### Markdown → Tiptap

```typescript
import { marked } from 'marked';

function markdownToTiptap(markdown: string): TiptapContent {
  // 1. 移除 Frontmatter
  const { content, frontmatter } = extractFrontmatter(markdown);

  // 2. 轉換 Wikilinks
  const processed = content.replace(
    /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g,
    (match, target, _, alias) => {
      const pageId = findPageByTitle(target);
      const text = alias || target;
      return `<a href="/workspace/pages/${pageId}">${text}</a>`;
    }
  );

  // 3. 使用 marked 解析 Markdown
  const html = marked(processed);

  // 4. HTML → Tiptap JSON
  return htmlToTiptap(html);
}
```

### Tiptap → Markdown

```typescript
function tiptapToMarkdown(content: TiptapContent): string {
  let markdown = '';

  for (const node of content.content) {
    switch (node.type) {
      case 'heading':
        markdown += `${'#'.repeat(node.attrs.level)} ${getTextContent(node)}\n\n`;
        break;
      case 'paragraph':
        markdown += `${getTextContent(node)}\n\n`;
        break;
      case 'bulletList':
        markdown += convertBulletList(node);
        break;
      // ... 其他節點類型
    }
  }

  // 轉換內部連結為 Wikilinks
  markdown = markdown.replace(
    /\[([^\]]+)\]\(\/workspace\/pages\/([^)]+)\)/g,
    '[[$1]]'
  );

  return markdown;
}
```

---

## 實作階段

### Phase 1: 基礎匯入/匯出 (2 週)
- [ ] Markdown 解析器（支援 frontmatter）
- [ ] Wikilink 轉換
- [ ] ZIP 匯入功能
- [ ] 單檔匯入
- [ ] 匯出為 Obsidian 格式

### Phase 2: 雙向連結 (1 週)
- [ ] 資料庫 schema（page_links, page_aliases）
- [ ] Backlinks API
- [ ] Backlinks Panel 組件
- [ ] 反向連結追蹤

### Phase 3: 知識圖譜 (1 週)
- [ ] Graph API
- [ ] Knowledge Graph 組件（D3.js/vis.js）
- [ ] 互動式圖譜
- [ ] 圖譜過濾與搜尋

### Phase 4: 檔案系統同步 (2 週)
- [ ] 檔案監聽器（Golang fsnotify）
- [ ] 雙向同步邏輯
- [ ] 衝突解決機制
- [ ] Vault 管理介面

### Phase 5: 編輯器增強 (1 週)
- [ ] Wikilink 自動完成
- [ ] Tag 自動完成
- [ ] 嵌入內容支援
- [ ] Obsidian 快捷鍵

---

## 技術挑戰

### 1. 檔案系統存取
**問題**：Web 應用無法直接存取本地檔案系統

**解決方案**：
- **選項 A**：桌面應用（Electron/Tauri）
- **選項 B**：瀏覽器 File System Access API（限 Chrome）
- **選項 C**：僅支援匯入/匯出（不需檔案系統存取）

### 2. Wikilink 解析
**問題**：需要在寫入時解析 wikilink 目標

**解決方案**：
```typescript
// 兩階段解析
// 第一階段：匯入所有頁面
pages.forEach(page => db.insert(page));

// 第二階段：解析並建立連結
pages.forEach(page => {
  const links = extractWikilinks(page.content);
  links.forEach(link => {
    const targetPage = db.findByTitle(link.target);
    if (targetPage) {
      db.createLink(page.id, targetPage.id);
    }
  });
});
```

### 3. 即時同步
**問題**：如何在 Obsidian 和平台之間即時同步

**解決方案**：
```go
// 使用檔案監聽器 + WebSocket
func (v *Vault) Watch() {
    watcher, _ := fsnotify.NewWatcher()
    watcher.Add(v.Path)

    for {
        select {
        case event := <-watcher.Events:
            // 檔案變更 → 解析 → 更新資料庫 → WebSocket 通知前端
            page := ParseMarkdown(event.Name)
            db.Upsert(page)
            ws.Broadcast("page:updated", page)
        }
    }
}
```

---

## 使用者體驗

### 典型工作流程 A：Obsidian → Platform

1. 使用者在 Obsidian 中撰寫筆記
2. 點擊「匯入 Obsidian Vault」
3. 選擇 vault 資料夾或上傳 ZIP
4. 預覽即將匯入的檔案
5. 確認匯入
6. 在平台上查看並編輯筆記
7. 使用 AI Chat 詢問筆記內容
8. 查看知識圖譜

### 典型工作流程 B：雙向同步

1. 設定 Obsidian vault 路徑
2. 啟用雙向同步
3. 在 Obsidian 編輯 → 自動同步到平台
4. 在平台編輯 → 自動同步到 Obsidian
5. 衝突時提示使用者選擇版本

---

## 與現有功能整合

### 1. AI Chat + Obsidian
```typescript
// AI 可以參考 Obsidian 筆記
const response = await ai.chat({
  message: "總結我關於 Golang 的所有筆記",
  sourcePages: obsidianPages.filter(p => p.tags.includes('golang'))
});

// AI 回覆包含 wikilink 引用
response.citations.forEach(citation => {
  // 點擊引用 → 跳轉到原始 Obsidian 筆記
});
```

### 2. Blog Publishing + Obsidian
```typescript
// 從 Obsidian 筆記直接發布到 Blog
const obsidianNote = await getPage(pageId);
const blogPost = {
  title: obsidianNote.title,
  content: convertWikilinksToRegularLinks(obsidianNote.content),
  tags: obsidianNote.tags,
  publishedAt: new Date()
};
await publishToBlog(blogPost);
```

### 3. Learning Paths + Obsidian
```typescript
// 使用 Obsidian 的 MOC (Map of Content) 創建 Learning Path
const moc = await parseMOC('學習路徑-Golang.md');
const learningPath = {
  title: moc.title,
  phases: moc.sections.map(section => ({
    title: section.heading,
    pages: section.links.map(link => findPageByWikilink(link))
  }))
};
```

---

## 安全性考量

### 1. 檔案系統存取
- 僅允許存取使用者明確授權的資料夾
- 使用沙盒環境
- 定期掃描惡意內容

### 2. 資料隱私
- 本地同步選項（不上傳到雲端）
- 端到端加密（如果使用雲端同步）
- 使用者可隨時解除連結

### 3. Markdown 注入
```typescript
// 清理使用者輸入的 Markdown
function sanitizeMarkdown(content: string): string {
  // 移除潛在的 XSS 攻擊
  return DOMPurify.sanitize(
    marked(content),
    { ALLOWED_TAGS: [...], ALLOWED_ATTR: [...] }
  );
}
```

---

## 競品比較

| 功能 | Notion | Obsidian | 我們的平台 (整合後) |
|------|--------|----------|---------------------|
| 雲端同步 | ✅ | ❌ (需付費) | ✅ |
| 本地優先 | ❌ | ✅ | ✅ (選擇性) |
| 雙向連結 | ✅ | ✅ | ✅ |
| AI 功能 | ✅ | ❌ (需插件) | ✅ (NotebookLM 風格) |
| Blog 發布 | ❌ | ❌ (需插件) | ✅ |
| Markdown | ❌ | ✅ | ✅ |
| 知識圖譜 | ❌ | ✅ | ✅ (計畫中) |

**我們的優勢**：
- 整合 Notion、Obsidian、Blog 於一體
- AI 驅動的知識管理
- 靈活的匯入/匯出
- 開源、可自主部署

---

## 開發優先級

### 高優先級 (MVP)
1. ✅ ZIP 檔案匯入
2. ✅ Frontmatter 解析
3. ✅ Wikilink 轉換
4. ✅ 基礎 Markdown → Tiptap 轉換

### 中優先級
1. 雙向連結追蹤
2. Backlinks panel
3. Tag 自動完成
4. 匯出為 Obsidian 格式

### 低優先級（未來）
1. 知識圖譜視覺化
2. 檔案系統同步
3. 桌面應用
4. 嵌入內容支援

---

## 結論

Obsidian 整合可以為我們的平台帶來：

1. **更多使用者**：吸引 Obsidian 社群
2. **降低遷移成本**：使用者可以輕鬆匯入現有筆記
3. **增強互操作性**：Markdown 標準格式
4. **知識圖譜**：視覺化知識網路
5. **靈活性**：本地優先 + 雲端同步的混合模式

**建議**：
- Phase 1 先實作基礎匯入/匯出（2 週）
- 收集使用者反饋
- 再決定是否實作完整的檔案系統同步

這樣可以快速驗證功能價值，同時保持開發成本可控。
