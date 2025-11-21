import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import {
  User,
  AuthResponse,
  Page,
  TiptapContent,
  PageListResponse,
  Conversation,
  ChatResponse
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
    conversations: this.generateMockConversations()
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
    // Legacy chat endpoint
    if (endpoint === 'ai/chat' && method === 'POST') {
      return this.mockChat(body);
    }

    // Get all conversations
    if (endpoint === 'ai/conversations' && method === 'GET') {
      return { conversations: this.mockData.conversations };
    }

    // Create new conversation
    if (endpoint === 'ai/conversations' && method === 'POST') {
      return this.mockCreateConversation(body);
    }

    // Get single conversation
    const conversationMatch = endpoint.match(/^ai\/conversations\/([^\/]+)$/);
    if (conversationMatch && method === 'GET') {
      const convId = conversationMatch[1];
      const conversation = this.mockData.conversations.find(c => c.id === convId);
      if (!conversation) {
        throw { status: 404, message: 'Conversation not found' };
      }
      return conversation;
    }

    // Delete conversation
    if (conversationMatch && method === 'DELETE') {
      const convId = conversationMatch[1];
      return this.mockDeleteConversation(convId);
    }

    // Send message to conversation
    const messageMatch = endpoint.match(/^ai\/conversations\/([^\/]+)\/messages$/);
    if (messageMatch && method === 'POST') {
      const convId = messageMatch[1];
      return this.mockSendMessage(convId, body);
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

  private mockCreateConversation(data: any): any {
    const newConversation: any = {
      id: 'conv_' + Date.now(),
      userId: this.currentUser?.id || 'user_1',
      title: data.title || 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockData.conversations.push(newConversation);
    return newConversation;
  }

  private mockDeleteConversation(convId: string): void {
    const index = this.mockData.conversations.findIndex((c: any) => c.id === convId);
    if (index === -1) {
      throw { status: 404, message: 'Conversation not found' };
    }

    this.mockData.conversations.splice(index, 1);
  }

  private mockSendMessage(convId: string, data: any): any {
    const conversation = this.mockData.conversations.find((c: any) => c.id === convId);
    if (!conversation) {
      throw { status: 404, message: 'Conversation not found' };
    }

    // Generate AI response with citations
    const aiMessage: any = {
      id: 'msg_' + Date.now(),
      conversationId: convId,
      role: 'assistant',
      content: `Based on your question "${data.message}", here's what I found in your knowledge base [1][2]:\n\nThis is a mock AI response demonstrating the NotebookLM-style chat interface. When you connect the real Golang backend with Gemini + Genkit, this will provide intelligent answers based on your actual page content using RAG (Retrieval-Augmented Generation).\n\nKey points:\n- The AI can reference specific pages from your knowledge base\n- Citations are numbered and link to source pages\n- Follow-up questions help continue the conversation\n- All responses are context-aware based on your notes`,
      citations: [
        {
          number: 1,
          pageId: this.mockData.pages[0]?.id || 'page_1',
          pageTitle: this.mockData.pages[0]?.title || 'Getting Started',
          excerpt: 'Relevant excerpt from the page that supports the answer...'
        },
        {
          number: 2,
          pageId: this.mockData.pages[1]?.id || 'page_2',
          pageTitle: this.mockData.pages[1]?.title || 'Golang Notes',
          excerpt: 'Another relevant excerpt providing additional context...'
        }
      ],
      followUps: [
        'Can you explain this in more detail?',
        'What are some practical examples?',
        'How does this compare to other approaches?'
      ],
      timestamp: new Date().toISOString()
    };

    // Add message to conversation (cast to any to avoid type issues)
    if (!conversation.messages) {
      conversation.messages = [];
    }
    conversation.messages.push(aiMessage);
    conversation.updatedAt = new Date().toISOString();

    return { message: aiMessage };
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

}
