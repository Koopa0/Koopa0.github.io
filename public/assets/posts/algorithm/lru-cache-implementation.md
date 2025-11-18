---
title: "如何在 Golang 中實現 LRU Cache"
date: "2024-02-01"
tags: ["Cache", "Data Structure"]
description: "從零開始實現一個線程安全的 LRU Cache，並分析時間複雜度"
---

# 如何在 Golang 中實現 LRU Cache

## 什麼是 LRU Cache？

LRU (Least Recently Used) Cache 是一種緩存淘汰策略，當緩存滿時，移除最久未使用的項目。

## 設計思路

### 數據結構選擇

為了實現 O(1) 的 Get 和 Put 操作，我們需要：

1. **哈希表 (Map)** - 用於 O(1) 查找
2. **雙向鏈表 (Doubly Linked List)** - 用於 O(1) 移動節點

```go
type LRUCache struct {
    capacity int
    cache    map[int]*Node
    head     *Node // 最近使用
    tail     *Node // 最久未使用
}

type Node struct {
    key   int
    value int
    prev  *Node
    next  *Node
}
```

## 完整實現

```go
package main

import "sync"

type LRUCache struct {
    capacity int
    cache    map[int]*Node
    head     *Node
    tail     *Node
    mu       sync.RWMutex
}

type Node struct {
    key   int
    value int
    prev  *Node
    next  *Node
}

func NewLRUCache(capacity int) *LRUCache {
    lru := &LRUCache{
        capacity: capacity,
        cache:    make(map[int]*Node),
    }

    // 創建虛擬頭尾節點
    lru.head = &Node{}
    lru.tail = &Node{}
    lru.head.next = lru.tail
    lru.tail.prev = lru.head

    return lru
}

func (lru *LRUCache) Get(key int) int {
    lru.mu.Lock()
    defer lru.mu.Unlock()

    if node, ok := lru.cache[key]; ok {
        lru.moveToFront(node)
        return node.value
    }
    return -1
}

func (lru *LRUCache) Put(key, value int) {
    lru.mu.Lock()
    defer lru.mu.Unlock()

    if node, ok := lru.cache[key]; ok {
        // 更新已存在的節點
        node.value = value
        lru.moveToFront(node)
        return
    }

    // 創建新節點
    newNode := &Node{key: key, value: value}
    lru.cache[key] = newNode
    lru.addToFront(newNode)

    // 檢查容量
    if len(lru.cache) > lru.capacity {
        // 移除最久未使用的節點
        removed := lru.removeTail()
        delete(lru.cache, removed.key)
    }
}

func (lru *LRUCache) moveToFront(node *Node) {
    lru.removeNode(node)
    lru.addToFront(node)
}

func (lru *LRUCache) addToFront(node *Node) {
    node.prev = lru.head
    node.next = lru.head.next
    lru.head.next.prev = node
    lru.head.next = node
}

func (lru *LRUCache) removeNode(node *Node) {
    node.prev.next = node.next
    node.next.prev = node.prev
}

func (lru *LRUCache) removeTail() *Node {
    node := lru.tail.prev
    lru.removeNode(node)
    return node
}
```

## 使用示例

```go
func main() {
    cache := NewLRUCache(2)

    cache.Put(1, 1) // cache: {1=1}
    cache.Put(2, 2) // cache: {1=1, 2=2}

    fmt.Println(cache.Get(1)) // 返回 1，cache: {2=2, 1=1}

    cache.Put(3, 3) // 淘汰 key 2，cache: {1=1, 3=3}

    fmt.Println(cache.Get(2)) // 返回 -1 (未找到)

    cache.Put(4, 4) // 淘汰 key 1，cache: {3=3, 4=4}

    fmt.Println(cache.Get(1)) // 返回 -1
    fmt.Println(cache.Get(3)) // 返回 3
    fmt.Println(cache.Get(4)) // 返回 4
}
```

## 時間複雜度分析

- **Get 操作**: O(1) - 哈希表查找 + 鏈表移動
- **Put 操作**: O(1) - 哈希表插入/更新 + 鏈表操作
- **空間複雜度**: O(capacity) - 哈希表 + 鏈表節點

## 優化與擴展

### 1. 支持泛型

```go
type LRUCache[K comparable, V any] struct {
    capacity int
    cache    map[K]*Node[K, V]
    head     *Node[K, V]
    tail     *Node[K, V]
    mu       sync.RWMutex
}

type Node[K comparable, V any] struct {
    key   K
    value V
    prev  *Node[K, V]
    next  *Node[K, V]
}
```

### 2. 添加 TTL 支持

```go
type Node struct {
    key       int
    value     int
    expiresAt time.Time
    // ...
}

func (lru *LRUCache) Get(key int) int {
    lru.mu.Lock()
    defer lru.mu.Unlock()

    if node, ok := lru.cache[key]; ok {
        if time.Now().After(node.expiresAt) {
            lru.removeNode(node)
            delete(lru.cache, key)
            return -1
        }
        lru.moveToFront(node)
        return node.value
    }
    return -1
}
```

### 3. 添加統計信息

```go
type Stats struct {
    hits   int64
    misses int64
    evictions int64
}

func (lru *LRUCache) GetStats() Stats {
    // 返回緩存命中率等統計信息
}
```

## 實際應用場景

1. **Web 應用緩存** - 緩存數據庫查詢結果
2. **API 響應緩存** - 減少外部 API 調用
3. **計算結果緩存** - 緩存昂貴的計算結果
4. **DNS 緩存** - 減少 DNS 查詢次數

## 小結

本文實現了一個線程安全的 LRU Cache，並分析了其時間複雜度和應用場景。

### 重點回顧

- LRU Cache 使用哈希表 + 雙向鏈表實現
- Get 和 Put 操作都是 O(1) 時間複雜度
- 使用 sync.RWMutex 實現線程安全
- 可以擴展支持泛型和 TTL

### 相關資源

- [LeetCode 146. LRU Cache](https://leetcode.com/problems/lru-cache/)
- [Go sync.RWMutex 文檔](https://pkg.go.dev/sync#RWMutex)
