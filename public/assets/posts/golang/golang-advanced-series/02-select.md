---
title: "Golang 進階系列 (2) - Select 語句與並發控制"
date: "2024-01-22"
tags: ["Concurrency", "Select"]
description: "深入理解 select 語句的工作原理和並發控制模式"
---

# Golang 進階系列 (2) - Select 語句與並發控制

## 前言

上一篇我們學習了 Channel 的基礎和實現原理，本篇將探討 `select` 語句如何優雅地處理多個 Channel 操作。

## Select 基礎

`select` 語句讓 goroutine 可以同時等待多個通訊操作。

### 基本語法

```go
select {
case msg1 := <-ch1:
    fmt.Println("Received:", msg1)
case msg2 := <-ch2:
    fmt.Println("Received:", msg2)
case ch3 <- value:
    fmt.Println("Sent value")
default:
    fmt.Println("No activity")
}
```

### Select 特性

1. **隨機選擇** - 當多個 case 同時就緒時，隨機選擇一個執行
2. **阻塞行為** - 沒有 default 時會阻塞，直到某個 case 就緒
3. **Default 子句** - 提供非阻塞行為

## 實現原理

### Select 的執行流程

```go
// 編譯器會將 select 轉換為類似這樣的代碼
func selectgo(cas []scase) (int, bool) {
    // 1. 隨機打亂 case 順序
    // 2. 鎖定所有 channel
    // 3. 檢查是否有就緒的 case
    // 4. 如果沒有，進入等待狀態
    // 5. 被喚醒後，再次檢查並執行相應的 case
}
```

## 常見模式

### 1. Timeout 模式

```go
select {
case result := <-ch:
    fmt.Println("Received:", result)
case <-time.After(time.Second):
    fmt.Println("Timeout after 1 second")
}
```

### 2. 非阻塞接收

```go
select {
case msg := <-ch:
    fmt.Println("Received:", msg)
default:
    fmt.Println("No message available")
}
```

### 3. 取消信號

```go
func worker(ctx context.Context, ch <-chan int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Worker cancelled")
            return
        case data := <-ch:
            fmt.Println("Processing:", data)
        }
    }
}
```

### 4. 多路復用

```go
func fanIn(ch1, ch2 <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for {
            select {
            case val, ok := <-ch1:
                if !ok {
                    ch1 = nil // 關閉後設為 nil，避免重複選擇
                    continue
                }
                out <- val
            case val, ok := <-ch2:
                if !ok {
                    ch2 = nil
                    continue
                }
                out <- val
            }

            if ch1 == nil && ch2 == nil {
                return
            }
        }
    }()
    return out
}
```

## 進階並發控制模式

### 1. Worker Pool

```go
type Pool struct {
    tasks   chan Task
    results chan Result
    workers int
}

func NewPool(workers int) *Pool {
    p := &Pool{
        tasks:   make(chan Task, 100),
        results: make(chan Result, 100),
        workers: workers,
    }

    for i := 0; i < workers; i++ {
        go p.worker()
    }

    return p
}

func (p *Pool) worker() {
    for task := range p.tasks {
        result := task.Execute()

        select {
        case p.results <- result:
        case <-time.After(time.Second):
            // 發送超時處理
        }
    }
}
```

### 2. Pipeline 模式

```go
func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            out <- n
        }
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}

func main() {
    // Pipeline: generator -> square -> print
    for n := range square(generator(1, 2, 3, 4)) {
        fmt.Println(n)
    }
}
```

### 3. Context 取消傳播

```go
func operation(ctx context.Context) error {
    // 創建子 context
    childCtx, cancel := context.WithTimeout(ctx, time.Second)
    defer cancel()

    select {
    case <-childCtx.Done():
        return childCtx.Err()
    case result := <-doWork(childCtx):
        return processResult(result)
    }
}
```

## 性能優化技巧

### 1. 避免在熱路徑使用 Select

```go
// ❌ 效率低：每次循環都執行 select
for {
    select {
    case data := <-ch:
        process(data)
    }
}

// ✅ 更好：直接使用 range
for data := range ch {
    process(data)
}
```

### 2. 使用緩衝 Channel 減少阻塞

```go
// 緩衝 channel 可以減少 select 的阻塞次數
ch := make(chan int, 10)
```

## 常見陷阱

### 1. Nil Channel

```go
var ch chan int // nil channel
select {
case <-ch: // 永遠阻塞！
    fmt.Println("Never happens")
}
```

### 2. 忘記 Default

```go
// 沒有 default 時，select 會阻塞
select {
case msg := <-ch:
    fmt.Println(msg)
// 缺少 default，可能導致死鎖
}
```

## 小結

本文深入探討了 `select` 語句的使用和並發控制模式。下一篇將介紹 Context 的應用場景。

### 重點回顧

- Select 可以同時等待多個 Channel 操作
- 理解 select 的隨機選擇特性
- 掌握常見的並發控制模式
- 避免 nil channel 和死鎖

### 下一篇預告

在下一篇文章中，我們將學習如何使用 Context 進行取消傳播和超時控制。
