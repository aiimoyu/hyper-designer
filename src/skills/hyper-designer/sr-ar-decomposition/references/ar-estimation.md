# AR Workload Estimation and Splitting Guidelines

## AR Workload Constraint

**Hard Rule**: Each AR must be ≤ 0.5K workload units

**Definition of 0.5K**:

- K = 1000 person-hours (行业标准: 1K = 1000工时)
- 0.5K = 500 person-hours
- Typical conversion:
  - 500 hours ≈ 62.5 person-days (8h/day)
  - For a team of 2: ~6 weeks
  - For a single developer: ~3 months

## Why 0.5K Limit?

1. **Testability**: Smaller units are easier to test independently
2. **Parallelism**: Enables concurrent development across teams
3. **Risk Management**: Limits blast radius of requirement changes
4. **Progress Tracking**: Provides clear completion milestones
5. **Cognitive Load**: Keeps implementation scope manageable

## Estimation Techniques

### Bottom-Up Estimation

Break AR into tasks and sum:

```markdown
AR-001-01: 用户登录接口实现
- Task 1: API endpoint定义 (0.5 days)
- Task 2: 请求验证逻辑 (1 day)
- Task 3: Token生成逻辑 (1.5 days)
- Task 4: 数据库交互 (1 day)
- Task 5: 单元测试 (1 day)
- Task 6: 集成测试 (0.5 day)
- Task 7: 文档编写 (0.5 day)
- Buffer (20%): 1.2 days
Total: 7.2 days × 8h = 57.6 hours = 0.058K ✅
```

### Comparison Estimation

Compare to previously completed similar work:

```markdown
AR-001-02: Token验证中间件

Similar to: AR-历史-05 (Session验证中间件)
  - Previous actual: 0.15K
  - Complexity delta: +20% (JWT vs Session)
  - Adjusted: 0.15K × 1.2 = 0.18K ✅
```

### Three-Point Estimation

Use optimistic/most-likely/pessimistic:

```markdown
AR-001-03: 账号锁定逻辑

Optimistic (O): 0.1K (一切顺利)
Most Likely (M): 0.2K (正常情况)
Pessimistic (P): 0.4K (遇到复杂边界情况)

Expected (E) = (O + 4M + P) / 6
E = (0.1 + 4×0.2 + 0.4) / 6 = 0.217K ✅
```

## AR Splitting Strategies

### Strategy 1: By Layer

Split vertically through architecture layers:

**Original AR (0.8K - TOO LARGE)**:

```
AR-001-01: 用户注册功能 (0.8K) ❌
```

**Split By Layer**:

```
AR-001-01: 注册表单UI (0.15K) ✅
AR-001-02: 注册接口实现 (0.2K) ✅
AR-001-03: 用户实体验证 (0.15K) ✅
AR-001-04: 数据持久化 (0.1K) ✅
AR-001-05: 邮件验证发送 (0.2K) ✅
Total: 0.8K ✅
```

### Strategy 2: By Scenario

Split by different usage scenarios:

**Original AR (0.9K - TOO LARGE)**:

```
AR-002-01: 订单支付处理 (0.9K) ❌
```

**Split By Scenario**:

```
AR-002-01: 支付宝支付流程 (0.3K) ✅
AR-002-02: 微信支付流程 (0.3K) ✅
AR-002-03: 支付结果通知处理 (0.2K) ✅
AR-002-04: 支付失败重试逻辑 (0.1K) ✅
Total: 0.9K ✅
```

### Strategy 3: By Feature Slice

Split horizontally by feature completeness:

**Original AR (1.2K - TOO LARGE)**:

```
AR-003-01: 订单查询功能 (1.2K) ❌
```

**Split By Feature Slice**:

```
AR-003-01: 基础订单列表查询 (0.3K) ✅
AR-003-02: 查询条件过滤 (0.2K) ✅
AR-003-03: 分页和排序 (0.15K) ✅
AR-003-04: 订单详情展示 (0.25K) ✅
AR-003-05: 导出功能 (0.3K) ✅
Total: 1.2K ✅
```

### Strategy 4: By Complexity

Split complex logic from simple CRUD:

**Original AR (0.6K - TOO LARGE)**:

```
AR-004-01: 库存扣减逻辑 (0.6K) ❌
```

**Split By Complexity**:

```
AR-004-01: 简单库存扣减API (0.2K) ✅
AR-004-02: 并发扣减锁机制 (0.3K) ✅
AR-004-03: 分布式库存同步 (0.2K) ✅
Total: 0.6K ✅
```

### Strategy 5: By Technology

Split by different technologies or integrations:

**Original AR (0.8K - TOO LARGE)**:

```
AR-005-01: 文件上传功能 (0.8K) ❌
```

**Split By Technology**:

```
AR-005-01: 本地存储上传 (0.2K) ✅
AR-005-02: OSS云存储上传 (0.25K) ✅
AR-005-03: 文件类型验证 (0.15K) ✅
AR-005-04: 上传进度展示 (0.2K) ✅
Total: 0.8K ✅
```

## Estimation Red Flags

Watch for these signs that indicate AR needs splitting:

| Red Flag | Threshold | Action |
|----------|-----------|--------|
| Task list too long | >10 tasks | Split by layer or scenario |
| Multiple external dependencies | >3 systems | Split by integration point |
| Vague description | "等" or "其他" appears | Clarify and split concrete items |
| Multiple teams needed | >2 teams | Split by team boundary |
| Long implementation time | >4 weeks | Split by feature slice |
| High uncertainty | Estimation range >2× | Split risky parts separately |

## Verification Checklist

Before finalizing AR estimations:

- [ ] Each AR ≤ 0.5K workload
- [ ] Estimation method documented (bottom-up/comparison/three-point)
- [ ] Tasks or sub-items listed for bottom-up estimates
- [ ] Comparison baseline referenced if using comparison
- [ ] Uncertainty accounted for (buffer or pessimistic scenario)
- [ ] Dependencies identified and not double-counted
- [ ] AR description specific enough to estimate (no vague terms)
- [ ] Single team can own each AR independently

## Examples

### Example 1: Well-Estimated AR ✅

```markdown
#### AR-001-01: 用户登录接口实现

**AR描述**:
- **场景**: 用户通过用户名密码登录
- **实现方式**: 新增功能
  - 调用接口: POST /v1/auth/login
  - 请求体: { username, password }
  - 成功处理: 生成JWT token，返回{ token, expiresIn }
  - 失败处理: 返回401，记录失败日志，3次失败后锁定账户
- **数据模型**: 
  - 新增user_sessions表(user_id, token_hash, expires_at)
  - 修改users表增加failed_login_count字段
- **工作量估算**: 0.25K
  - 估算方法: 三点估算 (O: 0.15K, M: 0.25K, P: 0.4K)
  - 任务分解:
    - API endpoint实现 (3 days)
    - JWT token生成 (2 days)
    - 登录失败限制逻辑 (4 days)
    - 单元测试 (2 days)
    - 集成测试 (2 days)
    - 文档 (1 day)
    - Buffer 20% (2.8 days)
    - Total: 16.8 days = 0.21K
- **依赖**: 无阻塞依赖
- **分配团队**: Auth组件团队
```

### Example 2: Over-Estimated AR Requiring Split ❌

```markdown
#### AR-002-01: 完整订单管理功能 (ORIGINAL - TOO LARGE)

**工作量估算**: 1.5K ❌ (超过0.5K限制)
```

**After Splitting** ✅:

```markdown
#### AR-002-01: 订单创建接口
**工作量估算**: 0.3K ✅

#### AR-002-02: 订单查询和列表
**工作量估算**: 0.25K ✅

#### AR-002-03: 订单状态更新
**工作量估算**: 0.2K ✅

#### AR-002-04: 订单取消和退款
**工作量估算**: 0.35K ✅

#### AR-002-05: 订单导出功能
**工作量估算**: 0.25K ✅

#### AR-002-06: 订单统计报表
**工作量估算**: 0.15K ✅

Total: 1.5K ✅ (matches original, but now properly decomposed)
```

## Common Estimation Mistakes

### Mistake 1: Forgetting Testing Effort

❌ Bad:

```
工作量估算: 0.2K (开发时间)
```

✅ Good:

```
工作量估算: 0.3K
  - 开发: 0.2K
  - 单元测试: 0.05K
  - 集成测试: 0.03K
  - 文档: 0.02K
```

### Mistake 2: Not Accounting for Uncertainty

❌ Bad:

```
工作量估算: 0.25K (理想情况)
```

✅ Good:

```
工作量估算: 0.3K
  - 基础估算: 0.25K
  - Buffer (20%): 0.05K
```

### Mistake 3: Double-Counting Dependencies

❌ Bad:

```
AR-001: 登录功能 (0.3K - 包含JWT库集成)
AR-002: Token验证 (0.2K - 包含JWT库集成)
```

✅ Good:

```
AR-000: JWT库集成 (0.1K - 一次性)
AR-001: 登录功能 (0.25K - 使用AR-000)
AR-002: Token验证 (0.15K - 使用AR-000)
```

### Mistake 4: Vague Scope Leading to Under-Estimation

❌ Bad:

```
AR-003: 数据同步功能 (0.2K)
[没有说明同步什么数据、频率、错误处理]
```

✅ Good:

```
AR-003: 用户订单数据每日增量同步到数据仓库 (0.35K)
  - 增量识别逻辑: 0.1K
  - 数据转换和清洗: 0.1K
  - ETL任务调度: 0.05K
  - 失败重试和告警: 0.05K
  - 监控和日志: 0.05K
```

## Quick Reference: Splitting Decision Tree

```
Start: AR workload > 0.5K?
  ├─ No → ✅ AR is valid
  └─ Yes → Need to split
      ├─ Multiple layers involved?
      │   └─ Yes → Split by layer (UI/API/Domain/Infra)
      ├─ Multiple scenarios?
      │   └─ Yes → Split by scenario (happy path/error cases)
      ├─ Multiple features?
      │   └─ Yes → Split by feature slice (MVP first)
      ├─ Complex + simple parts?
      │   └─ Yes → Split by complexity
      └─ Multiple technologies?
          └─ Yes → Split by technology stack
```
