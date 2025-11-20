// Notion Connection
export interface NotionConnection {
  id: string;
  userId: string;
  workspaceId?: string;

  // Notion Workspace Info
  workspaceName: string;
  workspaceIcon?: string;

  // Settings
  syncEnabled: boolean;
  autoSync: boolean;
  syncInterval: number;  // seconds

  // Status
  lastSyncAt?: string;

  createdAt: string;
  updatedAt: string;
}

// Notion Page (from Notion API)
export interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  coverUrl?: string;
  lastEditedTime: string;
  url: string;
}

// Sync Mapping (Notion Page <-> Local Page)
export interface NotionSyncMapping {
  id: string;
  connectionId: string;

  // Notion Data
  notionPageId: string;
  notionPageTitle: string;
  notionLastEditedTime: string;

  // Local Data
  localPageId: string;
  localPageTitle: string;

  // Sync Config
  syncDirection: 'notion_to_local' | 'local_to_notion' | 'both';
  lastSyncedAt?: string;
  syncStatus: 'pending' | 'syncing' | 'success' | 'error';
  syncError?: string;

  createdAt: string;
  updatedAt: string;
}

// Import/Export Requests
export interface ImportNotionPagesRequest {
  connectionId: string;
  notionPageIds: string[];
}

export interface ExportToNotionRequest {
  connectionId: string;
  pageId: string;
  parentPageId?: string;
}

// Sync Status Response
export interface SyncStatusResponse {
  mappings: NotionSyncMapping[];
  syncingCount: number;
  errorCount: number;
  lastSyncAt?: string;
}
