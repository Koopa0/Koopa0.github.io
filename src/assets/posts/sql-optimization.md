---
title: "SQL 查詢優化技巧"
date: "2025-11-10"
tags: ["sql"]
description: "學習如何優化 SQL 查詢效能，包含索引策略、查詢計畫分析和常見的效能陷阱。"
---

# SQL 查詢優化技巧

SQL 查詢優化是資料庫效能調教的核心。本文分享實用的優化技巧和最佳實踐。

## 使用 EXPLAIN 分析查詢計畫

```sql
EXPLAIN ANALYZE
SELECT * FROM users
WHERE email = 'user@example.com';
```

關注以下指標：
- **Seq Scan**：全表掃描（需優化）
- **Index Scan**：使用索引（較佳）
- **Cost**：預估執行成本
- **Rows**：預估處理行數

## 索引優化

### 1. 建立適當的索引

```sql
-- 單欄位索引
CREATE INDEX idx_users_email ON users(email);

-- 複合索引（順序很重要！）
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- 部分索引
CREATE INDEX idx_active_users ON users(email)
WHERE is_active = true;
```

### 2. 索引使用原則

```sql
-- ✅ 會使用索引
SELECT * FROM users WHERE email = 'test@example.com';

-- ❌ 不會使用索引（函數包裹）
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- ✅ 應該這樣寫
SELECT * FROM users WHERE email = LOWER('test@example.com');
```

## SELECT 最佳化

```sql
-- ❌ 避免 SELECT *
SELECT * FROM orders;

-- ✅ 只選需要的欄位
SELECT id, user_id, total_amount FROM orders;

-- ✅ 使用 EXISTS 代替 COUNT
-- 如果只需要知道是否存在
SELECT EXISTS(SELECT 1 FROM orders WHERE user_id = 123);
```

## JOIN 優化

### 1. 使用正確的 JOIN 類型

```sql
-- INNER JOIN（只返回匹配的行）
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN（返回左表所有行）
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

### 2. JOIN 順序優化

```sql
-- ❌ 大表 JOIN 大表
SELECT *
FROM large_table1 l1
JOIN large_table2 l2 ON l1.id = l2.id;

-- ✅ 先過濾再 JOIN
SELECT *
FROM (SELECT * FROM large_table1 WHERE date > '2025-01-01') l1
JOIN large_table2 l2 ON l1.id = l2.id;
```

## WHERE 子句優化

```sql
-- ❌ OR 運算符效能較差
SELECT * FROM users
WHERE city = 'Taipei' OR city = 'Kaohsiung';

-- ✅ 使用 IN
SELECT * FROM users
WHERE city IN ('Taipei', 'Kaohsiung');

-- ❌ NOT IN 效能差
SELECT * FROM users
WHERE id NOT IN (SELECT user_id FROM blacklist);

-- ✅ 使用 NOT EXISTS
SELECT * FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM blacklist b WHERE b.user_id = u.id
);
```

## 子查詢優化

```sql
-- ❌ 相關子查詢（每行都執行）
SELECT u.name,
  (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
FROM users u;

-- ✅ JOIN 一次性查詢
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

## LIMIT 與分頁

```sql
-- ❌ 大偏移量效能差
SELECT * FROM users
ORDER BY created_at
LIMIT 10 OFFSET 10000;

-- ✅ 使用游標分頁
SELECT * FROM users
WHERE created_at > '2025-01-01 00:00:00'
ORDER BY created_at
LIMIT 10;
```

## 避免 N+1 查詢問題

```sql
-- ❌ N+1 問題
SELECT * FROM users; -- 1 次查詢
-- 對每個 user 查詢 orders（N 次）
SELECT * FROM orders WHERE user_id = ?;

-- ✅ 一次查詢
SELECT u.*, o.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```

## 使用適當的資料類型

```sql
-- ❌ 使用 VARCHAR 存數字
CREATE TABLE products (
  price VARCHAR(50)
);

-- ✅ 使用正確的型別
CREATE TABLE products (
  price DECIMAL(10, 2)
);
```

## 批次操作

```sql
-- ❌ 逐筆插入
INSERT INTO users (name) VALUES ('User1');
INSERT INTO users (name) VALUES ('User2');

-- ✅ 批次插入
INSERT INTO users (name) VALUES
  ('User1'),
  ('User2'),
  ('User3');
```

## 使用窗口函數

```sql
-- ❌ 子查詢計算排名
SELECT u.*,
  (SELECT COUNT(*) FROM users u2
   WHERE u2.score >= u.score) as rank
FROM users u;

-- ✅ 使用窗口函數
SELECT *,
  RANK() OVER (ORDER BY score DESC) as rank
FROM users;
```

## 查詢快取

```sql
-- 使用 Materialized View
CREATE MATERIALIZED VIEW user_order_summary AS
SELECT u.id, u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- 定期刷新
REFRESH MATERIALIZED VIEW user_order_summary;
```

## 監控慢查詢

```sql
-- PostgreSQL 啟用慢查詢日誌
-- postgresql.conf
log_min_duration_statement = 1000  -- 記錄超過 1 秒的查詢

-- MySQL
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

## 最佳實踐檢查清單

- [ ] 為常用查詢欄位建立索引
- [ ] 避免 SELECT *
- [ ] 使用 EXPLAIN 分析查詢計畫
- [ ] 避免在 WHERE 中使用函數
- [ ] 使用正確的 JOIN 類型
- [ ] 批次處理大量資料
- [ ] 定期更新統計資訊
- [ ] 監控慢查詢日誌
- [ ] 使用連接池
- [ ] 考慮讀寫分離

## 結論

SQL 優化是持續的過程：

1. **測量**：使用 EXPLAIN 分析
2. **索引**：建立適當的索引
3. **重寫**：優化查詢語句
4. **監控**：追蹤效能指標

記住：**過早優化是萬惡之源，但測量後的優化是必要的**。
