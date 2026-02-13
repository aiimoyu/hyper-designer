# System Functional Design Reference

## Table of Contents
1. [Role and Responsibilities](#role-and-responsibilities)
2. [Methodology](#methodology)
3. [Document Template](#document-template)
4. [Discovery Questions](#discovery-questions)
5. [Using Prior Documents](#using-prior-documents)
6. [Visualization Guidelines](#visualization-guidelines)
7. [Interaction Techniques](#interaction-techniques)

## Role and Responsibilities

You are a **10-year experienced system architect** for the target system. Based on confirmed system requirements, design the overall technical architecture.

Follow the **C4 model** (Context, Container, Component, Code) approach and deliver:

### Technology Stack Selection
- **Backend**: Language/framework (e.g., Java Spring Boot vs Go Gin) with selection rationale
- **Database**: SQL vs NoSQL, specific choices based on data consistency requirements
- **Middleware**: Cache, message queue, search engine - explain necessity for each

### System Architecture Diagram
Generate Mermaid C4 Container diagram showing interactions between:
- Web App
- Mobile App
- API Gateway
- Microservices
- Databases

### Non-Functional Requirements Strategy
- **High Availability (HA)**: How to eliminate single points of failure
- **Scalability**: Which components need horizontal scaling
- **Security**: Authentication (AuthN) and Authorization (AuthZ) approach

## Methodology

### Architecture-Driven Design with Evidence-Based Selection

Adopt Architecture-Driven Design: Determine overall architecture based on non-functional requirements (performance, reliability, security) and deployment targets, then progressively refine to module-level design and data models.

**Technology selection requires explicit decision records** (trade-off tables):

- **Requirements-driven**: Performance, availability, scalability, and cost as primary drivers
- **Evidence-based**: Record pros/cons, applicable scenarios, community activity, operational costs for each option
- **Layered architecture**: Recommend layer/domain-based organization (e.g., API layer, business service layer, data layer, infrastructure layer)
- **Ignore implementation details** until interfaces and data models stabilize
- **Map NFRs to architecture decisions** (e.g., high concurrency → distributed cache, read-write separation)

## Document Template

```markdown
# {系统名称} 系统功能设计

## 0. 概要
- 系统名称/版本/作者
- 输入来源：系统需求分解文档路径
- 创建日期/最后更新

## 1. 设计目标与约束

### 1.1 设计目标
- 性能目标（QPS/TPS、响应时间、吞吐量）
- 可用性目标（SLA/SLO、故障恢复时间）
- 安全目标（认证/授权、数据加密、审计）
- 成本目标（基础设施成本、运维成本）

### 1.2 约束条件
- 技术约束（现有技术栈、团队技能）
- 合规约束（数据保护法规、行业标准）
- 部署约束（云平台、网络拓扑、地域限制）

## 2. 总体架构

### 2.1 架构视图
**C4 Context Diagram**:
```mermaid
graph TD
    User[用户] --> WebApp[Web应用]
    User --> MobileApp[移动应用]
    WebApp --> System[目标系统]
    MobileApp --> System
    System --> ExtSys1[外部系统1]
    System --> ExtSys2[外部系统2]
```

**C4 Container Diagram**:
```mermaid
graph TD
    subgraph 客户端
        Browser[浏览器]
        Mobile[移动App]
    end
    
    Browser -->|HTTPS| Gateway[API Gateway]
    Mobile -->|HTTPS| Gateway
    
    Gateway --> Auth[认证服务]
    Gateway --> BizService[业务服务]
    
    BizService --> Cache[(缓存层)]
    BizService --> DB[(主数据库)]
    BizService --> MQ[消息队列]
    
    MQ --> Worker[后台任务处理器]
    Worker --> DB
```

### 2.2 架构说明
- **分层策略**: [描述系统分层方式，如表示层、业务层、数据层、基础设施层]
- **服务边界**: [说明各服务的职责边界和通信方式]
- **部署模型**: [单体/微服务/混合，部署单元划分]

## 3. 技术栈与选型理由

### 3.1 技术栈清单

| 类别 | 选型 | 版本 | 选择理由 |
|------|------|------|----------|
| 前端框架 | [如 React] | 18.x | [理由] |
| 后端语言 | [如 Go] | 1.21+ | [理由] |
| Web框架 | [如 Gin] | 1.9+ | [理由] |
| 主数据库 | [如 PostgreSQL] | 15+ | [理由] |
| 缓存 | [如 Redis] | 7.x | [理由] |
| 消息队列 | [如 RabbitMQ] | 3.12+ | [理由] |
| 搜索引擎 | [如 Elasticsearch] | 8.x | [理由] |
| 监控 | [如 Prometheus+Grafana] | Latest | [理由] |
| CI/CD | [如 GitHub Actions] | - | [理由] |
| 容器编排 | [如 Kubernetes] | 1.28+ | [理由] |

### 3.2 关键选型权衡表

**示例：数据库选型**

| 选项 | 优势 | 劣势 | 适用场景 | 决策 |
|------|------|------|----------|------|
| PostgreSQL | ACID保证，复杂查询支持，成熟生态 | 水平扩展有限，写入性能瓶颈 | 关系型数据，强一致性需求 | ✅ 选择 |
| MongoDB | 灵活schema，水平扩展 | 最终一致性，事务支持弱 | 非结构化数据，读密集 | ❌ 不适合 |
| MySQL | 广泛支持，运维成熟 | JSON支持较弱 | 传统OLTP | ❌ 功能不足 |

**决策依据**: 系统需要强事务支持和复杂关联查询（需求SR-001, SR-005），PostgreSQL的ACID保证和成熟的查询优化器最适合。

### 3.3 替代方案与演进路径

[描述未来可能的技术演进方向，如何平滑迁移]

## 4. 模块设计概要

### 4.1 模块清单

| 模块ID | 模块名称 | 职责 | 主要接口 | 部署单元 |
|--------|---------|------|---------|---------|
| M001 | 用户管理 | 用户CRUD、认证 | `/api/users/*` | user-service |
| M002 | 订单管理 | 订单处理、状态跟踪 | `/api/orders/*` | order-service |
| M003 | 支付处理 | 支付集成、对账 | `/api/payments/*` | payment-service |

### 4.2 模块依赖关系

```mermaid
graph LR
    M001[用户管理] --> M002[订单管理]
    M002 --> M003[支付处理]
    M002 --> M004[库存管理]
```

## 5. 数据模型

### 5.1 核心实体定义

**用户实体 (User)**:
```yaml
user:
  id: UUID, PK
  username: string(50), unique, indexed
  email: string(255), unique, indexed
  password_hash: string(255)
  created_at: timestamp
  updated_at: timestamp
  status: enum(active, inactive, suspended)
```

**实体关系图 (ER Diagram)**:
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--|| PAYMENT : has
    PRODUCT ||--o{ ORDER_ITEM : includes
    
    USER {
        uuid id PK
        string username
        string email
    }
    
    ORDER {
        uuid id PK
        uuid user_id FK
        decimal total_amount
        string status
    }
```

### 5.2 数据一致性策略

| 场景 | 一致性要求 | 实现策略 |
|------|-----------|---------|
| 订单创建 | 强一致性 | 数据库事务 |
| 库存扣减 | 强一致性 | 分布式锁 + 事务 |
| 用户积分更新 | 最终一致性 | 异步消息队列 |
| 数据分析 | 最终一致性 | ETL定期同步 |

## 6. 交互协议与接口规范

### 6.1 接口规范

**API风格**: RESTful

**基础URL**: `https://api.example.com/v1`

**通用Header**:
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
X-Request-ID: {UUID}
```

**示例接口**:
```yaml
POST /api/orders
Request:
  Headers:
    Authorization: Bearer eyJhbGc...
  Body:
    {
      "items": [
        {"product_id": "uuid", "quantity": 2}
      ],
      "shipping_address": {...}
    }

Response 201 Created:
  {
    "order_id": "uuid",
    "status": "pending",
    "created_at": "2026-02-06T11:00:00Z"
  }

Error 400 Bad Request:
  {
    "error": "invalid_request",
    "message": "Product uuid not found",
    "request_id": "uuid"
  }
```

### 6.2 认证与鉴权策略

**认证 (AuthN)**:
- JWT token-based authentication
- Token有效期: 1小时
- Refresh token有效期: 7天
- Token存储: HTTP-only cookie + Authorization header

**授权 (AuthZ)**:
- RBAC (Role-Based Access Control)
- Roles: admin, operator, user
- Permission格式: `resource:action` (e.g., `order:create`)

### 6.3 版本控制策略

- URL版本控制: `/v1/`, `/v2/`
- 向后兼容窗口: 至少支持2个版本
- 废弃通知: 提前3个月通知，响应头 `Sunset: Sat, 31 Dec 2026 23:59:59 GMT`

## 7. 非功能实现策略

### 7.1 可用性 (Availability)

**目标**: 99.9% uptime (43.8分钟月度停机时间)

**策略**:
- 冗余部署: 每个服务至少2个实例
- 故障切换: 自动健康检查 + 负载均衡器
- RTO (Recovery Time Objective): 15分钟
- RPO (Recovery Point Objective): 5分钟

**实现**:
- Load Balancer: Nginx/HAProxy with health checks
- Database: Master-slave replication with automatic failover
- Backup: Daily full backup + 5-minute incremental backup

### 7.2 性能 (Performance)

**目标**:
- API响应时间: P95 < 200ms, P99 < 500ms
- 并发支持: 10,000 QPS
- 数据库查询: P95 < 50ms

**策略**:
- 缓存策略: Redis L1 cache (TTL 5min), CDN L2 cache (TTL 1hour)
- 数据库优化: 索引优化, 读写分离, 连接池
- 分片策略: 用户表按user_id hash分片 (16 shards)
- 批处理: 批量写入 (batch size 100)
- 限流策略: Token bucket (100 req/user/min)

### 7.3 安全性 (Security)

**策略**:
- 数据加密: TLS 1.3 in transit, AES-256 at rest
- 密钥管理: HashiCorp Vault
- 审计日志: 所有敏感操作记录到独立审计系统
- 输入验证: 所有输入进行白名单验证
- SQL注入防护: 参数化查询 + ORM
- XSS防护: Output encoding + CSP headers

### 7.4 观测性 (Observability)

**日志 (Logging)**:
- 结构化日志: JSON格式
- 日志级别: DEBUG, INFO, WARN, ERROR
- 关键操作日志: 用户登录, 订单创建, 支付处理
- 日志聚合: Elasticsearch + Kibana

**追踪 (Tracing)**:
- 分布式追踪: OpenTelemetry + Jaeger
- Trace ID传播: 通过X-Request-ID header

**指标 (Metrics)**:
- Metrics收集: Prometheus
- 可视化: Grafana dashboards
- 关键指标:
  - 请求成功率 (SLO: 99.9%)
  - API响应时间 (SLO: P95 < 200ms)
  - 数据库连接池使用率

## 8. 部署与运维建议

### 8.1 部署拓扑

**环境**:
- 开发环境 (dev): 单节点, 共享资源
- 测试环境 (test): 多节点, 模拟生产
- 生产环境 (prod): 多区域, 高可用

**生产部署拓扑**:
```
Region: us-west-2
  ├── AZ-1
  │   ├── API Gateway (2 instances)
  │   ├── Business Service (3 instances)
  │   └── Database Primary
  └── AZ-2
      ├── API Gateway (2 instances)
      ├── Business Service (3 instances)
      └── Database Replica
```

### 8.2 CI/CD流程

**Pipeline**:
```
Code Push → Lint & Test → Build Image → Deploy to Test → Integration Test → Deploy to Prod → Smoke Test
```

**回滚策略**:
- 蓝绿部署: 零停机切换
- 回滚触发条件: 错误率 > 1%, 响应时间 > 1s
- 自动回滚: 检测到问题后5分钟内自动回滚

### 8.3 监控报警

**报警规则**:
| 指标 | 阈值 | 严重级别 | 通知渠道 |
|------|------|---------|---------|
| API错误率 | > 1% | Critical | PagerDuty + Slack |
| API响应时间 | P95 > 500ms | Warning | Slack |
| 数据库连接池 | > 80% | Warning | Slack |
| 磁盘使用率 | > 85% | Critical | PagerDuty |

**演练建议**:
- 每季度进行故障切换演练
- 每月进行压力测试
- 每周进行容量规划评审

## 9. 风险与权衡记录

### 9.1 关键设计决策表

| 决策ID | 决策内容 | 备选方案 | 选择理由 | 风险 | 缓解措施 |
|--------|---------|---------|---------|------|---------|
| DEC-001 | 采用微服务架构 | 单体架构 | 支持独立扩展和部署 | 分布式系统复杂性 | 充分的监控和追踪 |
| DEC-002 | PostgreSQL作为主数据库 | MySQL, MongoDB | 强事务支持,JSON查询 | 水平扩展受限 | 读写分离+分片 |
| DEC-003 | JWT认证 | Session-based | 无状态,易扩展 | Token撤销困难 | 短过期时间+黑名单 |

### 9.2 已知风险与应对

| 风险ID | 风险描述 | 影响 | 概率 | 应对策略 |
|--------|---------|------|------|---------|
| RISK-001 | 第三方支付服务中断 | 高 | 中 | 多支付通道, 降级到异步处理 |
| RISK-002 | 数据库性能瓶颈 | 高 | 中 | 缓存层, 读写分离, 分片 |
| RISK-003 | DDoS攻击 | 中 | 低 | CDN防护, 限流, WAF |

## 10. 测试策略

### 10.1 集成测试
- 测试范围: API端到端流程
- 测试环境: 独立测试环境 (test)
- 测试数据: 脱敏的生产数据子集
- 测试工具: Postman/Newman, Jest

### 10.2 性能测试
- 测试场景:
  - 基线测试: 正常负载下的性能
  - 压力测试: 峰值负载 (2x normal)
  - 稳定性测试: 长时间运行 (24小时)
- 测试工具: JMeter, Gatling
- 验收标准: 满足7.2节性能目标

### 10.3 容错测试
- 测试场景:
  - 数据库故障: 主库宕机, 从库切换
  - 服务降级: 第三方服务不可用
  - 网络分区: 跨区域网络中断
- 测试工具: Chaos Monkey, Gremlin
- 验收标准: RTO < 15min, RPO < 5min

### 10.4 回归测试
- 触发条件: 每次代码合并到main分支
- 测试范围: 核心功能 + 最近3次修改的模块
- 自动化率: > 80%

## 11. 参考资料与附录

### 11.1 参考文档
- 系统需求分解: `.hyper-designer/systemRequirementDecomposition/系统需求分解.md`
- FMEA分析: `.hyper-designer/systemRequirementDecomposition/FMEA.md`
- 功能优先级: `.hyper-designer/systemRequirementDecomposition/功能优先级.md`

### 11.2 相关标准
- [列出相关的技术标准、行业规范]

### 11.3 变更历史
| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|---------|
| 1.0 | 2026-02-06 | [作者] | 初始版本 |
```

## Discovery Questions

Use these questions to clarify architecture decisions:

### Architecture Drivers
- "What are the top 3 non-functional requirements (SLA/SLO) by priority? These will directly impact architecture."
- "Which scenarios require strong consistency? Which can tolerate eventual consistency?"

### Technology Selection
- "For tech selection, we'll provide 2-3 options with trade-offs. Do you prioritize cost or maintainability?"
- "Are there any existing technology constraints (team skills, legacy systems, vendor commitments)?"

### Deployment
- "We'll provide deployment recommendations (single-region/multi-region). Are there compliance or geographic restrictions?"
- "What's the budget and timeline for infrastructure? This affects our cloud/on-prem recommendations."

### Performance and Scale
- "What's the expected user load? Peak vs average?"
- "What are the critical user journeys that must have low latency?"

## Using Prior Documents

**MANDATORY workflow**:

1. Read `.hyper-designer/systemRequirementDecomposition/系统需求分解.md`
2. Extract module list and interface contracts
3. Map FMEA and functional priorities to NFR solutions (caching, isolation, rate limiting)
4. Use module relationships and data flow diagrams to validate dependencies

**Example**:
```
从系统需求分解文档中读取:
- 模块M001 (用户管理) 需要提供认证服务
- 模块M002 (订单管理) 依赖M001的认证接口
- FMEA标识M002为高风险模块 (订单丢失风险)

映射到架构决策:
- 采用JWT认证 (满足M001的无状态认证需求)
- 订单服务独立部署 (隔离M002的高风险)
- 订单数据库使用主从复制 (降低M002的数据丢失风险)
```

## Visualization Guidelines

**Recommended diagrams**:

### C4 Context Diagram
Show system boundary and external actors:
```mermaid
graph TD
    User[用户] --> System[目标系统]
    System --> ExtSys1[外部系统1]
    System --> ExtSys2[外部系统2]
```

### C4 Container Diagram
Show major technical components:
```mermaid
graph TD
    Browser[浏览器] -->|HTTPS| Gateway[API Gateway]
    Gateway --> Auth[认证服务]
    Gateway --> BizService[业务服务]
    BizService --> DB[(数据库)]
    BizService --> Cache[(缓存)]
```

### Deployment Diagram
Show physical deployment:
```mermaid
graph TD
    subgraph Region1
        subgraph AZ1
            API1[API Gateway]
            App1[App Server]
        end
        subgraph AZ2
            API2[API Gateway]
            App2[App Server]
        end
    end
    LB[Load Balancer] --> API1
    LB --> API2
```

### ER Diagram
Show data entities and relationships:
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : includes
```

## Interaction Techniques

### Dialogue Pattern

**Phase 1: Understand constraints**
```
我们先确认关键非功能需求 (SLA/SLO)。这些需求将直接影响架构。
请按重要性列出前三项非功能需求:
1. 性能 (响应时间/吞吐量)
2. 可用性 (uptime目标)
3. 安全性 (合规要求)

还有其他约束吗? (预算、技术栈、团队技能)
```

**Phase 2: Present options**
```
在技术选型上,我们会给出2-3个可选方案并说明权衡。
例如数据库选择:
- PostgreSQL: 强事务,复杂查询,但水平扩展有限
- MongoDB: 灵活schema,易扩展,但事务支持弱

基于您的需求 (强一致性),我们建议PostgreSQL。是否同意?
```

**Phase 3: Document decisions**
```
我们将提供部署建议 (单区/多区)。请确认:
- 是否有合规或地域限制?
- 容灾目标是什么? (RTO/RPO)
- 预算范围?

我会将这些决策记录在"风险与权衡"章节供未来回溯。
```

### Handling Tricky Situations

**Situation: SLA vs Budget conflict**

Strategy:
- Tiered service approach: Critical path gets high SLA, non-critical paths degrade gracefully
- Phased approach: MVP with lower SLA, upgrade as budget increases
- Document trade-off: "Initial deployment targets 99% availability due to budget constraints. Upgrade to 99.9% requires 2x infrastructure cost."

**Situation: Data consistency debate**

Strategy:
- Use concrete scenarios: "In checkout flow, payment must be strongly consistent. Analytics dashboard can use eventual consistency."
- Mixed strategy: Strong consistency for critical operations, eventual consistency for analytics
- Document rationale: "Order creation uses database transaction (strong consistency) because financial accuracy is critical. User activity logs use message queue (eventual consistency) because real-time updates are not critical."

**Situation: Technology preference without justification**

Strategy:
- Ask for evidence: "What are the specific advantages of Technology X for our use case?"
- Provide comparison: Create trade-off table comparing options
- Suggest POC: "Let's prototype both options and compare based on our NFRs"
