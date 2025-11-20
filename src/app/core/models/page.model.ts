// Tiptap JSON Content Type
export interface TiptapContent {
  type: 'doc';
  content?: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

// Page Model
export interface Page {
  id: string;
  workspaceId?: string;
  userId: string;

  // Basic Info
  title: string;
  icon?: string;
  coverImage?: string;

  // Content (Tiptap JSON format)
  content: TiptapContent;

  // Hierarchy
  parentId?: string | null;
  position: number;

  // Publish Status
  publishStatus: 'draft' | 'published' | 'archived';
  publishedSlug?: string | null;
  publishedAt?: string | null;

  // SEO & Metadata
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  tags?: string[];
  category?: string;
  series?: string;
  seriesOrder?: number;

  // Stats
  readingTime?: number;

  // Diagrams (Excalidraw, Mermaid, etc.)
  diagrams?: Diagram[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Diagram Types
export interface Diagram {
  id: string;
  type: 'excalidraw' | 'mermaid' | 'drawio';
  content: any;
  thumbnail?: string;
}

// Create/Update Page Request
export interface CreatePageRequest {
  title: string;
  icon?: string;
  parentId?: string | null;
  content?: TiptapContent;
}

export interface UpdatePageRequest {
  title?: string;
  icon?: string;
  coverImage?: string;
  content?: TiptapContent;
  tags?: string[];
  category?: string;
  parentId?: string | null;
  position?: number;
}

// Publish Request
export interface PublishPageRequest {
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  tags?: string[];
  category?: string;
  series?: string;
  seriesOrder?: number;
  publishDate?: string;
}

// Page List Response
export interface PageListResponse {
  pages: Page[];
  total: number;
  limit: number;
  offset: number;
}

// Page Tree Node (for sidebar)
export interface PageTreeNode {
  id: string;
  title: string;
  icon?: string;
  children?: PageTreeNode[];
  position: number;
}
