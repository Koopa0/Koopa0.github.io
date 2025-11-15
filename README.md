# Koopa

個人技術部落格專案。

## 功能特色

- 深色與淺色主題支援，自動偵測系統偏好設定
- 雙語介面（繁體中文 / 英文）
- 伺服器端渲染（SSR）提升 SEO 與效能
- 全文搜尋功能
- 基於 Markdown 的內容管理，支援語法高亮
- 響應式設計，最佳化所有裝置體驗
- 主題式內容分類（Golang、Rust、Algorithm、System、SQL、AI、Google）

## 技術堆疊

### 核心框架
- Angular v20 獨立元件架構
- TypeScript 5.x
- RxJS 7.x 響應式程式設計
- Angular SSR 伺服器端渲染

### 樣式系統
- Tailwind CSS v3
- CSS Variables 主題系統
- SCSS 進階樣式

### 內容管理
- Markdown 與 Front Matter 支援
- gray-matter 元資料解析
- Highlight.js 程式碼語法高亮
- ngx-markdown 渲染引擎

### 搜尋功能
- Fuse.js 客戶端模糊搜尋

## 環境需求

- Node.js 22.x 或更高版本
- npm 10.x 或更高版本

## 安裝

複製專案並安裝相依套件：

```bash
git clone https://github.com/Koopa0/Koopa0.github.io.git
cd Koopa0.github.io
npm install
```

## 開發

啟動開發伺服器：

```bash
npm start
```

應用程式將在 `http://localhost:4200` 運行。開發伺服器支援熱模組替換，並會在原始檔案修改時自動重新載入。

## 建置

建置正式環境版本：

```bash
npm run build
```

建置產物將儲存在 `dist/koopa/` 目錄。正式環境建置包含：
- Tree-shaking 優化的套件
- 預先渲染的靜態路由
- 壓縮的資源檔案
- Source maps（可設定）

## 部署

### Cloudflare Pages

本專案已配置可部署至 Cloudflare Pages。

**建置設定：**
- 建置指令：`npm run build`
- 建置輸出目錄：`dist/koopa/browser`
- Node 版本：22.x

**手動部署：**

```bash
npm run build
npx wrangler pages deploy dist/koopa/browser
```

## 專案結構

```
src/
├── app/
│   ├── core/
│   │   └── services/          # 核心服務（主題、多語系、Markdown、搜尋）
│   ├── shared/
│   │   └── components/        # 共用 UI 元件
│   └── features/              # 功能模組（首頁、部落格、標籤、關於）
├── assets/
│   ├── posts/                 # Markdown 部落格文章
│   └── i18n/                  # 國際化檔案
└── styles.scss                # 全域樣式
```

## 內容管理

### 新增文章

在 `src/assets/posts/` 目錄下建立新的 Markdown 檔案：

```markdown
---
title: "文章標題"
date: 2025-11-15
tags: ["golang", "algorithm"]
description: "文章簡短描述"
---

# 文章內容

您的內容...
```

### 支援的標籤

- `golang` - Go 程式設計
- `rust` - Rust 程式設計
- `algorithm` - 演算法與資料結構
- `system` - 系統架構
- `sql` - 資料庫與 SQL
- `ai` - 人工智慧
- `google` - Google 技術

## 設定

### 主題自訂

主題系統使用定義於 `src/styles.scss` 的 CSS 變數。透過更新深色與淺色主題區段的數值來修改配色方案。

### 語言檔案

翻譯檔案位於 `src/assets/i18n/`：
- `zh-TW.json` - 繁體中文
- `en.json` - 英文

## 瀏覽器支援

- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

## 授權

本專案採用 MIT 授權條款。詳見 LICENSE 檔案。

## 貢獻

這是一個個人部落格專案。雖然不積極徵求貢獻，但歡迎透過 GitHub Issues 提出問題與建議。

## 聯絡方式

如有問題或意見回饋，請在 GitHub 上開啟 issue。

---

使用 Angular v20 與 Tailwind CSS 建立
