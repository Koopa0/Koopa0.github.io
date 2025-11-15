---
title: "Go 並發模式詳解"
date: "2025-11-14"
tags: ["golang", "system"]
description: "深入探討 Go 語言的並發模式，包含 goroutines、channels 和 select 語句的實用範例。"
---

# Go 並發模式詳解

Go 語言最強大的特性之一就是其內建的並發支援。本文將深入探討 Go 的並發模式，幫助您寫出高效、安全的並發程式。

## Goroutines 基礎

Goroutines 是 Go 的輕量級執行緒，由 Go runtime 管理。啟動一個 goroutine 非常簡單：

```go
package main

import (
    "fmt"
    "time"
)

func sayHello(name string) {
    fmt.Printf("Hello, %s!\n", name)
}

func main() {
    // 啟動 goroutine
    go sayHello("World")
    go sayHello("Gopher")

    // 等待 goroutines 完成
    time.Sleep(time.Second)
}
```

## Channels 通訊

Channels 是 goroutines 之間的通訊管道，遵循「不要透過共享記憶體來通訊，而要透過通訊來共享記憶體」的哲學。

### 基本 Channel 使用

```go
package main

import "fmt"

func sum(numbers []int, result chan int) {
    sum := 0
    for _, num := range numbers {
        sum += num
    }
    result <- sum // 將結果傳送到 channel
}

func main() {
    numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    resultChan := make(chan int)

    mid := len(numbers) / 2
    go sum(numbers[:mid], resultChan)
    go sum(numbers[mid:], resultChan)

    x, y := <-resultChan, <-resultChan // 接收結果

    fmt.Printf("Total: %d\n", x+y)
}
```

### Buffered Channels

```go
// 建立容量為 3 的 buffered channel
messages := make(chan string, 3)

// 傳送時不會阻塞（直到緩衝區滿）
messages <- "Hello"
messages <- "World"
messages <- "Go"

// 接收訊息
fmt.Println(<-messages) // Hello
fmt.Println(<-messages) // World
fmt.Println(<-messages) // Go
```

## Select 語句

Select 讓您可以同時等待多個 channel 操作：

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "Channel 1"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "Channel 2"
    }()

    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("Received:", msg1)
        case msg2 := <-ch2:
            fmt.Println("Received:", msg2)
        }
    }
}
```

## Worker Pool 模式

Worker Pool 是處理大量任務的常見模式：

```go
package main

import (
    "fmt"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, job)
        time.Sleep(time.Second) // 模擬工作
        results <- job * 2
    }
}

func main() {
    const numJobs = 5
    const numWorkers = 3

    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)

    // 啟動 workers
    for w := 1; w <= numWorkers; w++ {
        go worker(w, jobs, results)
    }

    // 傳送任務
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)

    // 收集結果
    for a := 1; a <= numJobs; a++ {
        <-results
    }
}
```

## Pipeline 模式

Pipeline 將資料處理分成多個階段：

```go
package main

import "fmt"

func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func main() {
    // 建立 pipeline
    c := generator(2, 3, 4, 5)
    out := square(c)

    // 消費結果
    for result := range out {
        fmt.Println(result) // 4, 9, 16, 25
    }
}
```

## Context 取消模式

使用 context 來管理 goroutine 的生命週期：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func operation(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Operation cancelled")
            return
        default:
            fmt.Println("Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    go operation(ctx)

    time.Sleep(3 * time.Second)
}
```

## 最佳實踐

### 1. 避免 Goroutine 洩漏

確保所有啟動的 goroutines 都能正常結束：

```go
// ❌ 錯誤：goroutine 永遠不會結束
func leak() {
    ch := make(chan int)
    go func() {
        val := <-ch // 永遠阻塞
        fmt.Println(val)
    }()
    // channel 從未關閉
}

// ✅ 正確：使用 context 或關閉 channel
func noLeak() {
    ch := make(chan int)
    done := make(chan bool)

    go func() {
        select {
        case val := <-ch:
            fmt.Println(val)
        case <-done:
            return
        }
    }()

    // 清理
    close(done)
}
```

### 2. 使用 sync.WaitGroup

等待多個 goroutines 完成：

```go
import "sync"

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            fmt.Printf("Worker %d done\n", id)
        }(i)
    }

    wg.Wait()
    fmt.Println("All workers completed")
}
```

### 3. 避免競態條件

使用 mutex 保護共享資源：

```go
import "sync"

type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}
```

## 結論

Go 的並發模式強大且優雅，但需要小心使用。記住以下原則：

1. **使用 channels 通訊**：避免共享記憶體
2. **管理 goroutine 生命週期**：防止洩漏
3. **使用 context 取消**：優雅地關閉操作
4. **保護共享資源**：使用 mutex 或 channels
5. **使用 race detector**：`go run -race`

掌握這些模式，您就能寫出高效、安全的並發程式！
