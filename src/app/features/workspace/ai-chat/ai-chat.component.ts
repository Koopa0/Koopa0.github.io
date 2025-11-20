import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiChatService } from '../../../core/services/ai-chat.service';
import { ChatConversation, ChatMessage, Citation } from '../../../core/models';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="h-full flex bg-gray-50 dark:bg-gray-950">
      <!-- Sidebar - Conversations List -->
      <aside class="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            (click)="createNewConversation()"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        <!-- Conversations List -->
        <div class="flex-1 overflow-y-auto">
          @if (conversationsLoading()) {
            <div class="p-4 space-y-2">
              @for (i of [1,2,3]; track i) {
                <div class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
              }
            </div>
          } @else if (conversations().length === 0) {
            <div class="p-8 text-center">
              <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p class="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
            </div>
          } @else {
            <div class="p-2">
              @for (conv of conversations(); track conv.id) {
                <button
                  (click)="selectConversation(conv)"
                  [class.bg-blue-50]="currentConversation()?.id === conv.id"
                  [class.dark:bg-blue-900/20]="currentConversation()?.id === conv.id"
                  [class.border-blue-200]="currentConversation()?.id === conv.id"
                  [class.dark:border-blue-800]="currentConversation()?.id === conv.id"
                  class="w-full p-3 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group mb-2"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                        {{ conv.title }}
                      </h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ formatDate(conv.updatedAt) }}
                      </p>
                    </div>
                    <button
                      (click)="deleteConversation($event, conv)"
                      class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
                    >
                      <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </button>
              }
            </div>
          }
        </div>
      </aside>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col">
        @if (!currentConversation()) {
          <!-- Welcome Screen -->
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-center max-w-2xl">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                AI Knowledge Assistant
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mb-8">
                Ask questions about your knowledge base. Get answers with citations and references to your pages.
              </p>

              <!-- Suggested Questions -->
              <div class="space-y-3">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Try asking:</p>
                @for (question of suggestedQuestions; track question) {
                  <button
                    (click)="askSuggestedQuestion(question)"
                    class="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                  >
                    <div class="flex items-center gap-3">
                      <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {{ question }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            </div>
          </div>
        } @else {
          <!-- Chat Messages -->
          <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-4xl mx-auto space-y-6">
              @for (message of messages(); track message.id) {
                <div
                  [class.justify-end]="message.role === 'user'"
                  class="flex"
                >
                  @if (message.role === 'user') {
                    <!-- User Message -->
                    <div class="max-w-[80%] bg-blue-600 text-white rounded-2xl px-5 py-3">
                      <p class="whitespace-pre-wrap">{{ message.content }}</p>
                    </div>
                  } @else {
                    <!-- AI Message -->
                    <div class="max-w-[80%]">
                      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4">
                        <p class="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                          {{ message.content }}
                        </p>

                        <!-- Citations -->
                        @if (message.citations && message.citations.length > 0) {
                          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sources:</p>
                            <div class="space-y-2">
                              @for (citation of message.citations; track citation.number) {
                                <a
                                  [routerLink]="['/workspace/pages', citation.pageId]"
                                  class="block p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                >
                                  <div class="flex items-start gap-3">
                                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center">
                                      {{ citation.number }}
                                    </span>
                                    <div class="flex-1 min-w-0">
                                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {{ citation.pageTitle }}
                                      </p>
                                      @if (citation.excerpt) {
                                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                          {{ citation.excerpt }}
                                        </p>
                                      }
                                    </div>
                                    <svg class="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </a>
                              }
                            </div>
                          </div>
                        }

                        <!-- Follow-up Questions -->
                        @if (message.followUps && message.followUps.length > 0) {
                          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Ask next:</p>
                            <div class="flex flex-wrap gap-2">
                              @for (followUp of message.followUps; track followUp) {
                                <button
                                  (click)="askFollowUpQuestion(followUp)"
                                  class="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  {{ followUp }}
                                </button>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Streaming Indicator -->
              @if (streaming()) {
                <div class="flex">
                  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4">
                    <div class="flex items-center gap-2">
                      <div class="flex gap-1">
                        <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                        <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                      </div>
                      <span class="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Input Area -->
          <div class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div class="max-w-4xl mx-auto">
              <form (submit)="sendMessage($event)" class="flex gap-3">
                <input
                  type="text"
                  [(ngModel)]="messageInput"
                  name="message"
                  placeholder="Ask a question about your knowledge base..."
                  [disabled]="streaming()"
                  class="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  [disabled]="!messageInput.trim() || streaming()"
                  class="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AiChatComponent implements OnInit {
  private chatService = inject(AiChatService);

  // State
  conversations = signal<ChatConversation[]>([]);
  conversationsLoading = signal(false);
  currentConversation = this.chatService.currentConversation;
  messages = this.chatService.messages;
  streaming = this.chatService.streaming;

  // Input
  messageInput = '';

  // Suggested questions for welcome screen
  suggestedQuestions = [
    'What topics are covered in my knowledge base?',
    'Summarize my notes on Golang',
    'What are the key points from my learning paths?',
    'Find information about system design'
  ];

  async ngOnInit() {
    await this.loadConversations();
  }

  private async loadConversations() {
    this.conversationsLoading.set(true);
    try {
      const convs = await this.chatService.getConversationsAsync();
      this.conversations.set(convs);
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      this.conversationsLoading.set(false);
    }
  }

  async createNewConversation() {
    try {
      const conversation = await this.chatService.createConversationAsync('New Chat');
      this.conversations.update(convs => [conversation, ...convs]);
    } catch (error) {
      console.error('Failed to create conversation', error);
      alert('Failed to create new conversation. Please try again.');
    }
  }

  async selectConversation(conversation: ChatConversation) {
    try {
      await this.chatService.getConversationAsync(conversation.id);
    } catch (error) {
      console.error('Failed to load conversation', error);
      alert('Failed to load conversation. Please try again.');
    }
  }

  async deleteConversation(event: Event, conversation: ChatConversation) {
    event.stopPropagation();

    if (confirm(`Delete conversation "${conversation.title}"?`)) {
      try {
        await this.chatService.deleteConversationAsync(conversation.id);
        this.conversations.update(convs => convs.filter(c => c.id !== conversation.id));
      } catch (error) {
        console.error('Failed to delete conversation', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  }

  async askSuggestedQuestion(question: string) {
    // Create new conversation and ask question
    await this.createNewConversation();
    if (this.currentConversation()) {
      this.messageInput = question;
      await this.sendMessageInternal();
    }
  }

  async askFollowUpQuestion(question: string) {
    this.messageInput = question;
    await this.sendMessageInternal();
  }

  async sendMessage(event: Event) {
    event.preventDefault();
    await this.sendMessageInternal();
  }

  private async sendMessageInternal() {
    if (!this.messageInput.trim() || !this.currentConversation()) {
      return;
    }

    const message = this.messageInput.trim();
    this.messageInput = '';

    try {
      await this.chatService.sendMessageAsync(this.currentConversation()!.id, message);

      // Update conversation title if it's the first message
      if (this.messages().length === 2) {
        // Update the title in the list
        this.conversations.update(convs =>
          convs.map(c =>
            c.id === this.currentConversation()!.id
              ? { ...c, title: message.substring(0, 50) + (message.length > 50 ? '...' : '') }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message', error);
      alert('Failed to send message. Please try again.');
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }
}
