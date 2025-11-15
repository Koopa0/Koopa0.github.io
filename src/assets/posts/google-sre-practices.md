---
title: "Google SRE 實踐指南"
date: "2025-11-08"
tags: ["google", "system"]
description: "學習 Google 的 Site Reliability Engineering 實踐，包含 SLO/SLI、錯誤預算和事故管理。"
---

# Google SRE 實踐指南

Site Reliability Engineering (SRE) 是 Google 發明的運維方法論，將軟體工程應用到系統運維中。

## SRE 核心原則

### 1. 擁抱風險

100% 可用性不切實際且昂貴。接受適度的風險，專注於使用者真正在意的可靠性。

### 2. 服務水準目標（SLO）

定義可測量的可靠性目標：

```yaml
# 範例 SLO
service: api-service
slo:
  - name: Availability
    target: 99.9%
    window: 30d

  - name: Latency
    target: 95th percentile < 200ms
    window: 7d

  - name: Error Rate
    target: < 0.1%
    window: 24h
```

### 3. 錯誤預算（Error Budget）

錯誤預算 = 1 - SLO

```
SLO = 99.9% → 錯誤預算 = 0.1%
每月允許 43.2 分鐘的停機時間
```

## SLI (Service Level Indicator)

SLI 是可測量的服務品質指標。

### 常見 SLI

#### 1. 可用性

```
可用性 = 成功請求數 / 總請求數
```

```prometheus
# Prometheus 查詢
sum(rate(http_requests_total{status=~"2.."}[5m])) /
sum(rate(http_requests_total[5m]))
```

#### 2. 延遲

```
延遲 SLI = 符合延遲目標的請求數 / 總請求數
```

```prometheus
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
) < 0.2
```

#### 3. 吞吐量

```prometheus
sum(rate(http_requests_total[5m]))
```

## 錯誤預算實踐

### 計算錯誤預算

```typescript
interface ErrorBudget {
  slo: number;           // 99.9%
  windowDays: number;    // 30
  totalRequests: number; // 1000000

  calculate(): {
    allowedErrors: number;
    remainingBudget: number;
  } {
    const allowedErrors = this.totalRequests * (1 - this.slo / 100);
    const actualErrors = this.getActualErrors();
    const remainingBudget = allowedErrors - actualErrors;

    return {
      allowedErrors,
      remainingBudget: Math.max(0, remainingBudget)
    };
  }
}
```

### 錯誤預算政策

```markdown
## 錯誤預算政策

### 預算充足 (> 50%)
- 可進行新功能開發
- 可進行實驗性部署
- 正常的發布節奏

### 預算緊張 (10-50%)
- 暫緩新功能
- 加強測試
- 減少發布頻率

### 預算耗盡 (< 10%)
- 停止所有新功能開發
- 專注於可靠性改進
- 徹底的事故回顧
```

## Toil 管理

Toil 是手動、重複性、無持久價值的工作。

### Toil 的特徵

1. **手動**：需要人工執行
2. **重複性**：一再發生
3. **可自動化**：可透過程式解決
4. **無增長價值**：不會永久改善服務

### 減少 Toil

```bash
# ❌ 手動部署（Toil）
ssh server1
git pull
npm install
pm2 restart app

# ✅ 自動化部署
./deploy.sh production
```

### Toil 預算

```
SRE 應將至少 50% 時間用於工程工作
最多 50% 時間可用於 Toil
```

## 監控與告警

### 四個黃金信號

1. **延遲**：請求響應時間
2. **流量**：系統負載
3. **錯誤**：失敗率
4. **飽和度**：資源使用率

### Prometheus 告警規則

```yaml
groups:
- name: slo_alerts
  rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m])) /
      sum(rate(http_requests_total[5m])) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: HighLatency
    expr: |
      histogram_quantile(0.95,
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
      ) > 0.5
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected"
```

## 事故管理

### 事故響應流程

```mermaid
事故發生 → 檢測 → 回應 → 修復 → 事後回顧
```

### 事故角色

1. **事故指揮官（Incident Commander）**
   - 協調響應
   - 做出決策
   - 對外溝通

2. **通訊負責人**
   - 更新狀態頁
   - 通知利害關係人

3. **技術負責人**
   - 診斷問題
   - 實施修復

### 事故嚴重性等級

| 等級 | 影響 | 響應時間 | 範例 |
|------|------|----------|------|
| P0 | 服務完全中斷 | 立即 | 網站完全無法訪問 |
| P1 | 核心功能受損 | < 30 分鐘 | 支付功能失效 |
| P2 | 部分功能異常 | < 2 小時 | 搜尋功能緩慢 |
| P3 | 輕微問題 | < 1 天 | UI 小錯誤 |

## 事後回顧（Postmortem）

### Postmortem 模板

```markdown
# 事故回顧：API 服務中斷

## 事故摘要
- **日期**: 2025-11-08
- **持續時間**: 45 分鐘
- **影響**: 所有用戶無法存取 API
- **損失的錯誤預算**: 0.1%

## 時間軸
- 14:00 - 部署新版本
- 14:15 - 用戶回報錯誤
- 14:20 - 確認為 P0 事故
- 14:30 - 回滾到前一版本
- 14:45 - 服務恢復

## 根本原因
資料庫連線池設定錯誤，導致連線耗盡。

## 修復措施
1. 立即回滾部署
2. 修正連線池設定
3. 添加連線池監控

## 預防措施
- [ ] 改進測試涵蓋率
- [ ] 添加連線池告警
- [ ] 更新部署檢查清單

## 學到的教訓
- 生產環境配置與測試環境不一致
- 缺少連線池相關監控
```

### 無責文化

```
事後回顧的目標是學習和改進，而非歸咎個人
```

## On-Call 輪值

### 輪值最佳實踐

```yaml
oncall_schedule:
  primary:
    rotation: weekly
    shifts:
      - name: Business Hours
        time: "09:00-18:00"
        escalation: 15min

      - name: After Hours
        time: "18:00-09:00"
        escalation: 5min

  secondary:
    rotation: weekly
    escalation: 30min
```

### On-Call 負荷管理

```
目標：
- 每人每月 on-call 不超過 25%
- 每次輪值後至少休息 2 週
- 單次事故處理不超過 4 小時
```

## 容量規劃

### 需求預測

```python
def forecast_capacity(historical_data, growth_rate=0.1):
    """
    預測未來 6 個月的容量需求
    """
    current_load = historical_data[-1]
    months = 6

    forecast = []
    for month in range(1, months + 1):
        projected_load = current_load * (1 + growth_rate) ** month
        safety_margin = projected_load * 0.2  # 20% 緩衝
        forecast.append(projected_load + safety_margin)

    return forecast
```

## SRE 團隊結構

### 嵌入式 SRE

```
產品團隊 A
├── 開發工程師 (5人)
└── SRE (1-2人)
```

### 平台 SRE

```
SRE 平台團隊
├── 監控平台
├── 部署平台
└── 可靠性工具
```

## 最佳實踐總結

1. **測量一切**
   - 定義清晰的 SLI/SLO
   - 持續監控錯誤預算

2. **自動化優先**
   - 消除 Toil
   - 自動化部署和回滾

3. **擁抱失敗**
   - 無責的事後回顧
   - 從失敗中學習

4. **漸進式發布**
   - 金絲雀部署
   - 功能開關

5. **保持簡單**
   - 避免過度複雜化
   - 可觀測性優先

## 參考資源

- [Google SRE Book](https://sre.google/books/)
- [Site Reliability Workbook](https://sre.google/workbook/table-of-contents/)

## 結論

SRE 不只是運維，而是將軟體工程原則應用到營運中：

- **可測量的可靠性目標**（SLO/SLI）
- **有限的錯誤預算**（平衡創新與穩定）
- **自動化優先**（消除 Toil）
- **持續改進**（Postmortem）

開始實踐 SRE，打造更可靠的系統！
