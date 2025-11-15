---
title: "微服務架構設計原則"
date: "2025-11-11"
tags: ["system"]
description: "探討微服務架構的核心概念、設計原則與最佳實踐，包含服務拆分、通訊模式和資料管理。"
---

# 微服務架構設計原則

微服務架構已成為現代軟體開發的主流模式。本文探討其核心原則和實踐方法。

## 什麼是微服務？

微服務是一種將應用程式拆分成小型、獨立服務的架構風格，每個服務：

- 專注於**單一業務功能**
- **獨立部署**和擴展
- 擁有自己的**資料庫**
- 透過 **API** 通訊

## 核心原則

### 1. 單一職責原則

每個服務只負責一個業務領域：

```
訂單服務
  ├── 建立訂單
  ├── 查詢訂單
  └── 取消訂單

用戶服務
  ├── 註冊
  ├── 登入
  └── 個人資料管理

支付服務
  ├── 處理支付
  ├── 退款
  └── 帳單查詢
```

### 2. 去中心化資料管理

每個服務擁有自己的資料庫：

```typescript
// ❌ 共享資料庫
orders-service → shared-database
users-service  → shared-database

// ✅ 獨立資料庫
orders-service → orders-db
users-service  → users-db
```

### 3. API 優先設計

定義清晰的服務介面：

```typescript
// RESTful API 設計
GET    /api/orders          // 列表
GET    /api/orders/:id      // 詳情
POST   /api/orders          // 建立
PUT    /api/orders/:id      // 更新
DELETE /api/orders/:id      // 刪除
```

## 通訊模式

### 同步通訊：REST

```typescript
// Express.js 範例
app.get('/api/orders/:id', async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  res.json(order);
});
```

### 異步通訊：訊息佇列

```typescript
// RabbitMQ 範例
channel.sendToQueue('order.created', Buffer.from(JSON.stringify({
  orderId: '123',
  userId: 'user456',
  amount: 100
})));

// 訂閱者
channel.consume('order.created', async (msg) => {
  const order = JSON.parse(msg.content.toString());
  await processOrder(order);
  channel.ack(msg);
});
```

## 服務發現

### Consul 範例

```javascript
const consul = require('consul')();

// 註冊服務
consul.agent.service.register({
  name: 'orders-service',
  address: 'localhost',
  port: 3000,
  check: {
    http: 'http://localhost:3000/health',
    interval: '10s'
  }
});

// 查找服務
const services = await consul.health.service({
  service: 'users-service',
  passing: true
});
```

## API Gateway

集中管理所有服務的入口：

```typescript
// Kong / NGINX 配置範例
location /api/orders {
  proxy_pass http://orders-service;
}

location /api/users {
  proxy_pass http://users-service;
}
```

## 資料一致性

### Saga 模式

處理分散式交易：

```typescript
// 訂單 Saga
class OrderSaga {
  async execute(order) {
    try {
      // 1. 建立訂單
      await orderService.create(order);

      // 2. 扣款
      await paymentService.charge(order);

      // 3. 扣庫存
      await inventoryService.reserve(order);

      return { success: true };
    } catch (error) {
      // 補償交易
      await this.compensate(order);
      return { success: false };
    }
  }

  async compensate(order) {
    await paymentService.refund(order);
    await inventoryService.release(order);
    await orderService.cancel(order);
  }
}
```

## 監控與追蹤

### 分散式追蹤

```typescript
// OpenTelemetry 範例
const tracer = trace.getTracer('orders-service');

app.get('/api/orders/:id', async (req, res) => {
  const span = tracer.startSpan('getOrder');

  try {
    const order = await orderService.getOrder(req.params.id);
    res.json(order);
  } finally {
    span.end();
  }
});
```

## 最佳實踐

### 1. 健康檢查

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    database: dbConnection.isConnected(),
    timestamp: new Date()
  });
});
```

### 2. 優雅關機

```typescript
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM，開始優雅關機...');

  // 停止接受新請求
  server.close(() => {
    console.log('HTTP 服務器已關閉');
  });

  // 關閉資料庫連線
  await db.close();

  process.exit(0);
});
```

### 3. 斷路器模式

```typescript
const CircuitBreaker = require('opossum');

const breaker = new CircuitBreaker(async (userId) => {
  return await userService.getUser(userId);
}, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

breaker.fallback(() => ({
  id: 'unknown',
  name: 'Guest User'
}));
```

## 部署策略

### Docker Compose 範例

```yaml
version: '3.8'
services:
  orders-service:
    image: orders-service:latest
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgresql://db:5432/orders

  users-service:
    image: users-service:latest
    ports:
      - "3002:3000"
    environment:
      - DATABASE_URL=postgresql://db:5432/users
```

### Kubernetes 部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orders
  template:
    metadata:
      labels:
        app: orders
    spec:
      containers:
      - name: orders
        image: orders-service:v1.0
        ports:
        - containerPort: 3000
```

## 挑戰與解決方案

| 挑戰 | 解決方案 |
|------|----------|
| 資料一致性 | Saga 模式、Event Sourcing |
| 服務間通訊 | API Gateway、Service Mesh |
| 分散式追蹤 | Jaeger、Zipkin |
| 配置管理 | Consul、etcd |
| 日誌聚合 | ELK Stack、Loki |

## 何時使用微服務？

### ✅ 適合場景
- 大型團隊開發
- 需要獨立擴展
- 多語言技術棧
- 快速迭代需求

### ❌ 不適合場景
- 小型專案
- 團隊經驗不足
- 簡單的 CRUD 應用
- 初創階段

## 結論

微服務不是銀彈，但在適當場景下能帶來：
- **彈性擴展**
- **技術多樣性**
- **團隊自主性**
- **故障隔離**

記住：從單體架構開始，根據需求逐步演進到微服務。
