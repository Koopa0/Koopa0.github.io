---
title: "Transformer 架構深度解析"
date: "2025-11-09"
tags: ["ai"]
description: "深入理解 Transformer 模型的核心機制，包含自注意力機制、位置編碼和多頭注意力的實作細節。"
---

# Transformer 架構深度解析

Transformer 是現代 AI 的基石，從 GPT 到 BERT 都基於此架構。本文深入探討其核心機制。

## Transformer 概述

Transformer 由 Google 在 2017 年的論文《Attention Is All You Need》提出，完全基於注意力機制，拋棄了 RNN 和 CNN。

### 核心優勢

1. **並行化**：可同時處理所有位置
2. **長距離依賴**：有效捕捉長距離關係
3. **可擴展性**：適合大規模訓練

## 自注意力機制（Self-Attention）

自注意力讓模型關注輸入序列中的不同位置。

### 數學公式

```
Attention(Q, K, V) = softmax(QK^T / √d_k) V
```

其中：
- Q (Query)：查詢向量
- K (Key)：鍵向量
- V (Value)：值向量
- d_k：鍵的維度

### Python 實作

```python
import torch
import torch.nn as nn
import math

class SelfAttention(nn.Module):
    def __init__(self, embed_size, heads):
        super(SelfAttention, self).__init__()
        self.embed_size = embed_size
        self.heads = heads
        self.head_dim = embed_size // heads

        assert (
            self.head_dim * heads == embed_size
        ), "Embed size needs to be divisible by heads"

        self.values = nn.Linear(embed_size, embed_size)
        self.keys = nn.Linear(embed_size, embed_size)
        self.queries = nn.Linear(embed_size, embed_size)
        self.fc_out = nn.Linear(embed_size, embed_size)

    def forward(self, values, keys, query, mask):
        N = query.shape[0]
        value_len, key_len, query_len = values.shape[1], keys.shape[1], query.shape[1]

        # Split embedding into self.heads pieces
        values = self.values(values)
        keys = self.keys(keys)
        queries = self.queries(query)

        values = values.reshape(N, value_len, self.heads, self.head_dim)
        keys = keys.reshape(N, key_len, self.heads, self.head_dim)
        queries = queries.reshape(N, query_len, self.heads, self.head_dim)

        # Scaled dot-product attention
        energy = torch.einsum("nqhd,nkhd->nhqk", [queries, keys])
        # energy shape: (N, heads, query_len, key_len)

        if mask is not None:
            energy = energy.masked_fill(mask == 0, float("-1e20"))

        attention = torch.softmax(energy / (self.embed_size ** (1 / 2)), dim=3)

        out = torch.einsum("nhql,nlhd->nqhd", [attention, values])
        out = out.reshape(N, query_len, self.heads * self.head_dim)

        out = self.fc_out(out)
        return out
```

## 多頭注意力（Multi-Head Attention）

多頭注意力允許模型從不同角度關注資訊。

### 視覺化範例

```
Input: "The cat sat on the mat"

Head 1: 關注語法關係
  The → cat
  cat → sat
  sat → on

Head 2: 關注語義關係
  cat → mat
  sat → mat

Head 3: 關注位置關係
  The → on → mat
```

### 實作

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, embed_size, heads):
        super(MultiHeadAttention, self).__init__()
        self.embed_size = embed_size
        self.heads = heads
        self.head_dim = embed_size // heads

        self.queries = nn.Linear(embed_size, embed_size)
        self.keys = nn.Linear(embed_size, embed_size)
        self.values = nn.Linear(embed_size, embed_size)
        self.fc_out = nn.Linear(embed_size, embed_size)

    def forward(self, query, key, value, mask):
        N = query.shape[0]
        query_len, key_len, value_len = query.shape[1], key.shape[1], value.shape[1]

        # Linear projections
        Q = self.queries(query)
        K = self.keys(key)
        V = self.values(value)

        # Split into multiple heads
        Q = Q.reshape(N, query_len, self.heads, self.head_dim)
        K = K.reshape(N, key_len, self.heads, self.head_dim)
        V = V.reshape(N, value_len, self.heads, self.head_dim)

        # Scaled dot-product attention
        scores = torch.einsum("nqhd,nkhd->nhqk", [Q, K])
        scores = scores / math.sqrt(self.head_dim)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attention = torch.softmax(scores, dim=-1)
        out = torch.einsum("nhqk,nvhd->nqhd", [attention, V])

        # Concatenate heads
        out = out.reshape(N, query_len, self.embed_size)
        out = self.fc_out(out)
        return out
```

## 位置編碼（Positional Encoding）

Transformer 需要位置資訊，因為它沒有內建的順序概念。

### 公式

```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

### 實作

```python
class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super(PositionalEncoding, self).__init__()

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)

        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]
```

## Feed-Forward Network

每個 Transformer 層包含一個前饋網路。

```python
class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super(FeedForward, self).__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.dropout = nn.Dropout(dropout)
        self.linear2 = nn.Linear(d_ff, d_model)

    def forward(self, x):
        return self.linear2(self.dropout(torch.relu(self.linear1(x))))
```

## 完整的 Transformer Block

```python
class TransformerBlock(nn.Module):
    def __init__(self, embed_size, heads, dropout, forward_expansion):
        super(TransformerBlock, self).__init__()
        self.attention = MultiHeadAttention(embed_size, heads)
        self.norm1 = nn.LayerNorm(embed_size)
        self.norm2 = nn.LayerNorm(embed_size)

        self.feed_forward = nn.Sequential(
            nn.Linear(embed_size, forward_expansion * embed_size),
            nn.ReLU(),
            nn.Linear(forward_expansion * embed_size, embed_size),
        )

        self.dropout = nn.Dropout(dropout)

    def forward(self, value, key, query, mask):
        attention = self.attention(query, key, value, mask)

        # Add & Norm
        x = self.dropout(self.norm1(attention + query))

        forward = self.feed_forward(x)

        # Add & Norm
        out = self.dropout(self.norm2(forward + x))
        return out
```

## Encoder-Decoder 架構

### Encoder

```python
class Encoder(nn.Module):
    def __init__(
        self,
        src_vocab_size,
        embed_size,
        num_layers,
        heads,
        device,
        forward_expansion,
        dropout,
        max_length,
    ):
        super(Encoder, self).__init__()
        self.embed_size = embed_size
        self.device = device
        self.word_embedding = nn.Embedding(src_vocab_size, embed_size)
        self.position_encoding = PositionalEncoding(embed_size, max_length)

        self.layers = nn.ModuleList(
            [
                TransformerBlock(
                    embed_size,
                    heads,
                    dropout=dropout,
                    forward_expansion=forward_expansion,
                )
                for _ in range(num_layers)
            ]
        )

        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask):
        out = self.dropout(self.position_encoding(self.word_embedding(x)))

        for layer in self.layers:
            out = layer(out, out, out, mask)

        return out
```

## 訓練技巧

### 1. Learning Rate Schedule

```python
class NoamOpt:
    def __init__(self, model_size, factor, warmup, optimizer):
        self.optimizer = optimizer
        self._step = 0
        self.warmup = warmup
        self.factor = factor
        self.model_size = model_size
        self._rate = 0

    def step(self):
        self._step += 1
        rate = self.rate()
        for p in self.optimizer.param_groups:
            p['lr'] = rate
        self._rate = rate
        self.optimizer.step()

    def rate(self, step=None):
        if step is None:
            step = self._step
        return self.factor * (
            self.model_size ** (-0.5) *
            min(step ** (-0.5), step * self.warmup ** (-1.5))
        )
```

### 2. Label Smoothing

```python
class LabelSmoothing(nn.Module):
    def __init__(self, size, smoothing=0.0):
        super(LabelSmoothing, self).__init__()
        self.criterion = nn.KLDivLoss(reduction='sum')
        self.confidence = 1.0 - smoothing
        self.smoothing = smoothing
        self.size = size

    def forward(self, x, target):
        true_dist = x.data.clone()
        true_dist.fill_(self.smoothing / (self.size - 2))
        true_dist.scatter_(1, target.data.unsqueeze(1), self.confidence)
        return self.criterion(x, true_dist)
```

## 應用

### 1. 機器翻譯
```
Input:  "Hello, how are you?"
Output: "你好，你好嗎？"
```

### 2. 文本生成 (GPT)
```
Prompt: "Once upon a time"
Output: "Once upon a time, in a land far away..."
```

### 3. 文本分類 (BERT)
```
Input:  "This movie is amazing!"
Output: Positive (0.95)
```

## 結論

Transformer 的成功在於：

1. **注意力機制**：有效建模長距離依賴
2. **並行化**：訓練速度快
3. **可擴展性**：可堆疊多層

理解 Transformer 是掌握現代 NLP 的關鍵！
