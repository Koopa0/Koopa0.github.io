# 🔌 API 規格文檔

## 基礎資訊

```
Base URL: https://api.yourdomain.com
Version: v1
Authentication: Bearer Token (JWT)
```

## 🔐 認證

### POST /api/auth/register
註冊新使用者

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe"
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST /api/auth/login
登入

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {...},
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST /api/auth/logout
登出

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

### POST /api/auth/refresh
刷新 Token

**Request:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:** `200 OK`
```json
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

---

## 📄 頁面管理 (Pages)

### GET /api/pages
列出所有頁面

**Query Parameters:**
- `workspaceId` (optional): 工作區 ID
- `parentId` (optional): 父頁面 ID
- `search` (optional): 搜尋關鍵字
- `category` (optional): 分類
- `tags` (optional): 標籤 (逗號分隔)
- `publishStatus` (optional): `draft` | `published` | `archived`
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:** `200 OK`
```json
{
  "pages": [
    {
      "id": "uuid",
      "title": "My First Note",
      "icon": "📝",
      "coverImage": "https://...",
      "parentId": null,
      "position": 0,
      "publishStatus": "draft",
      "category": "golang",
      "tags": ["backend", "api"],
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### GET /api/pages/:id
獲取單一頁面

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "My First Note",
  "icon": "📝",
  "coverImage": "https://...",
  "content": {
    "type": "doc",
    "content": [...]
  },
  "parentId": null,
  "position": 0,
  "publishStatus": "draft",
  "publishedSlug": null,
  "publishedAt": null,
  "metaTitle": null,
  "metaDescription": null,
  "keywords": [],
  "tags": ["backend"],
  "category": "golang",
  "series": null,
  "seriesOrder": null,
  "readingTime": 5,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### POST /api/pages
創建新頁面

**Request:**
```json
{
  "title": "New Page",
  "icon": "📝",
  "parentId": null,
  "content": {
    "type": "doc",
    "content": []
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "New Page",
  ...
}
```

### PATCH /api/pages/:id
更新頁面

**Request:**
```json
{
  "title": "Updated Title",
  "content": {...},
  "tags": ["new-tag"]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Updated Title",
  ...
}
```

### DELETE /api/pages/:id
刪除頁面 (軟刪除)

**Response:** `204 No Content`

### POST /api/pages/:id/restore
還原已刪除頁面

**Response:** `200 OK`

### POST /api/pages/:id/move
移動頁面

**Request:**
```json
{
  "parentId": "new_parent_uuid",
  "position": 0
}
```

**Response:** `200 OK`

### GET /api/pages/:id/children
獲取子頁面

**Response:** `200 OK`
```json
{
  "pages": [...]
}
```

### GET /api/pages/:id/breadcrumb
獲取麵包屑

**Response:** `200 OK`
```json
{
  "breadcrumb": [
    { "id": "uuid", "title": "Parent" },
    { "id": "uuid", "title": "Current" }
  ]
}
```

---

## 📝 發布管理 (Publishing)

### POST /api/pages/:id/publish
發布頁面到 Blog

**Request:**
```json
{
  "slug": "my-first-post",
  "metaTitle": "My First Post",
  "metaDescription": "This is my first blog post",
  "keywords": ["golang", "backend"],
  "tags": ["golang", "tutorial"],
  "category": "golang",
  "series": "Golang Basics",
  "seriesOrder": 1,
  "publishDate": "2025-01-01T00:00:00Z"  // optional, 定時發布
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "publishedUrl": "https://yourdomain.com/blog/my-first-post",
  "publishedAt": "2025-01-01T00:00:00Z"
}
```

### POST /api/pages/:id/unpublish
取消發布

**Response:** `200 OK`

### GET /api/publish/status
獲取所有發布狀態

**Response:** `200 OK`
```json
{
  "published": [
    {
      "pageId": "uuid",
      "title": "...",
      "slug": "my-post",
      "publishedAt": "...",
      "needsUpdate": false
    }
  ],
  "scheduled": [...],
  "drafts": [...]
}
```

---

## 🤖 AI 功能 (AI)

### POST /api/ai/chat
普通對話

**Request:**
```json
{
  "message": "What is Golang?",
  "sourcePageIds": ["uuid1", "uuid2"],
  "conversationId": "uuid"  // optional, 繼續對話
}
```

**Response:** `200 OK`
```json
{
  "conversationId": "uuid",
  "message": "Golang is a programming language... [1][2]",
  "citations": [
    {
      "number": 1,
      "pageId": "uuid1",
      "pageTitle": "Introduction to Go"
    }
  ],
  "followUps": [
    "What are the benefits of using Go?",
    "How does Go handle concurrency?"
  ],
  "tokensUsed": 234
}
```

### GET /api/ai/chat/stream (SSE)
Streaming 對話

**Query Parameters:**
- `message`: 使用者訊息
- `sourcePageIds`: 來源頁面 IDs (逗號分隔)
- `conversationId`: 對話 ID (optional)

**Response:** Server-Sent Events
```
data: chunk 1
data: chunk 2
...
event: done
data: {"conversationId": "uuid", "citations": [...], "followUps": [...]}
```

### GET /api/ai/conversations
列出所有對話

**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Discussion about Golang",
      "messageCount": 5,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### GET /api/ai/conversations/:id
獲取對話詳情

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "...",
  "messages": [
    {
      "role": "user",
      "content": "...",
      "timestamp": "..."
    },
    {
      "role": "assistant",
      "content": "...",
      "citations": [...],
      "timestamp": "..."
    }
  ]
}
```

### DELETE /api/ai/conversations/:id
刪除對話

**Response:** `204 No Content`

### POST /api/ai/pages/:id/summary
生成頁面摘要

**Response:** `200 OK`
```json
{
  "summary": "This page discusses..."
}
```

### POST /api/ai/pages/:id/tags
建議標籤

**Response:** `200 OK`
```json
{
  "tags": ["golang", "backend", "api"]
}
```

### POST /api/ai/pages/:id/related
找相關頁面

**Request:**
```json
{
  "limit": 5
}
```

**Response:** `200 OK`
```json
{
  "pages": [
    {
      "id": "uuid",
      "title": "Related Page",
      "similarity": 0.85
    }
  ]
}
```

### POST /api/ai/embeddings/batch
批次生成 Embeddings

**Request:**
```json
{
  "pageIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:** `202 Accepted`
```json
{
  "jobId": "uuid",
  "status": "processing"
}
```

---

## 🔗 Notion 整合 (Notion)

### GET /api/notion/auth/url
獲取 OAuth URL

**Response:** `200 OK`
```json
{
  "url": "https://api.notion.com/v1/oauth/authorize?..."
}
```

### GET /api/notion/auth/callback
OAuth Callback

**Query Parameters:**
- `code`: Authorization code from Notion

**Response:** `302 Redirect` to frontend with success

### GET /api/notion/connections
列出所有連接

**Response:** `200 OK`
```json
{
  "connections": [
    {
      "id": "uuid",
      "workspaceName": "My Notion Workspace",
      "workspaceIcon": "https://...",
      "syncEnabled": true,
      "autoSync": false,
      "lastSyncAt": "..."
    }
  ]
}
```

### POST /api/notion/disconnect
斷開連接

**Request:**
```json
{
  "connectionId": "uuid"
}
```

**Response:** `204 No Content`

### GET /api/notion/pages
列出 Notion 頁面

**Query Parameters:**
- `connectionId`: 連接 ID

**Response:** `200 OK`
```json
{
  "pages": [
    {
      "id": "notion_page_id",
      "title": "My Notion Page",
      "icon": "📝",
      "lastEditedTime": "..."
    }
  ]
}
```

### POST /api/notion/import
匯入 Notion 頁面

**Request:**
```json
{
  "connectionId": "uuid",
  "notionPageIds": ["notion_id1", "notion_id2"]
}
```

**Response:** `202 Accepted`
```json
{
  "jobId": "uuid",
  "status": "processing"
}
```

### POST /api/notion/export
匯出到 Notion

**Request:**
```json
{
  "connectionId": "uuid",
  "pageId": "local_page_uuid",
  "parentPageId": "notion_parent_id"  // optional
}
```

**Response:** `201 Created`
```json
{
  "notionPageId": "notion_id",
  "notionUrl": "https://notion.so/..."
}
```

### POST /api/notion/sync/all
全部同步

**Request:**
```json
{
  "connectionId": "uuid"
}
```

**Response:** `202 Accepted`
```json
{
  "jobId": "uuid",
  "status": "processing"
}
```

### POST /api/notion/sync/:mappingId
同步單一映射

**Response:** `200 OK`
```json
{
  "success": true,
  "syncedAt": "..."
}
```

### GET /api/notion/mappings
列出映射關係

**Query Parameters:**
- `connectionId`: 連接 ID

**Response:** `200 OK`
```json
{
  "mappings": [
    {
      "id": "uuid",
      "localPageId": "uuid",
      "localPageTitle": "My Page",
      "notionPageId": "notion_id",
      "syncDirection": "both",
      "lastSyncedAt": "...",
      "syncStatus": "success"
    }
  ]
}
```

### DELETE /api/notion/mappings/:id
刪除映射

**Response:** `204 No Content`

---

## 🗂️ 工作區 (Workspaces)

### GET /api/workspaces
列出工作區

**Response:** `200 OK`
```json
{
  "workspaces": [
    {
      "id": "uuid",
      "name": "Personal",
      "description": "My personal workspace",
      "role": "owner"
    }
  ]
}
```

### POST /api/workspaces
創建工作區

**Request:**
```json
{
  "name": "Work Projects",
  "description": "My work-related notes"
}
```

**Response:** `201 Created`

### PATCH /api/workspaces/:id
更新工作區

**Request:**
```json
{
  "name": "Updated Name"
}
```

**Response:** `200 OK`

### DELETE /api/workspaces/:id
刪除工作區

**Response:** `204 No Content`

### GET /api/workspaces/:id/members
列出成員

**Response:** `200 OK`
```json
{
  "members": [
    {
      "userId": "uuid",
      "username": "johndoe",
      "role": "admin",
      "joinedAt": "..."
    }
  ]
}
```

### POST /api/workspaces/:id/invite
邀請成員

**Request:**
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

**Response:** `200 OK`

---

## 🏷️ 標籤與分類

### GET /api/tags
列出所有標籤

**Response:** `200 OK`
```json
{
  "tags": [
    {
      "name": "golang",
      "slug": "golang",
      "count": 15,
      "color": "#00ADD8"
    }
  ]
}
```

### GET /api/categories
列出所有分類

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "name": "Golang",
      "slug": "golang",
      "count": 20,
      "color": "#00ADD8",
      "icon": "🐹"
    }
  ]
}
```

---

## 📊 統計分析

### GET /api/stats/overview
總覽統計

**Response:** `200 OK`
```json
{
  "totalPages": 42,
  "publishedPosts": 10,
  "totalViews": 1234,
  "totalConversations": 56,
  "thisWeek": {
    "newPages": 5,
    "newPosts": 2,
    "views": 234
  }
}
```

### GET /api/stats/pages/:id
頁面統計

**Response:** `200 OK`
```json
{
  "views": 123,
  "uniqueVisitors": 89,
  "avgReadTime": 300,
  "viewsByDate": [
    { "date": "2025-01-01", "views": 10 },
    ...
  ]
}
```

---

## 🔍 搜尋

### GET /api/search
全局搜尋

**Query Parameters:**
- `q`: 搜尋關鍵字
- `type`: `pages` | `all` (default: all)
- `limit`: 限制數量 (default: 20)

**Response:** `200 OK`
```json
{
  "results": [
    {
      "type": "page",
      "id": "uuid",
      "title": "My Page",
      "excerpt": "...highlighted text...",
      "highlights": ["keyword 1", "keyword 2"],
      "score": 0.95
    }
  ],
  "total": 5
}
```

---

## 📁 檔案管理

### POST /api/files/upload
上傳檔案

**Request:** `multipart/form-data`
- `file`: 檔案
- `type`: `image` | `file` | `avatar`

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "url": "https://cdn.yourdomain.com/files/...",
  "filename": "image.png",
  "size": 12345,
  "mimeType": "image/png"
}
```

### DELETE /api/files/:id
刪除檔案

**Response:** `204 No Content`

---

## ⚙️ 使用者設定

### GET /api/users/me
獲取當前使用者資訊

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "displayName": "John Doe",
  "avatarUrl": "https://...",
  "preferences": {
    "theme": "dark",
    "language": "zh-TW"
  }
}
```

### PATCH /api/users/me
更新使用者資訊

**Request:**
```json
{
  "displayName": "New Name",
  "avatarUrl": "https://..."
}
```

**Response:** `200 OK`

### PATCH /api/users/me/password
修改密碼

**Request:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response:** `204 No Content`

---

## 📊 錯誤回應格式

所有錯誤都遵循統一格式:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### 常見錯誤碼

- `400 Bad Request` - 請求參數錯誤
- `401 Unauthorized` - 未認證
- `403 Forbidden` - 無權限
- `404 Not Found` - 資源不存在
- `409 Conflict` - 資源衝突
- `422 Unprocessable Entity` - 驗證失敗
- `429 Too Many Requests` - 速率限制
- `500 Internal Server Error` - 伺服器錯誤

---

## 🔄 Webhooks (可選)

### POST /api/webhooks
創建 Webhook

**Request:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["page.created", "page.published"],
  "secret": "your_secret_key"
}
```

**Response:** `201 Created`

### Webhook Payload 範例

```json
{
  "event": "page.published",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "pageId": "uuid",
    "title": "My Page",
    "publishedUrl": "https://..."
  }
}
```

---

## 🔑 Rate Limiting

- **未認證**: 100 requests / hour
- **已認證**: 1000 requests / hour
- **AI API**: 50 requests / hour

Headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```
