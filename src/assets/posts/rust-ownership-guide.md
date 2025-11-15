---
title: "Rust 所有權系統完全指南"
date: "2025-11-13"
tags: ["rust", "system"]
description: "理解 Rust 的所有權、借用和生命週期概念，以及如何運用這些特性寫出安全高效的程式碼。"
---

# Rust 所有權系統完全指南

Rust 的所有權（Ownership）系統是其最獨特且重要的特性，它在編譯時期就能保證記憶體安全，無需垃圾回收器。

## 所有權規則

Rust 的所有權有三個基本規則：

1. Rust 中的每個值都有一個**所有者**（owner）
2. 一個值在同一時間**只能有一個所有者**
3. 當所有者離開作用域時，值會被**釋放**

### 基本範例

```rust
fn main() {
    let s1 = String::from("hello"); // s1 擁有字串
    let s2 = s1;                     // 所有權移動到 s2

    // println!("{}", s1);           // ❌ 編譯錯誤：s1 已失效
    println!("{}", s2);              // ✅ 正確
}
```

## 移動（Move）vs 複製（Copy）

### Stack 資料：Copy

簡單型別（如整數、布林值）實作了 `Copy` trait：

```rust
fn main() {
    let x = 5;
    let y = x;  // 複製

    println!("x = {}, y = {}", x, y); // ✅ 兩者都有效
}
```

### Heap 資料：Move

複雜型別（如 String）會發生移動：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // 移動，s1 失效

    // 如果要複製，使用 clone()
    let s3 = s2.clone();
    println!("s2 = {}, s3 = {}", s2, s3);
}
```

## 借用（Borrowing）

借用允許您引用值而不取得所有權。

### 不可變借用

```rust
fn calculate_length(s: &String) -> usize {
    s.len() // 可以讀取，但不能修改
}

fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1); // 借用 s1

    println!("Length of '{}' is {}.", s1, len); // s1 仍然有效
}
```

### 可變借用

```rust
fn add_world(s: &mut String) {
    s.push_str(", world");
}

fn main() {
    let mut s = String::from("hello");
    add_world(&mut s);

    println!("{}", s); // "hello, world"
}
```

## 借用規則

Rust 的借用檢查器（borrow checker）強制執行這些規則：

1. 在任何時刻，你**要嘛**有一個可變引用，**要嘛**有任意數量的不可變引用
2. 引用必須總是有效的

### 範例：防止資料競爭

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;     // ✅ 不可變借用
    let r2 = &s;     // ✅ 多個不可變借用OK
    // let r3 = &mut s; // ❌ 不能同時有可變和不可變借用

    println!("{} and {}", r1, r2);

    let r3 = &mut s; // ✅ r1 和 r2 已不再使用
    r3.push_str(", world");
}
```

## 生命週期（Lifetimes）

生命週期確保引用始終有效。

### 函數簽名中的生命週期

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string");
    let string2 = String::from("short");

    let result = longest(string1.as_str(), string2.as_str());
    println!("The longest string is {}", result);
}
```

### 結構體中的生命週期

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }

    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention: {}", announcement);
        self.part
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");

    let excerpt = ImportantExcerpt {
        part: first_sentence,
    };

    println!("{}", excerpt.part);
}
```

## 常見模式

### 1. 返回借用

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

### 2. 方法中的 self

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {           // 不可變借用
        self.width * self.height
    }

    fn set_width(&mut self, width: u32) { // 可變借用
        self.width = width;
    }

    fn into_square(self) -> Rectangle {    // 取得所有權
        Rectangle {
            width: self.width,
            height: self.width,
        }
    }
}
```

### 3. 智慧指標

#### Box<T>：堆積分配

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);
} // b 離開作用域，記憶體被釋放
```

#### Rc<T>：多重所有權

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("hello"));
    let b = Rc::clone(&a);
    let c = Rc::clone(&a);

    println!("Reference count: {}", Rc::strong_count(&a)); // 3
}
```

#### RefCell<T>：內部可變性

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    {
        let mut value = data.borrow_mut();
        *value += 1;
    }

    println!("data: {:?}", data.borrow()); // 6
}
```

## 最佳實踐

### 1. 優先使用借用而非所有權轉移

```rust
// ✅ 推薦
fn process_string(s: &String) {
    // 處理字串
}

// ❌ 避免（除非必要）
fn process_string_owned(s: String) {
    // 處理字串
}
```

### 2. 使用切片而非引用

```rust
// ✅ 更彈性
fn first_word(s: &str) -> &str {
    // ...
}

// ❌ 限制性較強
fn first_word_string(s: &String) -> &str {
    // ...
}
```

### 3. 使用 `'static` 生命週期表示永久有效

```rust
const GREETING: &str = "Hello, world!"; // 'static 生命週期

fn main() {
    let s: &'static str = "I have a static lifetime.";
}
```

## 結論

Rust 的所有權系統雖然學習曲線較陡，但它提供了：

- **記憶體安全**：無需垃圾回收器
- **並發安全**：防止資料競爭
- **零成本抽象**：無運行時開銷

掌握所有權是成為 Rust 專家的關鍵！記住核心原則：所有權、借用、生命週期。
