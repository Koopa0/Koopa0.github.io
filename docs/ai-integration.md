# 🤖 AI 整合策略 (Genkit + Gemini + NotebookLM 風格)

## 核心目標

實現 **NotebookLM 風格的 AI 對話助手**:
- ✅ 基於選定頁面的上下文對話 (RAG)
- ✅ 引用透明,可追溯來源 [1][2][3]
- ✅ Hover 預覽引用內容
- ✅ Follow-up 建議
- ✅ 自動摘要與標籤建議
- ✅ 語音對話 (進階)

## 🏗️ 架構設計

### 選項比較: Genkit 前端 vs 後端

#### 選項 A: Genkit 在後端 (推薦 ✅)

```
Frontend (Angular)          Backend (Golang + Genkit)          Gemini API
     │                              │                              │
     │  使用者訊息                   │                              │
     ├──────────────────────────→   │                              │
     │  POST /api/ai/chat            │  1. 檢索相關頁面 (RAG)        │
     │  { message, pageIds }         │  2. 建立 context              │
     │                               │  3. 呼叫 Genkit flow          │
     │                               ├────────────────────────────→ │
     │                               │  4. Streaming 回應            │
     │  Server-Sent Events (SSE)    │←────────────────────────────  │
     │←─────────────────────────────│  5. 解析 Citations            │
     │  逐字回應 + Citations         │  6. 儲存對話記錄              │
     │                               │                              │
```

**優點:**
- ✅ API key 安全 (不暴露給前端)
- ✅ 可以存取資料庫做複雜 RAG
- ✅ 統一管理 rate limiting
- ✅ 對話記錄直接儲存
- ✅ 可以結合其他後端邏輯

**缺點:**
- ⚠️ 需要實現 Golang ↔ Genkit 整合
- ⚠️ 延遲稍高

#### 選項 B: Genkit 在前端

```
Frontend (Angular + Genkit)                  Gemini API
     │                                            │
     │  使用者訊息                                  │
     │────→ Genkit TypeScript SDK                 │
     │      1. 從後端 API 獲取頁面內容              │
     │      2. 建立 context                        │
     │      3. 呼叫 Gemini                         │
     │───────────────────────────────────────────→│
     │      Streaming 回應                         │
     │←───────────────────────────────────────────│
     │      顯示在 UI                              │
```

**優點:**
- ✅ 實現簡單
- ✅ 延遲低 (直接呼叫)
- ✅ 官方 TypeScript SDK 支援好

**缺點:**
- ❌ API key 暴露風險
- ❌ 無法做複雜 RAG
- ❌ 對話記錄需額外儲存

### 🎯 推薦方案: 混合架構

```
複雜 AI 功能 (RAG, 摘要, 自動標籤)
    → 後端 Golang + Genkit

簡單對話功能 (快速問答)
    → 前端 Genkit (透過後端 Proxy)
```

## 🛠️ 後端實現 (Golang + Genkit)

### 1. Genkit Go SDK 整合

```go
// backend/internal/service/ai/genkit.go

package ai

import (
    "context"
    "fmt"

    "github.com/google/genkit/go/ai"
    "github.com/google/genkit/go/plugins/googleai"
)

type GenkitService struct {
    model ai.Model
}

func NewGenkitService(apiKey string) (*GenkitService, error) {
    // 初始化 Genkit
    ctx := context.Background()

    // 註冊 Google AI plugin
    if err := googleai.Init(ctx, googleai.Config{
        APIKey: apiKey,
    }); err != nil {
        return nil, fmt.Errorf("failed to init Genkit: %w", err)
    }

    // 取得 Gemini model
    model := googleai.Model("gemini-2.0-flash")

    return &GenkitService{
        model: model,
    }, nil
}

// RAG Chat Flow
func (s *GenkitService) ChatWithContext(
    ctx context.Context,
    userMessage string,
    contextPages []domain.Page,
    conversationHistory []domain.Message,
) (*ChatResponse, error) {

    // 1. 建立 context prompt
    contextPrompt := s.buildContextPrompt(contextPages)

    // 2. 建立對話歷史
    messages := s.buildMessages(conversationHistory, userMessage)

    // 3. 系統提示詞
    systemPrompt := fmt.Sprintf(`You are an AI assistant in a knowledge management system, similar to NotebookLM.

Your role:
- Answer questions based ONLY on the provided context
- Always cite your sources using [1], [2], [3] format
- If the context doesn't contain the answer, say so
- Provide clear, concise, and accurate responses
- Suggest follow-up questions

Context from user's knowledge base:
%s

When citing:
- Use [1] for the first source, [2] for the second, etc.
- Place citations right after the relevant information
- List all sources at the end`, contextPrompt)

    // 4. 呼叫 Genkit
    req := &ai.GenerateRequest{
        Messages: append([]ai.Message{
            {
                Role:    ai.RoleSystem,
                Content: []*ai.Part{{Text: systemPrompt}},
            },
        }, messages...),
        Config: &ai.GenerationCommonConfig{
            Temperature:     0.7,
            MaxOutputTokens: 2048,
        },
    }

    resp, err := s.model.Generate(ctx, req, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to generate: %w", err)
    }

    // 5. 解析回應並提取 citations
    responseText := resp.Message().Content[0].Text
    citations := s.extractCitations(responseText, contextPages)

    // 6. 生成 follow-up 建議
    followUps := s.generateFollowUps(ctx, userMessage, responseText)

    return &ChatResponse{
        Message:     responseText,
        Citations:   citations,
        FollowUps:   followUps,
        Model:       "gemini-2.0-flash",
        TokensUsed:  resp.Usage().OutputTokens,
    }, nil
}

// 建立 context prompt
func (s *GenkitService) buildContextPrompt(pages []domain.Page) string {
    var builder strings.Builder

    for i, page := range pages {
        builder.WriteString(fmt.Sprintf("\n--- Source [%d]: %s ---\n", i+1, page.Title))

        // 提取純文字內容
        text := extractTextFromTiptapJSON(page.Content)
        builder.WriteString(text)
        builder.WriteString("\n")
    }

    return builder.String()
}

// 建立訊息列表
func (s *GenkitService) buildMessages(history []domain.Message, newMsg string) []ai.Message {
    var messages []ai.Message

    // 添加歷史對話
    for _, msg := range history {
        var role ai.Role
        if msg.Role == "user" {
            role = ai.RoleUser
        } else {
            role = ai.RoleModel
        }

        messages = append(messages, ai.Message{
            Role:    role,
            Content: []*ai.Part{{Text: msg.Content}},
        })
    }

    // 添加新訊息
    messages = append(messages, ai.Message{
        Role:    ai.RoleUser,
        Content: []*ai.Part{{Text: newMsg}},
    })

    return messages
}

// 提取引用
func (s *GenkitService) extractCitations(text string, pages []domain.Page) []Citation {
    var citations []Citation

    // 正則匹配 [1], [2] 等
    re := regexp.MustCompile(`\[(\d+)\]`)
    matches := re.FindAllStringSubmatch(text, -1)

    seen := make(map[int]bool)
    for _, match := range matches {
        num, _ := strconv.Atoi(match[1])
        if num > 0 && num <= len(pages) && !seen[num] {
            page := pages[num-1]
            citations = append(citations, Citation{
                Number:   num,
                PageID:   page.ID,
                PageTitle: page.Title,
                // 可以添加具體段落的引用
            })
            seen[num] = true
        }
    }

    return citations
}

// 生成 follow-up 建議
func (s *GenkitService) generateFollowUps(ctx context.Context, question, answer string) []string {
    prompt := fmt.Sprintf(`Based on this Q&A, suggest 3 short follow-up questions:

Q: %s
A: %s

Respond with ONLY 3 questions, one per line, no numbering.`, question, answer)

    req := &ai.GenerateRequest{
        Messages: []ai.Message{
            {
                Role:    ai.RoleUser,
                Content: []*ai.Part{{Text: prompt}},
            },
        },
        Config: &ai.GenerationCommonConfig{
            Temperature:     0.8,
            MaxOutputTokens: 200,
        },
    }

    resp, err := s.model.Generate(ctx, req, nil)
    if err != nil {
        return []string{}
    }

    text := resp.Message().Content[0].Text
    return strings.Split(strings.TrimSpace(text), "\n")
}
```

### 2. RAG 實現 (Retrieval Augmented Generation)

```go
// backend/internal/service/ai/rag.go

type RAGService struct {
    pageRepo    repository.PageRepository
    embedding   *EmbeddingService
    vectorStore *pgvector.VectorStore
}

// 智能檢索相關頁面
func (s *RAGService) RetrieveRelevantPages(
    ctx context.Context,
    query string,
    sourcePageIDs []uuid.UUID,
    limit int,
) ([]domain.Page, error) {

    // 策略 1: 如果使用者指定了 source pages,直接使用
    if len(sourcePageIDs) > 0 {
        return s.pageRepo.GetByIDs(ctx, sourcePageIDs)
    }

    // 策略 2: 使用向量搜尋找相關頁面
    queryEmbedding, err := s.embedding.Embed(ctx, query)
    if err != nil {
        return nil, err
    }

    // 向量搜尋
    pageIDs, err := s.vectorStore.SimilaritySearch(ctx, queryEmbedding, limit)
    if err != nil {
        return nil, err
    }

    return s.pageRepo.GetByIDs(ctx, pageIDs)
}

// Embedding 服務
type EmbeddingService struct {
    client *googleai.Client
}

func (s *EmbeddingService) Embed(ctx context.Context, text string) ([]float32, error) {
    // 使用 Gemini Embedding API
    resp, err := s.client.EmbedContent(ctx, &googleai.EmbedContentRequest{
        Model: "models/text-embedding-004",
        Content: &googleai.Content{
            Parts: []googleai.Part{googleai.Text(text)},
        },
    })
    if err != nil {
        return nil, err
    }

    return resp.Embedding.Values, nil
}

// 批次嵌入頁面
func (s *EmbeddingService) EmbedPages(ctx context.Context, pages []domain.Page) error {
    for _, page := range pages {
        // 提取文字
        text := extractTextFromTiptapJSON(page.Content)

        // 生成 embedding
        embedding, err := s.Embed(ctx, page.Title+" "+text)
        if err != nil {
            log.Error("Failed to embed page", "pageId", page.ID, "error", err)
            continue
        }

        // 儲存到資料庫
        if err := s.pageRepo.UpdateEmbedding(ctx, page.ID, embedding); err != nil {
            log.Error("Failed to update embedding", "pageId", page.ID, "error", err)
        }
    }

    return nil
}
```

### 3. pgvector 向量搜尋

```go
// backend/internal/repository/postgres/vector.go

type VectorStore struct {
    db *sqlx.DB
}

// 相似度搜尋
func (s *VectorStore) SimilaritySearch(
    ctx context.Context,
    queryEmbedding []float32,
    limit int,
) ([]uuid.UUID, error) {

    query := `
        SELECT id
        FROM pages
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1
        LIMIT $2
    `

    var pageIDs []uuid.UUID
    err := s.db.SelectContext(ctx, &pageIDs, query, pgvector.NewVector(queryEmbedding), limit)
    if err != nil {
        return nil, err
    }

    return pageIDs, nil
}

// 更新 embedding
func (r *PageRepository) UpdateEmbedding(ctx context.Context, pageID uuid.UUID, embedding []float32) error {
    query := `
        UPDATE pages
        SET embedding = $1, updated_at = NOW()
        WHERE id = $2
    `

    _, err := r.db.ExecContext(ctx, query, pgvector.NewVector(embedding), pageID)
    return err
}
```

### 4. Streaming 回應 (Server-Sent Events)

```go
// backend/internal/api/handlers/ai.go

func (h *AIHandler) StreamChat(c *gin.Context) {
    var req ChatRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // 設定 SSE headers
    c.Writer.Header().Set("Content-Type", "text/event-stream")
    c.Writer.Header().Set("Cache-Control", "no-cache")
    c.Writer.Header().Set("Connection", "keep-alive")

    // 建立 streaming channel
    stream := make(chan string)

    // 在 goroutine 中生成回應
    go func() {
        defer close(stream)

        // 呼叫 AI service (streaming mode)
        err := h.aiService.StreamChatWithContext(
            c.Request.Context(),
            req.Message,
            req.SourcePageIDs,
            req.ConversationID,
            func(chunk string) {
                stream <- chunk
            },
        )

        if err != nil {
            stream <- fmt.Sprintf("error: %v", err)
        }
    }()

    // 將 chunks 發送到前端
    c.Stream(func(w io.Writer) bool {
        if msg, ok := <-stream; ok {
            c.SSEvent("message", msg)
            return true
        }
        return false
    })
}

// AI Service - Streaming 版本
func (s *AIService) StreamChatWithContext(
    ctx context.Context,
    userMessage string,
    sourcePageIDs []uuid.UUID,
    conversationID uuid.UUID,
    onChunk func(string),
) error {

    // 1. RAG 檢索
    pages, err := s.ragService.RetrieveRelevantPages(ctx, userMessage, sourcePageIDs, 5)
    if err != nil {
        return err
    }

    // 2. 建立 streaming request
    req := s.buildStreamingRequest(userMessage, pages)

    // 3. 呼叫 Genkit streaming API
    stream, err := s.genkitService.model.Generate(ctx, req, nil)
    if err != nil {
        return err
    }

    var fullResponse strings.Builder

    // 4. 逐 chunk 發送
    for chunk := range stream {
        text := chunk.Content[0].Text
        fullResponse.WriteString(text)
        onChunk(text)
    }

    // 5. 儲存完整對話
    s.saveConversation(ctx, conversationID, userMessage, fullResponse.String())

    return nil
}
```

## 🎨 前端實現 (Angular)

### 1. AI Chat 元件

```typescript
// frontend/workspace/ai-chat/chat-panel.component.ts

@Component({
  selector: 'app-ai-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-panel">
      <!-- Header -->
      <div class="chat-header">
        <h3>🤖 AI Assistant</h3>
        <button (click)="close()">✕</button>
      </div>

      <!-- Source Selector -->
      <div class="source-selector">
        <h4>📚 Sources</h4>
        @for (page of availablePages(); track page.id) {
          <label>
            <input
              type="checkbox"
              [(ngModel)]="selectedPageIds"
              [value]="page.id"
            />
            {{ page.title }}
          </label>
        }
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" #messagesContainer>
        @for (msg of messages(); track msg.id) {
          <div [class]="'message message-' + msg.role">
            @if (msg.role === 'user') {
              <div class="message-content">
                {{ msg.content }}
              </div>
            } @else {
              <div class="message-content">
                <!-- Render with citations -->
                <div [innerHTML]="renderWithCitations(msg.content, msg.citations)"></div>

                <!-- Citations List -->
                @if (msg.citations && msg.citations.length > 0) {
                  <div class="citations">
                    <h5>Sources:</h5>
                    @for (citation of msg.citations; track citation.number) {
                      <div class="citation-item">
                        [{{ citation.number }}]
                        <a [routerLink]="['/workspace/pages', citation.pageId]">
                          {{ citation.pageTitle }}
                        </a>
                      </div>
                    }
                  </div>
                }

                <!-- Follow-up Suggestions -->
                @if (msg.followUps && msg.followUps.length > 0) {
                  <div class="follow-ups">
                    <p>💡 You might also want to ask:</p>
                    @for (followUp of msg.followUps; track followUp) {
                      <button
                        class="follow-up-btn"
                        (click)="sendMessage(followUp)"
                      >
                        {{ followUp }}
                      </button>
                    }
                  </div>
                }
              </div>
            }

            <div class="message-meta">
              {{ msg.timestamp | date:'short' }}
            </div>
          </div>
        }

        @if (isStreaming()) {
          <div class="message message-assistant">
            <div class="message-content">
              {{ streamingText() }}
              <span class="cursor">|</span>
            </div>
          </div>
        }
      </div>

      <!-- Input -->
      <div class="chat-input">
        <textarea
          [(ngModel)]="inputMessage"
          (keydown.enter)="onEnterPress($event)"
          placeholder="Ask anything about your notes..."
          [disabled]="isStreaming()"
        ></textarea>
        <button
          (click)="sendMessage(inputMessage())"
          [disabled]="!inputMessage() || isStreaming()"
        >
          Send
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-panel {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: white;
      border-left: 1px solid #e5e7eb;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .message {
      margin-bottom: 1rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
    }

    .message-user {
      background: #3b82f6;
      color: white;
      margin-left: 20%;
    }

    .message-assistant {
      background: #f3f4f6;
      margin-right: 20%;
    }

    .citations {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
    }

    .citation-item {
      margin: 0.25rem 0;
    }

    .follow-ups {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #eff6ff;
      border-radius: 0.375rem;
    }

    .follow-up-btn {
      display: block;
      width: 100%;
      text-align: left;
      padding: 0.5rem;
      margin: 0.25rem 0;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .follow-up-btn:hover {
      background: #f9fafb;
    }

    .cursor {
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `]
})
export class AIChatPanelComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  availablePages = signal<Page[]>([]);
  selectedPageIds = signal<string[]>([]);
  messages = signal<ChatMessage[]>([]);
  inputMessage = signal('');
  isStreaming = signal(false);
  streamingText = signal('');

  conversationId = signal<string | null>(null);

  constructor() {
    // 載入可用頁面
    this.loadAvailablePages();

    // 如果在頁面編輯器中,自動選擇當前頁面
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.selectedPageIds.update(ids => [...ids, params['id']]);
      }
    });
  }

  async sendMessage(text: string) {
    if (!text.trim()) return;

    // 添加使用者訊息
    const userMsg: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.inputMessage.set('');
    this.isStreaming.set(true);
    this.streamingText.set('');

    try {
      // 建立 EventSource 連接
      const eventSource = new EventSource(
        `/api/ai/chat/stream?` + new URLSearchParams({
          message: text,
          sourcePageIds: this.selectedPageIds().join(','),
          conversationId: this.conversationId() || ''
        })
      );

      let fullResponse = '';

      eventSource.onmessage = (event) => {
        const chunk = event.data;
        fullResponse += chunk;
        this.streamingText.set(fullResponse);
      };

      eventSource.addEventListener('done', (event: any) => {
        const data = JSON.parse(event.data);

        // 添加 AI 回應
        const aiMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content: fullResponse,
          citations: data.citations,
          followUps: data.followUps,
          timestamp: new Date()
        };

        this.messages.update(msgs => [...msgs, aiMsg]);
        this.isStreaming.set(false);
        this.streamingText.set('');
        eventSource.close();

        // 儲存 conversation ID
        if (data.conversationId) {
          this.conversationId.set(data.conversationId);
        }
      });

      eventSource.onerror = () => {
        this.isStreaming.set(false);
        eventSource.close();
      };

    } catch (error) {
      console.error('Chat error:', error);
      this.isStreaming.set(false);
    }
  }

  renderWithCitations(text: string, citations: Citation[] = []): string {
    // 將 [1] [2] 轉換為可點擊的引用
    return text.replace(/\[(\d+)\]/g, (match, num) => {
      const citation = citations.find(c => c.number === parseInt(num));
      if (citation) {
        return `<sup class="citation" data-page-id="${citation.pageId}" title="${citation.pageTitle}">${match}</sup>`;
      }
      return match;
    });
  }

  async loadAvailablePages() {
    const pages = await this.api.get<Page[]>('/api/pages');
    this.availablePages.set(pages);
  }
}
```

### 2. Citation Hover 預覽

```typescript
// frontend/workspace/ai-chat/citation-preview.directive.ts

@Directive({
  selector: '[citationPreview]',
  standalone: true
})
export class CitationPreviewDirective {
  private api = inject(ApiService);
  private overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  @HostListener('mouseenter')
  async show() {
    const pageId = this.el.nativeElement.dataset.pageId;
    if (!pageId) return;

    // 獲取頁面預覽
    const preview = await this.api.get(`/api/pages/${pageId}/preview`);

    // 顯示 overlay
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.el)
        .withPositions([...])
    });

    const portal = new ComponentPortal(CitationPreviewComponent);
    const ref = this.overlayRef.attach(portal);
    ref.instance.preview = preview;
  }

  @HostListener('mouseleave')
  hide() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
```

## 🚀 進階功能

### 1. 自動摘要

```go
func (s *AIService) GenerateSummary(ctx context.Context, pageID uuid.UUID) (string, error) {
    page, err := s.pageRepo.GetByID(ctx, pageID)
    if err != nil {
        return "", err
    }

    text := extractTextFromTiptapJSON(page.Content)

    prompt := fmt.Sprintf(`Summarize the following text in 2-3 sentences:

%s

Summary:`, text)

    resp, err := s.genkitService.Generate(ctx, prompt)
    if err != nil {
        return "", err
    }

    return resp.Text, nil
}
```

### 2. 自動標籤建議

```go
func (s *AIService) SuggestTags(ctx context.Context, pageID uuid.UUID) ([]string, error) {
    page, err := s.pageRepo.GetByID(ctx, pageID)
    if err != nil {
        return nil, err
    }

    text := extractTextFromTiptapJSON(page.Content)

    prompt := fmt.Sprintf(`Analyze this text and suggest 3-5 relevant tags:

Title: %s

Content: %s

Respond with ONLY comma-separated tags, no explanations.`, page.Title, text)

    resp, err := s.genkitService.Generate(ctx, prompt)
    if err != nil {
        return nil, err
    }

    tags := strings.Split(resp.Text, ",")
    for i := range tags {
        tags[i] = strings.TrimSpace(tags[i])
    }

    return tags, nil
}
```

### 3. 語音對話 (進階)

```typescript
// 使用 Web Speech API

@Component({...})
export class VoiceChat component {
  private recognition: any;

  startVoiceInput() {
    const SpeechRecognition = (window as any).SpeechRecognition ||
                               (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-TW';
    this.recognition.continuous = false;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.sendMessage(transcript);
    };

    this.recognition.start();
  }

  speakResponse(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    speechSynthesis.speak(utterance);
  }
}
```

## 📊 效能優化

### 1. Embedding 快取

```go
// 只在內容變更時重新生成 embedding
func (s *PageService) UpdatePage(ctx context.Context, page *domain.Page) error {
    oldPage, _ := s.repo.GetByID(ctx, page.ID)

    // 檢查內容是否變更
    if !contentEquals(oldPage.Content, page.Content) {
        // 異步更新 embedding
        go s.embeddingService.EmbedPage(context.Background(), page)
    }

    return s.repo.Update(ctx, page)
}
```

### 2. 對話歷史壓縮

```go
// 只保留最近 N 輪對話
func (s *AIService) compressHistory(messages []domain.Message) []domain.Message {
    maxMessages := 20  // 保留 10 輪對話
    if len(messages) <= maxMessages {
        return messages
    }
    return messages[len(messages)-maxMessages:]
}
```

## 🎯 API 端點

```go
// AI 相關 API

POST /api/ai/chat                # 普通對話
POST /api/ai/chat/stream         # Streaming 對話
GET  /api/ai/conversations       # 列出對話
GET  /api/ai/conversations/:id   # 獲取對話
DELETE /api/ai/conversations/:id # 刪除對話

POST /api/ai/pages/:id/summary   # 生成摘要
POST /api/ai/pages/:id/tags      # 建議標籤
POST /api/ai/pages/:id/related   # 找相關頁面

POST /api/ai/embeddings/batch    # 批次生成 embeddings
```

這個設計實現了完整的 NotebookLM 風格 AI 助手!
