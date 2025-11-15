---
title: "如何在 Koopa 部落格新增文章"
date: "2025-11-15"
tags: ["system"]
description: "完整指南：如何在這個 Angular 部落格中建立和發布新文章，包含 Markdown 語法和 Front Matter 設定。"
---

# 如何在 Koopa 部落格新增文章

歡迎使用 Koopa 技術部落格！本文將引導您了解如何建立和發布新文章。

## 快速開始

### 1. 建立新文章檔案

在 `src/assets/posts/` 目錄下建立新的 Markdown 檔案：

```bash
touch src/assets/posts/my-new-post.md
```

檔案名稱將成為文章的 URL slug，例如 `getting-started.md` 會對應到 `/blog/getting-started`。

### 2. 設定 Front Matter

每篇文章都需要在檔案開頭包含 YAML front matter，定義文章的 metadata：

```yaml
---
title: "文章標題"
date: "2025-11-15"
tags: ["golang", "algorithm"]
description: "文章簡短描述，會顯示在文章列表中"
---
```

#### Front Matter 欄位說明

- **title**（必填）：文章標題
- **date**（必填）：發布日期，格式為 `YYYY-MM-DD`
- **tags**（選填）：標籤陣列，可使用的標籤包括：
  - `golang` - Go 程式設計
  - `rust` - Rust 程式設計
  - `algorithm` - 演算法與資料結構
  - `system` - 系統架構
  - `sql` - 資料庫與 SQL
  - `ai` - 人工智慧
  - `google` - Google 技術
- **description**（選填）：文章摘要，建議 100-200 字

### 3. 撰寫文章內容

Front matter 之後就是文章的主要內容，使用標準的 Markdown 語法。

## Markdown 語法範例

### 標題

使用 `#` 符號建立標題，支援 H1 到 H6：

```markdown
# H1 標題
## H2 標題
### H3 標題
```

### 文字格式

- **粗體文字**：使用 `**粗體**` 或 `__粗體__`
- *斜體文字*：使用 `*斜體*` 或 `_斜體_`
- `行內程式碼`：使用反引號 `` `code` ``

### 程式碼區塊

使用三個反引號加上語言名稱來建立程式碼區塊：

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
```

### 列表

無序列表：

- 項目一
- 項目二
  - 子項目 2.1
  - 子項目 2.2
- 項目三

有序列表：

1. 第一步
2. 第二步
3. 第三步

### 引用

> 這是一段引用文字。
>
> 可以包含多個段落。

### 連結

- 外部連結：`[連結文字](https://example.com)`
- 內部連結：`[文章列表](/blog)`

### 圖片

```markdown
![圖片替代文字](圖片 URL)
```

## 進階技巧

### 程式碼語法高亮

本部落格使用 Highlight.js 進行程式碼語法高亮，支援超過 190 種程式語言，包括：

- TypeScript / JavaScript
- Go
- Rust
- Python
- Java / Kotlin
- C / C++
- SQL
- Shell / Bash
- 以及更多...

### 閱讀時間估算

系統會自動計算文章的閱讀時間（基於每分鐘 200 字的閱讀速度）。

### 標籤過濾

讀者可以點擊標籤來查看所有相同標籤的文章。

## 範例文章模板

這是一個完整的文章模板：

```markdown
---
title: "使用 Go 實作二元搜尋樹"
date: "2025-11-15"
tags: ["golang", "algorithm"]
description: "深入探討如何在 Go 語言中實作高效的二元搜尋樹資料結構，包含插入、搜尋和刪除操作。"
---

# 使用 Go 實作二元搜尋樹

## 概述

二元搜尋樹（Binary Search Tree, BST）是一種基本的資料結構...

## 實作

\`\`\`go
type Node struct {
    Value int
    Left  *Node
    Right *Node
}
\`\`\`

## 結論

本文介紹了...
```

## 部署流程

1. 建立文章並儲存到 `src/assets/posts/` 目錄
2. 在本地測試：`npm start`
3. 建置專案：`npm run build`
4. 部署到 Cloudflare Pages

## 注意事項

- 檔案名稱使用小寫英文和連字號（kebab-case），例如 `my-post-title.md`
- 日期格式必須是 `YYYY-MM-DD`
- 標籤名稱要與預定義的標籤一致
- 避免在文章中使用過大的圖片，建議壓縮後再上傳

## 結論

現在您已經了解如何在 Koopa 部落格中新增文章了！這個系統使用純 Markdown 檔案管理內容，簡單且易於維護。

如果您需要更進階的內容管理功能，可以考慮整合 Decap CMS（前 Netlify CMS）或其他 headless CMS 解決方案。

祝您寫作愉快！
