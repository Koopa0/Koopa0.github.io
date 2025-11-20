// Chat Message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  followUps?: string[];
  timestamp: string;
}

// Citation (Reference to source pages)
export interface Citation {
  number: number;
  pageId: string;
  pageTitle: string;
  excerpt?: string;
}

// Conversation
export interface Conversation {
  id: string;
  userId: string;
  workspaceId?: string;
  title: string;
  messages: ChatMessage[];
  sourcePageIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// Chat Request
export interface ChatRequest {
  message: string;
  sourcePageIds?: string[];
  conversationId?: string;
}

// Chat Response
export interface ChatResponse {
  conversationId: string;
  message: string;
  citations?: Citation[];
  followUps?: string[];
  tokensUsed?: number;
}

// Streaming Chat Chunk
export interface ChatStreamChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  data?: any;
}
