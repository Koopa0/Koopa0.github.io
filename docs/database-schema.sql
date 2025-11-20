-- ============================================================================
-- Knowledge Management Platform - Database Schema
-- PostgreSQL 15+ with pgvector extension
-- ============================================================================

-- 啟用擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 全文搜尋

-- ============================================================================
-- 使用者與認證
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,

    -- 偏好設定
    preferences JSONB DEFAULT '{}',

    -- OAuth
    oauth_provider VARCHAR(50),  -- google, github, etc.
    oauth_id VARCHAR(255),

    -- 狀態
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- 時間戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================================
-- Workspace (可選 - 多工作區支援)
-- ============================================================================

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',  -- owner, admin, member, viewer

    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- ============================================================================
-- 頁面 (Knowledge Base 核心)
-- ============================================================================

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- 基本資訊
    title TEXT NOT NULL,
    icon VARCHAR(50),  -- emoji 或 icon id
    cover_image TEXT,

    -- 內容 (Tiptap JSON 格式)
    content JSONB DEFAULT '{"type":"doc","content":[]}',

    -- 層級結構
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,  -- 排序

    -- 發布狀態
    publish_status VARCHAR(50) DEFAULT 'draft',  -- draft, published, archived
    published_slug VARCHAR(255) UNIQUE,
    published_at TIMESTAMP WITH TIME ZONE,

    -- SEO & Metadata
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords TEXT[],
    tags TEXT[],
    category VARCHAR(100),
    series VARCHAR(255),
    series_order INTEGER,

    -- 閱讀時間 (分鐘)
    reading_time INTEGER,

    -- 向量嵌入 (用於 AI 搜尋)
    embedding vector(768),  -- Gemini embedding 維度

    -- 協作
    is_template BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,

    -- 時間戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE  -- 軟刪除
);

-- 索引優化
CREATE INDEX idx_pages_workspace_id ON pages(workspace_id);
CREATE INDEX idx_pages_user_id ON pages(user_id);
CREATE INDEX idx_pages_parent_id ON pages(parent_id);
CREATE INDEX idx_pages_publish_status ON pages(publish_status);
CREATE INDEX idx_pages_published_slug ON pages(published_slug) WHERE publish_status = 'published';
CREATE INDEX idx_pages_category ON pages(category);
CREATE INDEX idx_pages_series ON pages(series);
CREATE INDEX idx_pages_tags ON pages USING GIN(tags);
CREATE INDEX idx_pages_embedding ON pages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_pages_title_search ON pages USING gin(to_tsvector('english', title));

-- 全文搜尋
CREATE INDEX idx_pages_content_search ON pages USING gin(to_tsvector('english', content::text));

-- ============================================================================
-- Blocks (可選 - 如果需要更細粒度的 Block 管理)
-- ============================================================================

CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

    -- Block 類型
    type VARCHAR(50) NOT NULL,  -- paragraph, heading, code, image, etc.

    -- Block 內容
    content JSONB NOT NULL,

    -- 位置
    position INTEGER DEFAULT 0,
    parent_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,

    -- 時間戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocks_page_id ON blocks(page_id);
CREATE INDEX idx_blocks_position ON blocks(position);

-- ============================================================================
-- AI 對話系統
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

    -- 對話標題 (自動生成或使用者設定)
    title VARCHAR(255),

    -- Source pages (用於 RAG)
    source_page_ids UUID[],

    -- 對話歷史
    messages JSONB DEFAULT '[]',
    -- 格式: [{"role": "user", "content": "...", "timestamp": "..."}, ...]

    -- Metadata
    model VARCHAR(50) DEFAULT 'gemini-pro',
    settings JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_workspace_id ON conversations(workspace_id);

-- ============================================================================
-- Notion 整合
-- ============================================================================

CREATE TABLE notion_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Notion 認證
    access_token TEXT NOT NULL,
    bot_id VARCHAR(255),
    workspace_name VARCHAR(255),
    workspace_icon TEXT,

    -- 同步設定
    sync_enabled BOOLEAN DEFAULT TRUE,
    auto_sync BOOLEAN DEFAULT FALSE,
    sync_interval INTEGER DEFAULT 3600,  -- 秒

    -- 最後同步
    last_sync_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notion_sync_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES notion_connections(id) ON DELETE CASCADE,

    -- Notion 資料
    notion_page_id VARCHAR(255) NOT NULL,
    notion_database_id VARCHAR(255),

    -- 本地資料
    local_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

    -- 同步狀態
    sync_direction VARCHAR(50) DEFAULT 'both',  -- notion_to_local, local_to_notion, both
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'pending',  -- pending, syncing, success, error
    sync_error TEXT,

    -- Notion 最後修改時間 (用於檢測變更)
    notion_last_edited_time TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(connection_id, notion_page_id)
);

CREATE INDEX idx_notion_sync_mappings_connection_id ON notion_sync_mappings(connection_id);
CREATE INDEX idx_notion_sync_mappings_local_page_id ON notion_sync_mappings(local_page_id);
CREATE INDEX idx_notion_sync_mappings_notion_page_id ON notion_sync_mappings(notion_page_id);

-- ============================================================================
-- 版本控制 (可選)
-- ============================================================================

CREATE TABLE page_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

    -- 版本資訊
    version INTEGER NOT NULL,
    content JSONB NOT NULL,

    -- 變更資訊
    changed_by UUID REFERENCES users(id),
    change_summary TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX idx_page_versions_version ON page_versions(page_id, version DESC);

-- ============================================================================
-- 評論系統 (Blog)
-- ============================================================================

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 評論內容
    content TEXT NOT NULL,

    -- 回覆
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    -- 狀態
    is_approved BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,

    -- 訪客資訊 (如果允許訪客評論)
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_page_id ON comments(page_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

-- ============================================================================
-- 統計與分析
-- ============================================================================

CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,

    -- 訪客資訊
    visitor_id VARCHAR(255),  -- 匿名 ID 或 user_id
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 來源資訊
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country VARCHAR(2),

    -- 閱讀時間
    read_time INTEGER,  -- 秒

    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_page_views_page_id ON page_views(page_id);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at);

-- ============================================================================
-- Tags & Categories (可選 - 如果需要管理)
-- ============================================================================

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    color VARCHAR(7),  -- hex color
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(workspace_id, slug)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    icon VARCHAR(50),
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(workspace_id, slug)
);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) - 可選但推薦
-- ============================================================================

-- 啟用 RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 政策範例: 使用者只能看到自己的頁面或公開頁面
CREATE POLICY pages_select_policy ON pages
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id')::UUID
        OR publish_status = 'published'
    );

-- 政策範例: 使用者只能修改自己的頁面
CREATE POLICY pages_update_policy ON pages
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id')::UUID);
