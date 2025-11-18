---
title: "Angular Signals 完整指南"
date: "2024-03-20"
description: "深入探討 Angular 的新響應式原語 Signals，以及如何在應用中使用它"
---

# Angular Signals 完整指南

Angular Signals 是 Angular 16 引入的新響應式原語...

## 什麼是 Signals？

Signals 提供了一種追蹤應用狀態變化的方式...

## 基本用法

```typescript
const count = signal(0);
const doubled = computed(() => count() * 2);
```

## 與 RxJS 的整合

Signals 可以與 RxJS 完美整合...
