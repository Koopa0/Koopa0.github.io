import { Injectable, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import {
  ChatMessage,
  ChatConversation,
  ChatListResponse,
  SendMessageRequest,
  SendMessageResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private api = inject(ApiService);

  // State
  private currentConversationSignal = signal<ChatConversation | null>(null);
  private messagesSignal = signal<ChatMessage[]>([]);
  private loadingSignal = signal(false);
  private streamingSignal = signal(false);

  // Public readonly signals
  readonly currentConversation = this.currentConversationSignal.asReadonly();
  readonly messages = this.messagesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly streaming = this.streamingSignal.asReadonly();

  /**
   * Get all conversations
   */
  getConversations(): Observable<ChatListResponse> {
    return this.api.get<ChatListResponse>('ai/conversations');
  }

  /**
   * Get all conversations (async)
   */
  async getConversationsAsync(): Promise<ChatConversation[]> {
    this.loadingSignal.set(true);
    try {
      const response = await firstValueFrom(this.getConversations());
      return response.conversations;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get conversation by ID
   */
  getConversation(id: string): Observable<ChatConversation> {
    return this.api.get<ChatConversation>(`ai/conversations/${id}`);
  }

  /**
   * Get conversation by ID (async)
   */
  async getConversationAsync(id: string): Promise<ChatConversation> {
    this.loadingSignal.set(true);
    try {
      const conversation = await firstValueFrom(this.getConversation(id));
      this.currentConversationSignal.set(conversation);
      this.messagesSignal.set(conversation.messages || []);
      return conversation;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Create new conversation
   */
  createConversation(title?: string): Observable<ChatConversation> {
    return this.api.post<ChatConversation>('ai/conversations', { title });
  }

  /**
   * Create new conversation (async)
   */
  async createConversationAsync(title?: string): Promise<ChatConversation> {
    this.loadingSignal.set(true);
    try {
      const conversation = await firstValueFrom(this.createConversation(title));
      this.currentConversationSignal.set(conversation);
      this.messagesSignal.set([]);
      return conversation;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Send message to AI
   */
  sendMessage(conversationId: string, request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.api.post<SendMessageResponse>(`ai/conversations/${conversationId}/messages`, request);
  }

  /**
   * Send message to AI (async)
   */
  async sendMessageAsync(conversationId: string, message: string): Promise<ChatMessage> {
    this.streamingSignal.set(true);
    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        conversationId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      this.messagesSignal.update(messages => [...messages, userMessage]);

      // Send to API
      const response = await firstValueFrom(
        this.sendMessage(conversationId, { message })
      );

      // Add AI response
      this.messagesSignal.update(messages => [...messages, response.message]);

      return response.message;
    } finally {
      this.streamingSignal.set(false);
    }
  }

  /**
   * Delete conversation
   */
  deleteConversation(id: string): Observable<void> {
    return this.api.delete<void>(`ai/conversations/${id}`);
  }

  /**
   * Delete conversation (async)
   */
  async deleteConversationAsync(id: string): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(this.deleteConversation(id));
      if (this.currentConversationSignal()?.id === id) {
        this.currentConversationSignal.set(null);
        this.messagesSignal.set([]);
      }
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Clear current conversation
   */
  clearCurrentConversation(): void {
    this.currentConversationSignal.set(null);
    this.messagesSignal.set([]);
  }
}
