---
title: "最近學習 Rust 的心得與感想"
date: "2024-03-10"
tags: ["Learning"]
description: "分享最近從 Golang 轉 Rust 的一些體會和心路歷程"
---

# 最近學習 Rust 的心得與感想

## 為什麼開始學 Rust？

最近在工作中遇到一些性能瓶頸問題，團隊開始討論是否要引入 Rust 來重寫部分核心模組。作為主要使用 Golang 的開發者，我決定利用業餘時間學習 Rust。

## 第一印象

### 學習曲線確實陡峭

剛開始接觸 Rust 時，最大的障礙是**所有權系統 (Ownership)**。習慣了 GC 語言的我，需要重新思考記憶體管理。

```rust
// 這段代碼無法編譯！
let s1 = String::from("hello");
let s2 = s1; // s1 的所有權移動到 s2
println!("{}", s1); // 錯誤：s1 已經無效了
```

一開始真的很不習慣，編譯器一直報錯。但後來發現這正是 Rust 的優勢 - **在編譯時就抓住潛在的 bug**。

### 編譯器是最好的老師

Rust 編譯器的錯誤訊息非常友善，常常會告訴你為什麼錯了，以及如何修正：

```
error[E0382]: borrow of moved value: `s1`
 --> src/main.rs:4:20
  |
2 |     let s1 = String::from("hello");
  |         -- move occurs because `s1` has type `String`
3 |     let s2 = s1;
  |              -- value moved here
4 |     println!("{}", s1);
  |                    ^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let s2 = s1.clone();
  |                ++++++++
```

## 與 Golang 的對比

### 相似之處

1. **現代化語法** - 兩者都很簡潔
2. **工具鏈完善** - cargo 和 go mod 都很好用
3. **並發支持** - Rust 的 async/await 和 Go 的 goroutine

### 主要差異

| 特性 | Golang | Rust |
|------|--------|------|
| **記憶體管理** | GC | 所有權系統 |
| **學習曲線** | 平緩 | 陡峭 |
| **編譯速度** | 快 | 較慢 |
| **運行時性能** | 好 | 極佳 |
| **錯誤處理** | error 返回值 | Result 枚舉 |
| **並發模型** | goroutine + channel | async/await + future |

## 印象最深刻的特性

### 1. 枚舉與模式匹配

Rust 的枚舉比 Golang 強大太多了：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn process_message(msg: Message) {
    match msg {
        Message::Quit => println!("Quit"),
        Message::Move { x, y } => println!("Move to ({}, {})", x, y),
        Message::Write(text) => println!("Write: {}", text),
        Message::ChangeColor(r, g, b) => println!("Color: ({}, {}, {})", r, g, b),
    }
}
```

### 2. Option 和 Result

不再需要 `if err != nil` 了，但編譯器會強制你處理錯誤：

```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// 必須處理錯誤
match divide(10, 0) {
    Ok(result) => println!("Result: {}", result),
    Err(e) => println!("Error: {}", e),
}
```

### 3. 特徵 (Traits)

類似 Go 的 interface，但更強大：

```rust
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.title, self.content)
    }
}
```

## 遇到的挑戰

### 1. 生命週期 (Lifetimes)

這可能是 Rust 最難的部分。什麼時候需要標註生命週期？為什麼編譯器推斷不出來？

```rust
// 需要生命週期標註
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

花了很多時間才理解這個概念，現在還在繼續學習中。

### 2. 異步編程

Rust 的 async/await 和 tokio 生態系統很強大，但也很複雜。跟 Go 的 goroutine 比起來，心智負擔更重。

## 目前的學習資源

1. **The Rust Programming Language (The Book)** - 官方文檔，寫得很好
2. **Rustlings** - 互動式練習，很適合初學者
3. **Exercism** - 刷題練習
4. **YouTube: Jon Gjengset** - 深度講解 Rust 概念

## 未來計劃

1. 用 Rust 重寫一個小型 CLI 工具
2. 學習 tokio 異步框架
3. 嘗試用 Rust 做 WebAssembly
4. 參與開源 Rust 專案

## 給想學 Rust 的朋友

**優點：**
- 極高的性能
- 記憶體安全
- 無 GC 但無需手動管理
- 現代化的工具鏈
- 強大的類型系統

**需要準備的：**
- 足夠的耐心
- 願意重新思考程式設計
- 接受一開始的挫折感

## 結語

雖然 Rust 學習曲線陡峭，但我覺得很值得。它改變了我對程式設計的思考方式，讓我更加關注記憶體安全和並發安全。

Golang 仍然是我的主力語言，但 Rust 給了我另一個強大的工具選擇。未來遇到性能關鍵或記憶體敏感的場景時，Rust 會是我的首選。

如果你也在學 Rust，歡迎在 GitHub 或 Twitter 上交流！

---

**相關文章：**
- [Rust Ownership 完全理解指南](javascript:void(0)) (計劃中)
- [從 Go 到 Rust：並發模型對比](javascript:void(0)) (計劃中)
