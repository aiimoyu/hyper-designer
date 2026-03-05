# Domain-Driven Design Patterns for SR-AR Decomposition

## Bounded Context Identification

### What is a Bounded Context?
A bounded context is an explicit boundary within which a domain model is defined and applicable. It helps organize SRs by grouping related functionality.

### Discovery Questions
Ask these for each functional requirement:

1. **Entity Ownership**: What core data entities does this function own?
   - User authentication owns: User, Credential, Session
   - Order processing owns: Order, OrderItem, Payment
   
2. **Business Capability**: What single business capability does this provide?
   - User Management: Registration, profile, preferences
   - Inventory: Stock tracking, replenishment, allocation
   
3. **Change Frequency**: Do these functions change together?
   - If pricing rules and discount logic change together → same context
   - If user profile and order history change independently → separate contexts
   
4. **Team Structure**: Can a single team own this module?
   - One team should own one bounded context
   - Cross-context communication via well-defined interfaces

## Aggregate Roots

### Definition
An aggregate root is the entry point entity for a cluster of related objects that are treated as a single unit.

### Identification Pattern
```
IF entity E:
  - Has unique identity
  - Other entities reference it
  - Has lifecycle independent of other aggregates
  - Enforces business invariants for its cluster
THEN E is an aggregate root
```

### Examples
| Domain | Aggregate Root | Cluster Members |
|--------|----------------|-----------------|
| User Auth | User | Credential, Session, LoginHistory |
| E-commerce | Order | OrderItem, ShippingAddress, Payment |
| Content | Article | Comment, Tag, Revision |

## Module Responsibility Pattern

### Template
```markdown
## Module: [模块名称]

**Core Responsibility**: [一句话核心职责]

**Aggregate Roots**: 
- [Entity1]: [说明]
- [Entity2]: [说明]

**Bounded Context**: [边界说明]
- Owns: [拥有的数据/功能]
- Depends on: [依赖的其他模块]
- Exposes: [对外提供的接口]

**Anti-Corruption Layer**: [如何隔离外部复杂性]
```

### Example
```markdown
## Module: 用户认证模块

**Core Responsibility**: 管理用户身份验证和会话

**Aggregate Roots**: 
- User: 用户账户主实体
- Session: 活跃会话管理

**Bounded Context**: 
- Owns: 用户凭证、登录逻辑、token生成
- Depends on: 通知模块（发送验证码）
- Exposes: /auth/login, /auth/logout, /auth/verify APIs

**Anti-Corruption Layer**: 
- 通过AuthService接口隔离第三方OAuth提供商差异
```

## Strategic Design Patterns for SR Decomposition

### Pattern 1: Shared Kernel
**When**: Multiple modules need access to common core types

**SR Structure**:
- SR-CORE: 共享核心类型和实体
- SR-001: 业务模块A (依赖SR-CORE)
- SR-002: 业务模块B (依赖SR-CORE)

**Example**: 
- Shared Kernel: UserId, Money, DateRange
- Order Module uses these types
- Payment Module uses these types

### Pattern 2: Customer-Supplier
**When**: One module depends on another, clear provider-consumer relationship

**SR Structure**:
- SR-001 (Supplier): 提供数据或服务
- SR-002 (Customer): 消费SR-001的输出

**Interface Contract**: Supplier defines API, Customer adapts

**Example**:
- SR-001: 库存服务 (Supplier) - 提供库存查询API
- SR-002: 订单服务 (Customer) - 调用库存API检查可用性

### Pattern 3: Conformist
**When**: Downstream module must fully conform to upstream (e.g., third-party API)

**SR Structure**:
- SR-001: 外部系统集成模块 (Conformist)
- SR-002: 业务逻辑模块 (使用SR-001)

**Example**:
- SR-001: 支付网关集成 - 完全遵循Stripe API
- SR-002: 订单支付流程 - 通过SR-001调用支付

### Pattern 4: Anti-Corruption Layer (ACL)
**When**: Need to protect domain model from external system complexity

**SR Structure**:
- SR-001: 外部系统适配器 (ACL)
- SR-002: 核心业务模块 (使用简化接口)

**Example**:
- SR-001: 遗留ERP适配器 - 转换复杂ERP数据为简单领域对象
- SR-002: 库存管理 - 使用干净的库存模型

## Layered Architecture for AR Assignment

### Common Layers and AR Allocation

```
┌─────────────────────────┐
│  Presentation Layer     │ → AR分配给 Frontend Team
│  (UI/API Controllers)   │
├─────────────────────────┤
│  Application Layer      │ → AR分配给 Application Service Team
│  (Use Case Orchestration)│
├─────────────────────────┤
│  Domain Layer           │ → AR分配给 Domain Model Team
│  (Business Logic)       │
├─────────────────────────┤
│  Infrastructure Layer   │ → AR分配给 Infrastructure Team
│  (DB, External APIs)    │
└─────────────────────────┘
```

### AR Distribution Example

**SR-001: 用户注册功能**

- **AR-001-01**: 注册表单UI
  - Layer: Presentation
  - Team: Frontend Team
  - Workload: 0.2K
  
- **AR-001-02**: 注册业务流程编排
  - Layer: Application
  - Team: Backend Team
  - Workload: 0.3K
  
- **AR-001-03**: 用户实体和验证规则
  - Layer: Domain
  - Team: Domain Model Team
  - Workload: 0.25K
  
- **AR-001-04**: 用户数据持久化
  - Layer: Infrastructure
  - Team: Database Team
  - Workload: 0.15K

## Cross-Cutting Concerns

### System-Wide SRs (Should Not Be Per-Module)

**SR-SYS-001: 认证授权机制**
- Type: Cross-cutting
- Affects: All modules
- Implementation: Middleware/Interceptor pattern

**SR-SYS-002: 日志和监控**
- Type: Cross-cutting
- Affects: All modules
- Implementation: AOP (Aspect-Oriented Programming)

**SR-SYS-003: 错误处理标准**
- Type: Cross-cutting
- Affects: All modules
- Implementation: Global exception handler

### When to Extract Cross-Cutting SRs

**Indicators**:
- Same requirement appears in 3+ modules
- Changes need to be synchronized across modules
- Centralized enforcement needed (security, compliance)

**Action**: Create separate SR-SYS-XXX for system-wide concerns

## Module Coupling Metrics

### Acceptable Coupling Levels

| Coupling Type | Description | Acceptable for SR-SR | Action |
|---------------|-------------|----------------------|--------|
| No Coupling | Completely independent | ✅ Ideal | No interface needed |
| Data Coupling | Share only data structures | ✅ Good | Define data contract |
| Message Coupling | Communicate via messages | ✅ Good | Define message schema |
| Control Coupling | Pass control flow | ⚠️ Review | Consider refactoring |
| Common Coupling | Share global state | ❌ Bad | Refactor to data coupling |
| Content Coupling | Directly modify another's data | ❌ Forbidden |严格禁止 |

### Decoupling Strategies for ARs

**Problem**: AR-001-02 needs data from AR-002-03

**Solution Options**:
1. **API Call**: AR-001-02 calls interface provided by SR-002
2. **Event-Driven**: SR-002 publishes event, SR-001 subscribes
3. **Shared Database**: Both read from common table (use sparingly)
4. **Data Transfer Object**: SR-002 provides DTO via message queue

**Choose Based On**:
- Synchronous need → API Call
- Loose temporal coupling → Event-Driven
- Performance critical → Shared Database (with caution)
- Batch processing → Data Transfer Object


## System Element (SE) Mapping from Bounded Contexts

### 映射步骤

将DDD限界上下文映射到系统元素(System Element)的标准流程：

**Step 1: 识别架构元素 (Architecture Element)**
每个限界上下文映射为一个或多个架构元素（SE-XXX）：
- 独立部署的服务 → SE-XXX (Type: Service)
- 可复用的功能模块 → SE-XXX (Type: Module)
- 中间件/网关 → SE-XXX (Type: Middleware/Gateway)
- 存储组件 → SE-XXX (Type: Storage)
- 外部系统适配器 → SE-XXX (Type: Adapter)

**Step 2: 识别功能对象 (Functional Object)**
在每个架构元素内部识别功能对象（FO-XXX）：
- 聚合根 → FO-XXX (Type: Aggregate Root)
- 实体处理器 → FO-XXX (Type: Entity Handler)
- 业务处理器 → FO-XXX (Type: Processor)
- 适配器/工厂 → FO-XXX (Type: Adapter/Factory)
- 事件发布/订阅者 → FO-XXX (Type: Event Publisher/Subscriber)

**Step 3: 定义跨上下文接口**
限界上下文间的通信映射为接口规格（IF-XXX）：
- 同步调用 → IF-XXX (Type: REST API / gRPC)
- 异步消息 → IF-XXX (Type: Message Queue / Event)
- 内部方法 → IF-XXX (Type: Internal Method)

### 决策表：单个BC vs 多个SE

| 场景 | 映射策略 | 示例 |
|------|---------|------|
| BC内高内聚，独立部署 | 1 BC → 1 SE (Service) | 用户认证上下文 → auth-service (SE-001) |
| BC内模块化，共享部署 | 1 BC → 多个 SE (Module) | 订单上下文 → order-core (SE-001), order-processor (SE-002) |
| BC依赖多个外部系统 | 1 BC + 多个 Adapter SE | 支付上下文 → payment-service (SE-001), stripe-adapter (SE-002) |
| 多个BC共享基础能力 | 提取 Shared Kernel SE | 日志、监控 → shared-infrastructure (SE-001) |

### 示例：用户认证上下文映射

**限界上下文**: 用户认证 (User Authentication)

```
BC: 用户认证
├── SE-001: auth-service (Architecture Element - Service)
│   ├── FO-001: TokenGenerator (Functional Object - Aggregate Root)
│   ├── FO-002: SessionManager (Functional Object - Entity Handler)
│   └── FO-003: AuthValidator (Functional Object - Processor)
│
├── SE-002: auth-cache (Architecture Element - Storage)
│   └── FO-004: SessionCache (Functional Object - Adapter)
│
└── 接口规格:
    ├── IF-001: AUTH-IF-001: 用户认证接口 (REST API)
    └── IF-002: AUTH-IF-002: 会话管理接口 (REST API)
```

**系统元素清单**:

| 元素ID | 元素名称 | 元素类型 | 核心职责 | 所属子系统 |
|--------|---------|---------|---------|-----------|
| SE-001 | auth-service | Service | 用户身份验证和会话管理 | 认证子系统 |
| SE-002 | auth-cache | Storage | 会话数据缓存 | 认证子系统 |

| 对象ID | 对象名称 | 所属架构元素 | 核心职责 | 聚合根/实体 |
|--------|---------|------------|---------|------------|
| FO-001 | TokenGenerator | SE-001 | JWT Token生成与验证 | 聚合根 |
| FO-002 | SessionManager | SE-001 | 会话生命周期管理 | 实体处理器 |
| FO-003 | AuthValidator | SE-001 | 认证请求验证 | 处理器 |
| FO-004 | SessionCache | SE-002 | Redis会话缓存操作 | 适配器 |

## SE/FO Naming Conventions

### Architecture Elements (SE-XXX)

**编号格式**: `SE-{3位顺序号}`

示例：SE-001, SE-002, SE-003

**元素类型**:
- Service: 独立部署的服务
- Module: 可复用的功能模块
- Middleware: 中间件
- Gateway: 网关
- Storage: 存储组件
- Adapter: 外部系统适配器

**命名格式**: `[子系统缩写]-[功能描述]`

示例：
- `auth-service` — 认证服务
- `order-module` — 订单模块
- `api-gateway` — API网关
- `user-db` — 用户数据库
- `payment-adapter` — 支付适配器

### Functional Objects (FO-XXX)

**编号格式**: `FO-{3位顺序号}`

示例：FO-001, FO-002, FO-003

**对象类型**:
- Aggregate Root: 聚合根
- Entity Handler: 实体处理器
- Processor: 业务处理器
- Adapter: 适配器
- Factory: 工厂
- Event Publisher: 事件发布者
- Event Subscriber: 事件订阅者

**命名格式**: PascalCase领域概念

示例：
- `TokenGenerator` — Token生成器
- `OrderProcessor` — 订单处理器
- `PaymentFactory` — 支付工厂
- `NotificationPublisher` — 通知发布者

### Interfaces (IF-XXX)

**编号格式**: `IF-{3位顺序号}`

示例：IF-001, IF-002, IF-003

**命名格式**: `IF-{3位顺序号}: [接口名称]` （规范格式）

> **说明**: 接口ID统一使用 `IF-XXX` 编号（如 IF-001, IF-002），确保全局唯一。功能域缩写前缀（如 `AUTH-IF-001`）为可选的辅助标注，仅用于文档阅读便利性，不作为正式ID。在接口规格汇总表和追溯表中，必须使用 `IF-XXX` 规范编号。

示例：
- `AUTH-IF-001: 用户认证接口`
- `AUTH-IF-002: 会话管理接口`
- `ORDER-IF-001: 订单创建接口`
- `PAYMENT-IF-001: 支付处理接口`

**功能域缩写表**:

| 功能域 | 缩写 |
|--------|------|
| 用户认证 | AUTH |
| 订单管理 | ORDER |
| 支付处理 | PAYMENT |
| 库存管理 | INVENTORY |
| 通知服务 | NOTIF |
| 用户管理 | USER |

## Bounded Context → SE Checklist

在完成限界上下文到系统元素的映射后，使用以下检查清单验证映射的正确性：

### 映射完整性检查

- [ ] 每个限界上下文至少分配了一个 SE-XXX
- [ ] 每个聚合根都有对应的 FO-XXX 记录
- [ ] FO-XXX 记录引用了其父级 SE-XXX
- [ ] 跨上下文依赖已定义 IF-XXX 接口规格

### 类型合规检查

- [ ] SE 类型来自标准集合
- [ ] FO 类型来自标准集合
- [ ] IF 类型与实际通信方式匹配（REST/gRPC/Event/MQ/Internal）

### 边界清晰性检查

- [ ] 没有SE跨越多个限界上下文（除非明确标注为Shared Kernel）
- [ ] 数据所有权明确：每个核心实体只属于一个SE
- [ ] 接口定义清晰：跨SE的交互都通过IF-XXX定义

### 职责一致性检查

- [ ] SE的核心职责与所属限界上下文的业务能力一致
- [ ] FO的职责粒度适当（不过粗也不过细）
- [ ] 接口的提供方和消费方明确

### DFD追溯性检查

- [ ] SE-XXX 可追溯到限界上下文文档
- [ ] FO-XXX 可追溯到聚合根/实体定义
- [ ] IF-XXX 可追溯到上下文映射图

### 示例检查清单填写

**项目**: 用户认证系统

```
✅ 每个限界上下文至少分配了一个 SE-XXX
   - 用户认证上下文 → SE-001 auth-service ✓
   - 会话管理上下文 → SE-002 auth-cache ✓

✅ 每个聚合根都有对应的 FO-XXX 记录
   - User聚合根 → FO-001 TokenGenerator ✓
   - Session聚合根 → FO-002 SessionManager ✓

✅ FO-XXX 记录引用了其父级 SE-XXX
   - FO-001 → SE-001 ✓
   - FO-002 → SE-001 ✓
   - FO-003 → SE-002 ✓

✅ 跨上下文依赖已定义 IF-XXX 接口规格
   - 用户认证 → 订单服务: IF-001 AUTH-IF-001 ✓
   - 会话管理 → 缓存服务: IF-002 AUTH-IF-002 ✓

✅ SE 类型来自标准集合
   - SE-001: Service ✓
   - SE-002: Storage ✓

✅ 没有SE跨越多个限界上下文
   - 所有SE都明确归属单一上下文 ✓

✅ 数据所有权明确
   - User实体 → SE-001 ✓
   - Session实体 → SE-002 ✓
```
