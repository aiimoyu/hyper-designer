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
