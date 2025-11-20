# 🔗 Notion API 整合策略

## 核心整合目標

1. **雙向同步**: Knowledge Base ↔ Notion
2. **匯入**: 將現有 Notion 頁面匯入到系統
3. **匯出**: 將系統內容匯出到 Notion
4. **即時協作**: 在 Notion 修改後自動更新

## 📊 Notion API 能力分析

### 可用的 API

```go
// Notion API Client (使用官方 Go SDK)
import "github.com/jomei/notionapi"

// 支援的操作
- ✅ 讀取 Notion 頁面
- ✅ 讀取 Database
- ✅ 創建新頁面
- ✅ 更新頁面內容
- ✅ 讀取 Block 內容
- ✅ 追加 Block
- ✅ OAuth 認證
- ⚠️ 沒有 Webhook (需要輪詢)
```

### Notion Block 類型對應

```
Notion Block Types          →    Our Block Types
─────────────────────────────────────────────────────
paragraph                   →    text
heading_1/2/3               →    heading (level 1-3)
bulleted_list_item          →    bulletList
numbered_list_item          →    orderedList
to_do                       →    taskList
toggle                      →    details
code                        →    code
quote                       →    blockquote
callout                     →    callout
divider                     →    horizontalRule
image                       →    image
file                        →    file
bookmark                    →    bookmark
table                       →    table
column_list/column          →    columns (layout)
```

## 🏗️ 整合架構

### 1. OAuth 認證流程

```
使用者                  前端                  後端                  Notion
  │                     │                     │                     │
  │  點擊「連接 Notion」  │                     │                     │
  ├──────────────────→  │                     │                     │
  │                     │  請求授權 URL        │                     │
  │                     ├──────────────────→  │                     │
  │                     │  返回授權 URL        │                     │
  │                     │←─────────────────── │                     │
  │  重定向到 Notion     │                     │                     │
  ├────────────────────────────────────────────────────────────→   │
  │                     │                     │     使用者授權        │
  │  授權並重定向回來     │                     │                     │
  │←────────────────────────────────────────────────────────────   │
  │  callback?code=xxx  │                     │                     │
  ├──────────────────→  │                     │                     │
  │                     │  發送 code          │                     │
  │                     ├──────────────────→  │  交換 access_token  │
  │                     │                     ├──────────────────→  │
  │                     │                     │  返回 token         │
  │                     │                     │←─────────────────── │
  │                     │  儲存 token         │                     │
  │                     │←─────────────────── │                     │
  │  顯示連接成功        │                     │                     │
  │←──────────────────  │                     │                     │
```

### 2. 資料同步策略

#### 策略 A: 輪詢同步 (Polling)

由於 Notion 沒有 Webhook,需要定期輪詢檢查更新。

```go
// backend/internal/service/integration/notion_sync.go

type NotionSyncService struct {
    notionClient *notionapi.Client
    pageRepo     repository.PageRepository
    syncRepo     repository.NotionSyncRepository
}

// 輪詢檢查更新
func (s *NotionSyncService) PollChanges(ctx context.Context, connectionID uuid.UUID) error {
    // 1. 獲取所有同步映射
    mappings, err := s.syncRepo.GetMappingsByConnection(ctx, connectionID)
    if err != nil {
        return err
    }

    // 2. 逐一檢查每個頁面
    for _, mapping := range mappings {
        // 獲取 Notion 頁面
        notionPage, err := s.notionClient.Page.Get(ctx, notionapi.PageID(mapping.NotionPageID))
        if err != nil {
            log.Error("Failed to get Notion page", "error", err)
            continue
        }

        // 檢查最後修改時間
        if notionPage.LastEditedTime.After(mapping.NotionLastEditedTime) {
            // 頁面有更新,開始同步
            if err := s.SyncNotionToLocal(ctx, mapping, notionPage); err != nil {
                log.Error("Failed to sync page", "error", err)
            }
        }
    }

    return nil
}

// Notion → Local 同步
func (s *NotionSyncService) SyncNotionToLocal(
    ctx context.Context,
    mapping *domain.NotionSyncMapping,
    notionPage *notionapi.Page,
) error {
    // 1. 獲取 Notion 頁面所有 Blocks
    blocks, err := s.getAllBlocks(ctx, mapping.NotionPageID)
    if err != nil {
        return err
    }

    // 2. 轉換為 Tiptap JSON 格式
    tiptapContent, err := s.convertNotionBlocksToTiptap(blocks)
    if err != nil {
        return err
    }

    // 3. 更新本地頁面
    localPage, err := s.pageRepo.GetByID(ctx, mapping.LocalPageID)
    if err != nil {
        return err
    }

    localPage.Content = tiptapContent
    localPage.Title = getNotionTitle(notionPage)
    localPage.UpdatedAt = time.Now()

    if err := s.pageRepo.Update(ctx, localPage); err != nil {
        return err
    }

    // 4. 更新同步記錄
    mapping.NotionLastEditedTime = notionPage.LastEditedTime
    mapping.LastSyncedAt = time.Now()
    mapping.SyncStatus = "success"

    return s.syncRepo.UpdateMapping(ctx, mapping)
}

// 獲取所有 Blocks (遞迴)
func (s *NotionSyncService) getAllBlocks(ctx context.Context, pageID string) ([]notionapi.Block, error) {
    var allBlocks []notionapi.Block
    cursor := ""

    for {
        resp, err := s.notionClient.Block.GetChildren(ctx, notionapi.BlockID(pageID), &notionapi.Pagination{
            StartCursor: notionapi.Cursor(cursor),
            PageSize:    100,
        })
        if err != nil {
            return nil, err
        }

        allBlocks = append(allBlocks, resp.Results...)

        if !resp.HasMore {
            break
        }
        cursor = string(resp.NextCursor)
    }

    // 遞迴獲取子 Blocks
    for _, block := range allBlocks {
        if block.GetHasChildren() {
            children, err := s.getAllBlocks(ctx, string(block.GetID()))
            if err != nil {
                continue
            }
            // 將 children 附加到 block 的 metadata 中
        }
    }

    return allBlocks, nil
}
```

#### 策略 B: 手動同步

提供按鈕讓使用者手動觸發同步。

```typescript
// frontend: workspace/integrations/notion-sync.component.ts

@Component({
  selector: 'app-notion-sync',
  template: `
    <div class="notion-sync-panel">
      <h3>Notion 同步</h3>

      @if (connection()) {
        <div class="connection-info">
          <img [src]="connection().workspaceIcon" />
          <span>{{ connection().workspaceName }}</span>
        </div>

        <div class="sync-actions">
          <button (click)="syncAll()">
            <span>🔄</span> 全部同步
          </button>

          <button (click)="importFromNotion()">
            <span>📥</span> 從 Notion 匯入
          </button>

          <button (click)="exportToNotion()">
            <span>📤</span> 匯出到 Notion
          </button>
        </div>

        <div class="sync-mappings">
          @for (mapping of mappings(); track mapping.id) {
            <div class="mapping-item">
              <span>{{ mapping.localPageTitle }}</span>
              <span>↔</span>
              <span>{{ mapping.notionPageTitle }}</span>

              <button (click)="syncSingle(mapping.id)">
                同步
              </button>
            </div>
          }
        </div>

        <div class="auto-sync-settings">
          <label>
            <input type="checkbox" [(ngModel)]="autoSync" (change)="toggleAutoSync()" />
            啟用自動同步 (每小時)
          </label>
        </div>
      } @else {
        <button (click)="connectNotion()">
          連接 Notion
        </button>
      }
    </div>
  `
})
export class NotionSyncComponent {
  private api = inject(ApiService);

  connection = signal<NotionConnection | null>(null);
  mappings = signal<NotionMapping[]>([]);
  autoSync = false;

  async connectNotion() {
    // 1. 獲取 OAuth URL
    const { url } = await this.api.get('/api/notion/auth/url');

    // 2. 開啟 OAuth 視窗
    window.location.href = url;
  }

  async syncAll() {
    try {
      await this.api.post('/api/notion/sync/all', {
        connectionId: this.connection()!.id
      });

      alert('同步完成!');
    } catch (error) {
      alert('同步失敗: ' + error.message);
    }
  }

  async importFromNotion() {
    // 顯示 Notion 頁面選擇器
    const pages = await this.api.get('/api/notion/pages');

    // ... 選擇要匯入的頁面
  }
}
```

### 3. Block 轉換器

#### Notion → Tiptap

```go
// backend/internal/service/integration/converter.go

type BlockConverter struct{}

func (c *BlockConverter) NotionToTiptap(notionBlocks []notionapi.Block) (map[string]interface{}, error) {
    tiptapDoc := map[string]interface{}{
        "type":    "doc",
        "content": []interface{}{},
    }

    content := tiptapDoc["content"].([]interface{})

    for _, block := range notionBlocks {
        tiptapBlock, err := c.convertBlock(block)
        if err != nil {
            log.Warn("Failed to convert block", "type", block.GetType(), "error", err)
            continue
        }
        if tiptapBlock != nil {
            content = append(content, tiptapBlock)
        }
    }

    tiptapDoc["content"] = content
    return tiptapDoc, nil
}

func (c *BlockConverter) convertBlock(block notionapi.Block) (map[string]interface{}, error) {
    switch block.GetType() {
    case notionapi.BlockTypeParagraph:
        p := block.(*notionapi.ParagraphBlock)
        return map[string]interface{}{
            "type": "paragraph",
            "content": []interface{}{
                map[string]interface{}{
                    "type": "text",
                    "text": c.getRichTextContent(p.Paragraph.RichText),
                },
            },
        }, nil

    case notionapi.BlockTypeHeading1:
        h := block.(*notionapi.Heading1Block)
        return map[string]interface{}{
            "type": "heading",
            "attrs": map[string]interface{}{
                "level": 1,
            },
            "content": []interface{}{
                map[string]interface{}{
                    "type": "text",
                    "text": c.getRichTextContent(h.Heading1.RichText),
                },
            },
        }, nil

    case notionapi.BlockTypeHeading2:
        h := block.(*notionapi.Heading2Block)
        return map[string]interface{}{
            "type": "heading",
            "attrs": map[string]interface{}{
                "level": 2,
            },
            "content": []interface{}{
                map[string]interface{}{
                    "type": "text",
                    "text": c.getRichTextContent(h.Heading2.RichText),
                },
            },
        }, nil

    case notionapi.BlockTypeCode:
        code := block.(*notionapi.CodeBlock)
        return map[string]interface{}{
            "type": "codeBlock",
            "attrs": map[string]interface{}{
                "language": string(code.Code.Language),
            },
            "content": []interface{}{
                map[string]interface{}{
                    "type": "text",
                    "text": c.getRichTextContent(code.Code.RichText),
                },
            },
        }, nil

    case notionapi.BlockTypeBulletedListItem:
        item := block.(*notionapi.BulletedListItemBlock)
        return map[string]interface{}{
            "type": "bulletList",
            "content": []interface{}{
                map[string]interface{}{
                    "type": "listItem",
                    "content": []interface{}{
                        map[string]interface{}{
                            "type": "paragraph",
                            "content": []interface{}{
                                map[string]interface{}{
                                    "type": "text",
                                    "text": c.getRichTextContent(item.BulletedListItem.RichText),
                                },
                            },
                        },
                    },
                },
            },
        }, nil

    case notionapi.BlockTypeCallout:
        callout := block.(*notionapi.CalloutBlock)
        return map[string]interface{}{
            "type": "callout",
            "attrs": map[string]interface{}{
                "icon":  callout.Callout.Icon.GetEmoji(),
                "color": callout.Callout.Color,
            },
            "content": []interface{}{
                map[string]interface{}{
                    "type": "paragraph",
                    "content": []interface{}{
                        map[string]interface{}{
                            "type": "text",
                            "text": c.getRichTextContent(callout.Callout.RichText),
                        },
                    },
                },
            },
        }, nil

    case notionapi.BlockTypeImage:
        img := block.(*notionapi.ImageBlock)
        var url string
        if img.Image.Type == notionapi.FileTypeExternal {
            url = img.Image.External.URL
        } else {
            url = img.Image.File.URL
        }
        return map[string]interface{}{
            "type": "image",
            "attrs": map[string]interface{}{
                "src": url,
                "alt": c.getRichTextContent(img.Image.Caption),
            },
        }, nil

    // ... 其他 Block 類型

    default:
        log.Warn("Unsupported Notion block type", "type", block.GetType())
        return nil, nil
    }
}

func (c *BlockConverter) getRichTextContent(richTexts []notionapi.RichText) string {
    var result strings.Builder
    for _, rt := range richTexts {
        result.WriteString(rt.PlainText)
    }
    return result.String()
}
```

#### Tiptap → Notion

```go
func (c *BlockConverter) TiptapToNotion(tiptapDoc map[string]interface{}) ([]notionapi.Block, error) {
    var notionBlocks []notionapi.Block

    content := tiptapDoc["content"].([]interface{})

    for _, item := range content {
        block := item.(map[string]interface{})
        notionBlock, err := c.convertTiptapBlock(block)
        if err != nil {
            log.Warn("Failed to convert Tiptap block", "error", err)
            continue
        }
        if notionBlock != nil {
            notionBlocks = append(notionBlocks, notionBlock)
        }
    }

    return notionBlocks, nil
}

func (c *BlockConverter) convertTiptapBlock(block map[string]interface{}) (notionapi.Block, error) {
    blockType := block["type"].(string)

    switch blockType {
    case "paragraph":
        text := c.getTiptapText(block)
        return &notionapi.ParagraphBlock{
            BasicBlock: notionapi.BasicBlock{
                Object: "block",
                Type:   notionapi.BlockTypeParagraph,
            },
            Paragraph: notionapi.Paragraph{
                RichText: []notionapi.RichText{
                    {
                        Type: notionapi.ObjectTypeText,
                        Text: &notionapi.Text{
                            Content: text,
                        },
                    },
                },
            },
        }, nil

    case "heading":
        attrs := block["attrs"].(map[string]interface{})
        level := int(attrs["level"].(float64))
        text := c.getTiptapText(block)

        switch level {
        case 1:
            return &notionapi.Heading1Block{
                BasicBlock: notionapi.BasicBlock{
                    Object: "block",
                    Type:   notionapi.BlockTypeHeading1,
                },
                Heading1: notionapi.Heading{
                    RichText: []notionapi.RichText{
                        {
                            Type: notionapi.ObjectTypeText,
                            Text: &notionapi.Text{
                                Content: text,
                            },
                        },
                    },
                },
            }, nil
        case 2:
            return &notionapi.Heading2Block{
                BasicBlock: notionapi.BasicBlock{
                    Object: "block",
                    Type:   notionapi.BlockTypeHeading2,
                },
                Heading2: notionapi.Heading{
                    RichText: []notionapi.RichText{
                        {
                            Type: notionapi.ObjectTypeText,
                            Text: &notionapi.Text{
                                Content: text,
                            },
                        },
                    },
                },
            }, nil
        }

    case "codeBlock":
        attrs := block["attrs"].(map[string]interface{})
        language := attrs["language"].(string)
        code := c.getTiptapText(block)

        return &notionapi.CodeBlock{
            BasicBlock: notionapi.BasicBlock{
                Object: "block",
                Type:   notionapi.BlockTypeCode,
            },
            Code: notionapi.Code{
                RichText: []notionapi.RichText{
                    {
                        Type: notionapi.ObjectTypeText,
                        Text: &notionapi.Text{
                            Content: code,
                        },
                    },
                },
                Language: notionapi.Language(language),
            },
        }, nil

    // ... 其他類型
    }

    return nil, fmt.Errorf("unsupported Tiptap block type: %s", blockType)
}

func (c *BlockConverter) getTiptapText(block map[string]interface{}) string {
    content, ok := block["content"].([]interface{})
    if !ok || len(content) == 0 {
        return ""
    }

    var result strings.Builder
    for _, item := range content {
        node := item.(map[string]interface{})
        if node["type"] == "text" {
            result.WriteString(node["text"].(string))
        }
    }

    return result.String()
}
```

## 🔄 完整同步流程

### 匯入流程

```
使用者               前端                後端                Notion API
  │                  │                   │                    │
  │  點擊「匯入」      │                   │                    │
  ├────────────────→ │                   │                    │
  │                  │  GET /notion/pages│                    │
  │                  ├─────────────────→ │  列出所有頁面        │
  │                  │                   ├──────────────────→ │
  │                  │                   │  返回頁面列表       │
  │                  │  頁面列表         │←──────────────────  │
  │  顯示頁面選擇器   │←────────────────  │                    │
  │←────────────────  │                   │                    │
  │  選擇頁面 X      │                   │                    │
  ├────────────────→ │                   │                    │
  │                  │ POST /notion/import                    │
  │                  ├─────────────────→ │                    │
  │                  │  {pageIds: [X]}   │  獲取頁面內容       │
  │                  │                   ├──────────────────→ │
  │                  │                   │  返回 Blocks       │
  │                  │                   │←──────────────────  │
  │                  │                   │  轉換為 Tiptap     │
  │                  │                   │  儲存到資料庫       │
  │                  │                   │  建立同步映射       │
  │                  │  匯入成功         │                    │
  │  顯示成功訊息     │←────────────────  │                    │
  │←────────────────  │                   │                    │
```

### 匯出流程

```
使用者               前端                後端                Notion API
  │                  │                   │                    │
  │  點擊「匯出」      │                   │                    │
  ├────────────────→ │                   │                    │
  │  選擇頁面 Y      │                   │                    │
  ├────────────────→ │                   │                    │
  │                  │ POST /notion/export                    │
  │                  ├─────────────────→ │                    │
  │                  │  {pageId: Y}      │  從資料庫載入      │
  │                  │                   │  轉換為 Notion格式  │
  │                  │                   │  創建 Notion 頁面   │
  │                  │                   ├──────────────────→ │
  │                  │                   │  返回 page_id      │
  │                  │                   │←──────────────────  │
  │                  │                   │  建立同步映射       │
  │                  │  匯出成功         │                    │
  │                  │  + Notion 連結    │                    │
  │  顯示成功訊息     │←────────────────  │                    │
  │←────────────────  │                   │                    │
```

## 💡 進階功能

### 1. 智能衝突解決

當兩邊都有修改時:

```go
type ConflictResolution int

const (
    UseLocal ConflictResolution = iota  // 使用本地版本
    UseNotion                           // 使用 Notion 版本
    Merge                               // 嘗試合併
    Manual                              // 手動解決
)

func (s *NotionSyncService) resolveConflict(
    local *domain.Page,
    notion *notionapi.Page,
    strategy ConflictResolution,
) error {
    switch strategy {
    case UseLocal:
        return s.SyncLocalToNotion(local, notion)
    case UseNotion:
        return s.SyncNotionToLocal(notion, local)
    case Merge:
        // 簡單的合併策略: 比較時間戳
        if local.UpdatedAt.After(notion.LastEditedTime) {
            return s.SyncLocalToNotion(local, notion)
        }
        return s.SyncNotionToLocal(notion, local)
    case Manual:
        // 標記為需要手動解決
        return s.markForManualResolution(local.ID, notion.ID)
    }
    return nil
}
```

### 2. 選擇性同步

只同步特定屬性:

```go
type SyncOptions struct {
    SyncTitle       bool
    SyncContent     bool
    SyncProperties  bool
    SyncComments    bool
}
```

### 3. Database 同步

Notion Database 可以映射到我們的 Page Collection:

```go
// 同步 Notion Database 為一組頁面
func (s *NotionSyncService) SyncDatabase(ctx context.Context, databaseID string) error {
    // 1. 查詢 Database
    query, err := s.notionClient.Database.Query(ctx, notionapi.DatabaseID(databaseID), nil)

    // 2. 逐一同步每個 page
    for _, page := range query.Results {
        // ...
    }
}
```

## 🎯 API 端點設計

```go
// backend/internal/api/handlers/notion.go

// OAuth
GET  /api/notion/auth/url           - 獲取 OAuth URL
GET  /api/notion/auth/callback      - OAuth callback
POST /api/notion/disconnect         - 斷開連接

// 同步
GET  /api/notion/connections        - 列出所有連接
POST /api/notion/sync/all           - 全部同步
POST /api/notion/sync/:mappingId    - 同步單一頁面
GET  /api/notion/sync/status        - 同步狀態

// 匯入/匯出
GET  /api/notion/pages              - 列出 Notion 頁面
POST /api/notion/import             - 匯入頁面
POST /api/notion/export             - 匯出頁面
GET  /api/notion/databases          - 列出 Databases
POST /api/notion/import/database    - 匯入整個 Database

// 映射管理
GET    /api/notion/mappings         - 列出映射
POST   /api/notion/mappings         - 創建映射
DELETE /api/notion/mappings/:id     - 刪除映射
```

## ⚡ 性能優化

### 1. 批次同步

```go
func (s *NotionSyncService) BatchSync(ctx context.Context, mappingIDs []uuid.UUID) error {
    var wg sync.WaitGroup
    errChan := make(chan error, len(mappingIDs))

    for _, id := range mappingIDs {
        wg.Add(1)
        go func(mappingID uuid.UUID) {
            defer wg.Done()
            if err := s.SyncOne(ctx, mappingID); err != nil {
                errChan <- err
            }
        }(id)
    }

    wg.Wait()
    close(errChan)

    // 收集錯誤
    var errors []error
    for err := range errChan {
        errors = append(errors, err)
    }

    if len(errors) > 0 {
        return fmt.Errorf("batch sync failed: %v", errors)
    }
    return nil
}
```

### 2. 增量同步

只同步變更的 Blocks:

```go
type BlockChecksum struct {
    BlockID  string
    Checksum string  // MD5 hash
}

// 計算差異
func calculateDiff(local, remote []BlockChecksum) (added, removed, modified []string) {
    // ...
}
```

### 3. 快取

```go
// 快取 Notion 頁面結構,減少 API 呼叫
func (s *NotionSyncService) GetCachedNotionPage(pageID string) (*notionapi.Page, error) {
    // 先查 Redis
    cached, err := s.redis.Get(ctx, "notion:page:"+pageID).Result()
    if err == nil {
        var page notionapi.Page
        json.Unmarshal([]byte(cached), &page)
        return &page, nil
    }

    // 呼叫 API
    page, err := s.notionClient.Page.Get(ctx, notionapi.PageID(pageID))
    if err != nil {
        return nil, err
    }

    // 快取 5 分鐘
    data, _ := json.Marshal(page)
    s.redis.Set(ctx, "notion:page:"+pageID, data, 5*time.Minute)

    return page, nil
}
```

## 📊 使用場景範例

### 場景 1: 從 Notion 匯入現有筆記

```
使用者操作:
1. 連接 Notion 帳號
2. 選擇要匯入的頁面/Database
3. 點擊「匯入」
4. 系統自動轉換並建立映射
5. 日後可雙向同步
```

### 場景 2: 在兩邊同時工作

```
時間軸:
09:00 - 在 Notion 修改頁面 A
10:00 - 系統輪詢檢測到變更,同步到 Knowledge Base
11:00 - 在 Knowledge Base 修改頁面 A
11:30 - 點擊「同步到 Notion」
11:31 - 檢測到衝突,提示選擇保留哪個版本
```

### 場景 3: 團隊協作

```
成員 A: 在 Knowledge Base 編輯
成員 B: 在 Notion 編輯 (更習慣 Notion)
系統: 定期雙向同步,保持一致
```
