import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import {
  User,
  AuthResponse,
  Page,
  TiptapContent,
  PageListResponse,
  Conversation,
  ChatResponse,
  LearningPath,
  NotionConnection,
  NotionPage,
  NotionSyncMapping
} from '../models';

/**
 * Mock Data Service
 * Provides mock data for development and testing
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // In-memory data store
  private mockData = {
    users: this.generateMockUsers(),
    pages: this.generateMockPages(),
    conversations: this.generateMockConversations(),
    learningPaths: this.generateMockLearningPaths(),
    notionConnections: this.generateMockNotionConnections(),
    notionSyncMappings: this.generateMockNotionSyncMappings(),
  };

  // Current authenticated user
  private currentUser: User | null = null;

  /**
   * Main request handler - routes to appropriate mock handler
   */
  handleRequest(
    method: string,
    endpoint: string,
    body?: any,
    params?: HttpParams
  ): any {
    console.log(`[Mock] ${method} /${endpoint}`, { body, params: params?.keys() });

    // Auth endpoints
    if (endpoint.startsWith('auth/')) {
      return this.handleAuthRequest(method, endpoint, body);
    }

    // Pages endpoints
    if (endpoint.startsWith('pages')) {
      return this.handlePagesRequest(method, endpoint, body, params);
    }

    // AI endpoints
    if (endpoint.startsWith('ai/')) {
      return this.handleAiRequest(method, endpoint, body, params);
    }

    // Learning Paths endpoints
    if (endpoint.startsWith('learning-paths')) {
      return this.handleLearningPathsRequest(method, endpoint, body, params);
    }

    // Notion endpoints
    if (endpoint.startsWith('notion/')) {
      return this.handleNotionRequest(method, endpoint, body, params);
    }

    // User endpoints
    if (endpoint.startsWith('users/')) {
      return this.handleUsersRequest(method, endpoint, body, params);
    }

    throw { status: 404, message: 'Endpoint not found' };
  }

  // ========== Auth Handlers ==========

  private handleAuthRequest(method: string, endpoint: string, body: any): any {
    if (endpoint === 'auth/login' && method === 'POST') {
      return this.mockLogin(body.email, body.password);
    }

    if (endpoint === 'auth/register' && method === 'POST') {
      return this.mockRegister(body);
    }

    if (endpoint === 'auth/logout' && method === 'POST') {
      this.currentUser = null;
      return { success: true };
    }

    throw { status: 404, message: 'Auth endpoint not found' };
  }

  private mockLogin(email: string, password: string): AuthResponse {
    const user = this.mockData.users.find(u => u.email === email);

    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    this.currentUser = user;

    return {
      user,
      token: 'mock_jwt_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now()
    };
  }

  private mockRegister(data: any): AuthResponse {
    const newUser: User = {
      id: 'user_' + Date.now(),
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockData.users.push(newUser);
    this.currentUser = newUser;

    return {
      user: newUser,
      token: 'mock_jwt_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now()
    };
  }

  // ========== Pages Handlers ==========

  private handlePagesRequest(
    method: string,
    endpoint: string,
    body: any,
    params?: HttpParams
  ): any {
    // GET /pages
    if (endpoint === 'pages' && method === 'GET') {
      return this.mockGetPages(params);
    }

    // GET /pages/:id
    const getPageMatch = endpoint.match(/^pages\/([^\/]+)$/);
    if (getPageMatch && method === 'GET') {
      const pageId = getPageMatch[1];
      return this.mockGetPage(pageId);
    }

    // POST /pages
    if (endpoint === 'pages' && method === 'POST') {
      return this.mockCreatePage(body);
    }

    // PATCH /pages/:id
    const patchPageMatch = endpoint.match(/^pages\/([^\/]+)$/);
    if (patchPageMatch && method === 'PATCH') {
      const pageId = patchPageMatch[1];
      return this.mockUpdatePage(pageId, body);
    }

    // DELETE /pages/:id
    const deletePageMatch = endpoint.match(/^pages\/([^\/]+)$/);
    if (deletePageMatch && method === 'DELETE') {
      const pageId = deletePageMatch[1];
      return this.mockDeletePage(pageId);
    }

    // POST /pages/:id/publish
    const publishMatch = endpoint.match(/^pages\/([^\/]+)\/publish$/);
    if (publishMatch && method === 'POST') {
      const pageId = publishMatch[1];
      return this.mockPublishPage(pageId, body);
    }

    throw { status: 404, message: 'Pages endpoint not found' };
  }

  private mockGetPages(params?: HttpParams): PageListResponse {
    let pages = [...this.mockData.pages];

    // Apply filters
    if (params) {
      const search = params.get('search');
      if (search) {
        pages = pages.filter(p =>
          p.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      const category = params.get('category');
      if (category) {
        pages = pages.filter(p => p.category === category);
      }

      const publishStatus = params.get('publishStatus');
      if (publishStatus) {
        pages = pages.filter(p => p.publishStatus === publishStatus);
      }
    }

    return {
      pages,
      total: pages.length,
      limit: 50,
      offset: 0
    };
  }

  private mockGetPage(id: string): Page {
    const page = this.mockData.pages.find(p => p.id === id);
    if (!page) {
      throw { status: 404, message: 'Page not found' };
    }
    return page;
  }

  private mockCreatePage(data: any): Page {
    const newPage: Page = {
      id: 'page_' + Date.now(),
      userId: this.currentUser?.id || 'user_1',
      title: data.title || 'Untitled',
      icon: data.icon,
      content: data.content || { type: 'doc', content: [] },
      parentId: data.parentId || null,
      position: this.mockData.pages.length,
      publishStatus: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockData.pages.push(newPage);
    return newPage;
  }

  private mockUpdatePage(id: string, data: any): Page {
    const page = this.mockData.pages.find(p => p.id === id);
    if (!page) {
      throw { status: 404, message: 'Page not found' };
    }

    Object.assign(page, data);
    page.updatedAt = new Date().toISOString();

    return page;
  }

  private mockDeletePage(id: string): void {
    const index = this.mockData.pages.findIndex(p => p.id === id);
    if (index === -1) {
      throw { status: 404, message: 'Page not found' };
    }

    this.mockData.pages.splice(index, 1);
  }

  private mockPublishPage(id: string, data: any): any {
    const page = this.mockData.pages.find(p => p.id === id);
    if (!page) {
      throw { status: 404, message: 'Page not found' };
    }

    page.publishStatus = 'published';
    page.publishedSlug = data.slug;
    page.publishedAt = new Date().toISOString();
    page.metaTitle = data.metaTitle;
    page.metaDescription = data.metaDescription;
    page.keywords = data.keywords;
    page.tags = data.tags;
    page.category = data.category;
    page.series = data.series;
    page.seriesOrder = data.seriesOrder;

    return {
      success: true,
      publishedUrl: `https://yourdomain.com/blog/${data.slug}`,
      publishedAt: page.publishedAt
    };
  }

  // ========== AI Handlers ==========

  private handleAiRequest(
    method: string,
    endpoint: string,
    body: any,
    params?: HttpParams
  ): any {
    if (endpoint === 'ai/chat' && method === 'POST') {
      return this.mockChat(body);
    }

    if (endpoint === 'ai/conversations' && method === 'GET') {
      return { conversations: this.mockData.conversations };
    }

    const conversationMatch = endpoint.match(/^ai\/conversations\/([^\/]+)$/);
    if (conversationMatch && method === 'GET') {
      const convId = conversationMatch[1];
      const conversation = this.mockData.conversations.find(c => c.id === convId);
      if (!conversation) {
        throw { status: 404, message: 'Conversation not found' };
      }
      return conversation;
    }

    throw { status: 404, message: 'AI endpoint not found' };
  }

  private mockChat(data: any): ChatResponse {
    const conversationId = data.conversationId || 'conv_' + Date.now();

    return {
      conversationId,
      message: `Based on your question "${data.message}", here's what I found in your notes [1][2]:\n\nThis is a mock AI response. When you connect to the real backend, this will be replaced with actual Gemini AI responses with proper citations and context from your pages.`,
      citations: [
        {
          number: 1,
          pageId: this.mockData.pages[0]?.id || 'page_1',
          pageTitle: this.mockData.pages[0]?.title || 'Getting Started'
        },
        {
          number: 2,
          pageId: this.mockData.pages[1]?.id || 'page_2',
          pageTitle: this.mockData.pages[1]?.title || 'Golang Notes'
        }
      ],
      followUps: [
        'Can you explain this in more detail?',
        'What are some examples?',
        'How does this compare to alternatives?'
      ],
      tokensUsed: 150
    };
  }

  // ========== Learning Paths Handlers ==========

  private handleLearningPathsRequest(
    method: string,
    endpoint: string,
    body: any,
    params?: HttpParams
  ): any {
    if (endpoint === 'learning-paths' && method === 'GET') {
      return { learningPaths: this.mockData.learningPaths };
    }

    if (endpoint === 'learning-paths' && method === 'POST') {
      return this.mockCreateLearningPath(body);
    }

    throw { status: 404, message: 'Learning Paths endpoint not found' };
  }

  private mockCreateLearningPath(data: any): LearningPath {
    const newPath: LearningPath = {
      id: 'path_' + Date.now(),
      userId: this.currentUser?.id || 'user_1',
      title: data.title,
      description: data.description,
      icon: data.icon,
      phases: [],
      progress: {
        completedPageIds: [],
        currentPageId: undefined
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockData.learningPaths.push(newPath);
    return newPath;
  }

  // ========== Notion Handlers ==========

  private handleNotionRequest(
    method: string,
    endpoint: string,
    body: any,
    params?: HttpParams
  ): any {
    if (endpoint === 'notion/connections' && method === 'GET') {
      return { connections: this.mockData.notionConnections };
    }

    if (endpoint === 'notion/auth/url' && method === 'GET') {
      return {
        url: 'https://api.notion.com/v1/oauth/authorize?...'
      };
    }

    throw { status: 404, message: 'Notion endpoint not found' };
  }

  // ========== Users Handlers ==========

  private handleUsersRequest(
    method: string,
    endpoint: string,
    body: any,
    params?: HttpParams
  ): any {
    if (endpoint === 'users/me' && method === 'GET') {
      if (!this.currentUser) {
        throw { status: 401, message: 'Not authenticated' };
      }
      return this.currentUser;
    }

    throw { status: 404, message: 'Users endpoint not found' };
  }

  // ========== Mock Data Generators ==========

  private generateMockUsers(): User[] {
    return [
      {
        id: 'user_1',
        email: 'demo@example.com',
        username: 'demo',
        displayName: 'Demo User',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        preferences: {
          theme: 'auto',
          language: 'zh-TW'
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private generateMockPages(): Page[] {
    return [
      {
        id: 'page_1',
        userId: 'user_1',
        title: '🚀 Welcome to Your Knowledge Base',
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
              content: [{
                type: 'text',
                text: 'This is your personal knowledge management system. Start by creating new pages and organizing your thoughts.'
              }]
            }
          ]
        },
        parentId: null,
        position: 0,
        publishStatus: 'draft',
        tags: ['welcome', 'tutorial'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      {
        id: 'page_2',
        userId: 'user_1',
        title: '🐹 Golang Learning Notes',
        icon: '🐹',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Golang Basics' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'My notes on learning Go programming language.' }]
            }
          ]
        },
        parentId: null,
        position: 1,
        publishStatus: 'draft',
        tags: ['golang', 'programming'],
        category: 'golang',
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z'
      }
    ];
  }

  private generateMockConversations(): Conversation[] {
    return [
      {
        id: 'conv_1',
        userId: 'user_1',
        title: 'Learning Golang',
        messages: [
          {
            id: 'msg_1',
            role: 'user',
            content: 'What is Golang?',
            timestamp: '2025-01-01T10:00:00Z'
          },
          {
            id: 'msg_2',
            role: 'assistant',
            content: 'Based on your notes [1], Golang (Go) is a statically typed, compiled programming language designed at Google. It\'s known for its simplicity and efficiency.',
            citations: [
              {
                number: 1,
                pageId: 'page_2',
                pageTitle: 'Golang Learning Notes'
              }
            ],
            followUps: [
              'What are the key features of Go?',
              'How do I get started with Go?'
            ],
            timestamp: '2025-01-01T10:00:05Z'
          }
        ],
        sourcePageIds: ['page_2'],
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:05Z'
      }
    ];
  }

  private generateMockLearningPaths(): LearningPath[] {
    return [
      {
        id: 'path_1',
        userId: 'user_1',
        title: '📚 Golang Learning Path',
        description: 'From beginner to advanced Golang developer',
        icon: '🐹',
        phases: [
          {
            id: 'phase_1',
            title: 'Basics',
            description: 'Learn the fundamentals',
            order: 0,
            pages: [
              {
                pageId: 'page_2',
                title: 'Golang Learning Notes',
                order: 0,
                estimatedTime: 30
              }
            ]
          }
        ],
        progress: {
          completedPageIds: [],
          currentPageId: 'page_2'
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private generateMockNotionConnections(): NotionConnection[] {
    return [];
  }

  private generateMockNotionSyncMappings(): NotionSyncMapping[] {
    return [];
  }
}
