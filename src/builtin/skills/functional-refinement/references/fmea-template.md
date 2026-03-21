# FMEA Analysis Template

## When to Use FMEA

FMEA (Failure Mode and Effects Analysis) applies to the following high-risk function types:

- **Business critical paths**: payment, order submission, data migration
- **Irreversible operations**: data deletion, account cancellation, fund transfer
- **External dependencies**: third-party services, API calls, hardware interfaces
- **Concurrency-sensitive**: inventory deduction, balance changes
- **Security-sensitive**: authentication, authorization, sensitive data handling

## Risk Level Calculation

```
Risk Level = Severity (S) × Occurrence Probability (O)

Low:    S × O ≤ 6
Medium: 7 ≤ S × O ≤ 15
High:   S × O ≥ 16
```

## FMEA Table Template

**输出文件：** `{功能名}FMEA.md`

| 编号 | 功能 | 失效模式 | 影响后果 | 严重度 S(1-5) | 发生概率 O(1-5) | 现有控制措施 | 风险等级 | 建议措施 | 负责人 |
|-----|------|---------|---------|-------------|--------------|------------|---------|---------|-------|
| FMEA-001 | [功能名称] | [失效模式描述] | [影响后果描述] | [1-5] | [1-5] | [现有措施，无则填"无"] | 低/中/高 | [建议改进措施] | [负责人] |

## 示例（用户支付功能）

| 编号 | 功能 | 失效模式 | 影响后果 | 严重度 S | 发生概率 O | 现有控制措施 | 风险等级 | 建议措施 | 负责人 |
|-----|------|---------|---------|---------|----------|------------|---------|---------|-------|
| FMEA-001 | 用户支付 | 重复扣款 | 用户资金损失，客诉风险 | 5 | 2 | 无 | 高 | 添加幂等Token防重复请求 | 后端负责人 |
| FMEA-002 | 用户支付 | 支付超时未回调 | 订单状态不一致 | 4 | 3 | 无 | 高 | 添加定时对账任务 | 后端负责人 |
| FMEA-003 | 用户支付 | 第三方支付平台不可用 | 无法完成支付 | 3 | 2 | 无 | 中 | 接入备用支付渠道 | 架构师 |

## Severity (S) Rating

| Level | Description |
|-------|-------------|
| 1 | Negligible — user barely notices |
| 2 | Minor — slightly degraded experience |
| 3 | Moderate — partial feature degradation |
| 4 | Severe — core feature fails |
| 5 | Catastrophic — data loss or financial loss |

## Occurrence Probability (O) Rating

| Level | Description |
|-------|-------------|
| 1 | Rare (< 0.1%) |
| 2 | Occasional (0.1% – 1%) |
| 3 | Sometimes (1% – 5%) |
| 4 | Frequent (5% – 20%) |
| 5 | Very frequent (> 20%) |
