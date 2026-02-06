# Module Functional Design Reference

## Table of Contents
1. [Role and Responsibilities](#role-and-responsibilities)
2. [Methodology](#methodology)
3. [Document Template](#document-template)
4. [Discovery Questions](#discovery-questions)
5. [Using Prior Documents](#using-prior-documents)
6. [Visualization Guidelines](#visualization-guidelines)
7. [Interaction Techniques](#interaction-techniques)

## Role and Responsibilities

You are the **senior development lead** for the target module. Transform module requirements into implementable code design.

Follow **SOLID principles** and **design patterns**, delivering:

### Class and Object Design
- Identify core classes, interfaces, and data objects (DTO/VO)
- Generate Mermaid class diagrams showing inheritance, implementation, and dependencies

### Design Pattern Application
- Recommend design patterns (Strategy, Factory, Observer, Adapter, etc.)
- Explain why each pattern is used and what coupling problem it solves
- Example: "Use Strategy Pattern for multiple payment methods, Factory Pattern for order object creation"

### Key Business Logic Flow
- Provide pseudo-code or flowcharts for complex logic (e.g., "order splitting")
- Document time complexity and edge cases

### Detailed API Contract
- Define RESTful API paths, methods, headers, and body structures
- Include error codes, SLA, and example requests/responses

## Methodology

### Implementation-Oriented Modular Design (SOLID + Design Patterns)

Module design should target maintainability, testability, and extensibility using OOP/component-based thinking and SOLID principles:

- **Single Responsibility (SRP)**: Clear module responsibilities
- **Open/Closed (OCP)**: Extend behavior via interfaces without modifying existing code
- **Liskov Substitution (LSP)**: Interchangeable interface implementations
- **Interface Segregation (ISP)**: Narrow interfaces, not bloated ones
- **Dependency Inversion (DIP)**: Depend on interfaces, not concrete implementations

Apply appropriate design patterns (Strategy, Factory, Observer, Adapter, etc.) where needed.

## Document Template

```markdown
# {模块名} 模块功能设计

## 0. 概要
- 模块名称/ID: [如 M001-用户管理]
- 版本/作者/日期: [v1.0 / 张三 / 2026-02-06]
- 依赖的系统功能与上游文档路径:
  - 系统功能设计: `.hyper-designer/systemFunctionalDesign/系统功能设计.md`
  - 系统需求分解: `.hyper-designer/systemRequirementDecomposition/系统需求分解.md`

## 1. 目标与职责

### 1.1 模块目标
[描述模块存在的目的和要解决的问题]

### 1.2 主要功能列表
- 功能1: [描述]
- 功能2: [描述]
- 功能3: [描述]

### 1.3 边界与依赖
- 模块边界: [什么属于该模块,什么不属于]
- 依赖模块: [列出依赖的其他模块及依赖原因]
- 被依赖模块: [列出依赖本模块的其他模块]

## 2. 接口规范

### 2.1 对外API

**API列表**:

| 端点 | 方法 | 描述 | SLA |
|------|------|------|-----|
| `/api/users` | POST | 创建用户 | P95 < 200ms |
| `/api/users/{id}` | GET | 查询用户 | P95 < 100ms |
| `/api/users/{id}` | PUT | 更新用户 | P95 < 200ms |
| `/api/users/{id}` | DELETE | 删除用户 | P95 < 200ms |

**详细接口定义**:

#### POST /api/users

**描述**: 创建新用户

**Request**:
```json
{
  "username": "string (required, 3-50 chars, alphanumeric)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 8 chars)",
  "profile": {
    "first_name": "string (optional)",
    "last_name": "string (optional)"
  }
}
```

**Response 201 Created**:
```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "timestamp"
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "invalid_request",
  "message": "Username already exists",
  "field": "username"
}

// 500 Internal Server Error
{
  "error": "internal_error",
  "message": "Failed to create user",
  "request_id": "uuid"
}
```

**Error Codes**:
| 状态码 | 错误码 | 描述 | 可重试 |
|--------|--------|------|--------|
| 400 | invalid_request | 请求参数错误 | ❌ |
| 409 | conflict | 用户名/邮箱已存在 | ❌ |
| 500 | internal_error | 服务器内部错误 | ✅ |
| 503 | service_unavailable | 服务暂时不可用 | ✅ |

### 2.2 内部接口

如果模块被其他模块调用 (非HTTP API),定义内部接口:

```go
// UserService interface for internal use
type UserService interface {
    CreateUser(ctx context.Context, req *CreateUserRequest) (*User, error)
    GetUser(ctx context.Context, userID string) (*User, error)
    ValidateCredentials(ctx context.Context, username, password string) (*User, error)
}
```

### 2.3 事件发布/订阅

如果模块发布或订阅事件:

**发布事件**:
| 事件名称 | 触发条件 | 事件数据 |
|---------|---------|---------|
| user.created | 用户创建成功 | `{"user_id": "uuid", "username": "string"}` |
| user.updated | 用户信息更新 | `{"user_id": "uuid", "changes": {...}}` |

**订阅事件**:
| 事件名称 | 处理逻辑 |
|---------|---------|
| payment.completed | 更新用户积分 |

## 3. 内部架构与组件

### 3.1 组件结构

**分层架构**:
```
┌─────────────────────────────┐
│   API Layer (Controllers)   │  ← HTTP handlers
├─────────────────────────────┤
│   Service Layer (Business)  │  ← Business logic
├─────────────────────────────┤
│   Repository Layer (Data)   │  ← Data access
└─────────────────────────────┘
```

### 3.2 类图

```mermaid
classDiagram
    class UserController {
        +CreateUser(req)
        +GetUser(id)
        +UpdateUser(id, req)
        +DeleteUser(id)
    }
    
    class UserService {
        <<interface>>
        +CreateUser(ctx, req) User
        +GetUser(ctx, id) User
        +ValidateCredentials(ctx, username, password) User
    }
    
    class UserServiceImpl {
        -repo UserRepository
        -validator Validator
        -passwordHasher PasswordHasher
        +CreateUser(ctx, req) User
        +GetUser(ctx, id) User
        +ValidateCredentials(ctx, username, password) User
    }
    
    class UserRepository {
        <<interface>>
        +Create(ctx, user) error
        +FindByID(ctx, id) User
        +FindByUsername(ctx, username) User
        +Update(ctx, user) error
        +Delete(ctx, id) error
    }
    
    class PostgresUserRepository {
        -db *sql.DB
        +Create(ctx, user) error
        +FindByID(ctx, id) User
        +FindByUsername(ctx, username) User
        +Update(ctx, user) error
        +Delete(ctx, id) error
    }
    
    class User {
        +ID string
        +Username string
        +Email string
        +PasswordHash string
        +CreatedAt time
        +UpdatedAt time
    }
    
    UserController --> UserService
    UserService <|.. UserServiceImpl
    UserServiceImpl --> UserRepository
    UserRepository <|.. PostgresUserRepository
    UserServiceImpl ..> User
    PostgresUserRepository ..> User
```

### 3.3 主要类/方法说明

**UserController** (API Layer):
- 职责: 处理HTTP请求,参数验证,调用Service层
- 不包含业务逻辑

**UserServiceImpl** (Business Layer):
- 职责: 实现业务逻辑,协调Repository和其他服务
- 包含事务边界
- 包含业务验证 (用户名唯一性、密码强度等)

**PostgresUserRepository** (Data Layer):
- 职责: 数据持久化,SQL查询
- 不包含业务逻辑

### 3.4 关键算法与流程

**用户创建流程**:
```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant Validator
    participant PasswordHasher
    participant Repository
    participant DB
    participant EventBus
    
    Client->>Controller: POST /api/users
    Controller->>Validator: 验证请求参数
    Validator-->>Controller: 验证通过
    
    Controller->>Service: CreateUser(req)
    Service->>Repository: FindByUsername(username)
    Repository->>DB: SELECT ... WHERE username=?
    DB-->>Repository: NULL (用户不存在)
    Repository-->>Service: NULL
    
    Service->>PasswordHasher: Hash(password)
    PasswordHasher-->>Service: password_hash
    
    Service->>Repository: Create(user)
    Repository->>DB: INSERT INTO users ...
    DB-->>Repository: Success
    Repository-->>Service: Success
    
    Service->>EventBus: Publish(user.created)
    EventBus-->>Service: Success
    
    Service-->>Controller: User
    Controller-->>Client: 201 Created
```

**密码验证算法 (伪代码)**:
```python
def validate_credentials(username: str, password: str) -> User:
    """
    验证用户凭证
    
    Time Complexity: O(1) for username lookup + O(bcrypt) for password verification
    Space Complexity: O(1)
    
    Args:
        username: 用户名
        password: 明文密码
        
    Returns:
        User对象 (验证成功)
        
    Raises:
        InvalidCredentialsError: 用户名或密码错误
    """
    
    # 1. 查询用户 (O(1) with index)
    user = repository.find_by_username(username)
    if user is None:
        # 使用constant-time comparison防止时序攻击
        dummy_hash = "$2a$10$dummy..."
        bcrypt.compare(password, dummy_hash)
        raise InvalidCredentialsError("Invalid username or password")
    
    # 2. 验证密码 (O(bcrypt) ≈ 100ms)
    if not bcrypt.compare(password, user.password_hash):
        raise InvalidCredentialsError("Invalid username or password")
    
    # 3. 检查用户状态
    if user.status != "active":
        raise AccountDisabledError("Account is disabled")
    
    # 4. 记录登录日志 (异步)
    event_bus.publish_async("user.logged_in", {"user_id": user.id})
    
    return user
```

**边界条件处理**:
- 并发创建相同用户名: 依赖数据库UNIQUE约束,捕获duplicate key错误
- 密码为空/null: 在Validator层拦截
- 用户不存在: 返回统一错误消息,不泄露用户是否存在
- 数据库连接失败: 自动重试3次,超时返回503

## 4. 数据结构与存储

### 4.1 核心实体定义

**User表**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT check_username_length CHECK (length(username) >= 3),
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- 索引建议
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE status = 'active';
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**字段说明**:
| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | UUID | ✅ | auto | 主键 |
| username | VARCHAR(50) | ✅ | - | 用户名, 3-50字符, 唯一 |
| email | VARCHAR(255) | ✅ | - | 邮箱, 唯一 |
| password_hash | VARCHAR(255) | ✅ | - | bcrypt密码哈希 |
| status | VARCHAR(20) | ✅ | 'active' | 用户状态: active/inactive/suspended |
| created_at | TIMESTAMP | ✅ | NOW() | 创建时间 |
| updated_at | TIMESTAMP | ✅ | NOW() | 最后更新时间 |

### 4.2 存储方案

**主存储**: PostgreSQL
- 原因: 需要事务支持,复杂查询 (JOIN, 子查询)
- 预估数据量: 100万用户 (3年)
- 数据增长: 1000用户/天

**缓存策略**:
- Redis缓存用户基本信息
- Cache key: `user:{user_id}`
- TTL: 5分钟
- 缓存更新: Write-through (更新数据库时同步更新缓存)

**分库分表策略** (如需要):
- 分片键: `user_id` (UUID hash)
- 分片数: 16个shard
- 路由算法: `shard_id = crc32(user_id) % 16`
- 触发条件: 单表超过1000万行

## 5. 非功能要求实现

### 5.1 性能

**目标**:
- 用户创建: P95 < 200ms
- 用户查询: P95 < 100ms
- 并发支持: 1000 QPS

**实现策略**:
- 数据库连接池: 最大100连接
- 查询优化: 所有查询字段建立索引
- 缓存: 热点数据缓存 (Redis)
- 批处理: 批量查询使用IN子句 (batch size 100)

**性能测试场景**:
```
场景1: 正常负载
- 用户: 100并发
- QPS: 500
- 持续时间: 10分钟
- 验收标准: P95 < 200ms, 错误率 < 0.1%

场景2: 峰值负载
- 用户: 500并发
- QPS: 2000
- 持续时间: 5分钟
- 验收标准: P95 < 500ms, 错误率 < 1%
```

### 5.2 安全

**输入校验**:
- 所有输入进行白名单验证
- 用户名: 字母数字下划线, 3-50字符
- 邮箱: 正则验证 + DNS check (可选)
- 密码: 最少8字符, 包含大小写字母+数字

**认证/鉴权**:
- 认证: JWT token (1小时过期)
- 鉴权: RBAC (Role-Based Access Control)
- API权限: 仅admin可删除用户, 用户可修改自己信息

**审计点**:
- 用户创建: 记录创建者IP, user-agent
- 用户删除: 记录删除者, 删除原因
- 密码修改: 记录修改时间, IP

**密码存储**:
- 算法: bcrypt (cost factor 10)
- Salt: 自动生成 (bcrypt内置)
- 绝不存储明文密码

### 5.3 可用性

**降级策略**:
- 缓存降级: Redis不可用时直接查询数据库
- 查询降级: 复杂查询超时时返回基本信息
- 写入降级: 数据库不可用时写入消息队列,稍后重试

**熔断策略**:
- 依赖服务: 邮件服务
- 熔断阈值: 连续10次失败
- 熔断时长: 30秒
- 降级行为: 跳过邮件发送,记录到消息队列

**重试策略**:
- 可重试错误: 503 Service Unavailable, 超时
- 重试次数: 最多3次
- 退避策略: 指数退避 (1s, 2s, 4s)

## 6. 测试与验证

### 6.1 单元测试

**测试范围**:
- Service层业务逻辑: 100%覆盖率
- Repository层数据访问: 80%覆盖率
- Controller层: 主要路径覆盖

**示例测试用例** (UserService.CreateUser):

```go
func TestCreateUser_Success(t *testing.T) {
    // Arrange
    mockRepo := NewMockUserRepository()
    service := NewUserService(mockRepo, validator, hasher)
    
    req := &CreateUserRequest{
        Username: "testuser",
        Email: "test@example.com",
        Password: "SecurePass123",
    }
    
    mockRepo.On("FindByUsername", "testuser").Return(nil, nil)
    mockRepo.On("Create", mock.Anything).Return(nil)
    
    // Act
    user, err := service.CreateUser(context.Background(), req)
    
    // Assert
    assert.NoError(t, err)
    assert.Equal(t, "testuser", user.Username)
    assert.Equal(t, "test@example.com", user.Email)
    mockRepo.AssertExpectations(t)
}

func TestCreateUser_DuplicateUsername(t *testing.T) {
    // Arrange
    mockRepo := NewMockUserRepository()
    service := NewUserService(mockRepo, validator, hasher)
    
    req := &CreateUserRequest{Username: "existing", Email: "new@example.com", Password: "pass"}
    existingUser := &User{ID: "123", Username: "existing"}
    
    mockRepo.On("FindByUsername", "existing").Return(existingUser, nil)
    
    // Act
    _, err := service.CreateUser(context.Background(), req)
    
    // Assert
    assert.Error(t, err)
    assert.Equal(t, ErrUsernameExists, err)
}
```

**边界条件测试**:
- 最小/最大长度输入
- 空值/null处理
- 并发冲突
- 数据库错误

### 6.2 集成测试

**测试范围**: API端到端流程

**示例测试用例**:
```
测试用例: 创建用户完整流程
1. 准备: 清空测试数据库
2. 请求: POST /api/users (有效数据)
3. 验证:
   - 响应状态: 201 Created
   - 数据库: 用户记录已创建
   - 缓存: Redis中有用户缓存
   - 事件: user.created事件已发布
4. 清理: 删除测试数据
```

### 6.3 性能/负载测试

见5.1节"性能测试场景"

### 6.4 验收标准

| 类型 | 标准 |
|------|------|
| 功能 | 所有API按规范工作, 边界条件正确处理 |
| 性能 | P95响应时间满足SLA |
| 安全 | 通过安全扫描 (OWASP Top 10) |
| 稳定性 | 7x24小时压测无内存泄漏 |

## 7. 部署与运维注意事项

### 7.1 配置项

**环境变量**:
```bash
# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_MAX_CONNECTIONS=100
DATABASE_IDLE_TIMEOUT=5m

# Redis
REDIS_URL=redis://host:6379/0
REDIS_MAX_CONNECTIONS=50

# JWT
JWT_SECRET=<secret-key>
JWT_EXPIRATION=1h

# 日志
LOG_LEVEL=info
LOG_FORMAT=json

# 限流
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

**配置验证**:
- 启动时检查所有必需环境变量
- 数据库连接预热
- Redis连接测试

### 7.2 运行时依赖

- PostgreSQL 15+
- Redis 7.x
- 消息队列 (RabbitMQ/Kafka) - 用于异步任务

### 7.3 日志/Tracing

**日志关键点**:
```
INFO  | user.service | CreateUser | user_id=123 username=test | User created successfully
ERROR | user.repository | Create | error="duplicate key" | Failed to create user
WARN  | user.service | ValidateCredentials | username=test | Invalid password attempt
```

**日志格式** (JSON):
```json
{
  "timestamp": "2026-02-06T11:00:00Z",
  "level": "INFO",
  "service": "user-service",
  "method": "CreateUser",
  "user_id": "123",
  "message": "User created successfully",
  "request_id": "uuid",
  "duration_ms": 45
}
```

**Tracing**:
- 使用OpenTelemetry
- Trace ID传播: 通过X-Request-ID header
- 关键Span: API调用, 数据库查询, 缓存操作

### 7.4 常见故障自检

| 故障现象 | 可能原因 | 自检步骤 |
|---------|---------|---------|
| 503错误 | 数据库连接耗尽 | 检查连接池使用率, 慢查询日志 |
| 响应慢 | 缓存未命中, 慢查询 | 检查Redis状态, 查询执行计划 |
| 用户无法登录 | JWT secret错误 | 验证环境变量, 重启服务 |

## 8. 开发注意与最佳实践

### 8.1 可重用组件

- Validator: 输入验证工具
- PasswordHasher: 密码哈希工具
- ErrorHandler: 统一错误处理

### 8.2 代码风格

- 遵循项目代码规范 (gofmt/black/prettier)
- 所有exported函数有文档注释
- 错误信息清晰, 包含上下文

### 8.3 接口版本控制

- API路径包含版本: `/v1/users`
- 向后兼容: 新字段optional, 旧字段保留
- 废弃通知: 响应头 `Sunset: <date>`

### 8.4 依赖注入

使用依赖注入提高可测试性:
```go
// 好的设计
type UserService struct {
    repo UserRepository      // interface
    validator Validator      // interface
    hasher PasswordHasher    // interface
}

// 避免
type UserService struct {
    repo *PostgresUserRepository  // concrete type
}
```

## 9. 附录

### 9.1 参考资料
- 系统功能设计: `.hyper-designer/systemFunctionalDesign/系统功能设计.md`
- 系统需求分解: `.hyper-designer/systemRequirementDecomposition/系统需求分解.md`
- API文档: [Swagger/OpenAPI链接]

### 9.2 设计模式应用

| 模式 | 应用场景 | 好处 |
|------|---------|------|
| Repository | 数据访问抽象 | 解耦业务逻辑与数据库, 易于测试 |
| Dependency Injection | 组件依赖管理 | 提高可测试性, 降低耦合 |
| Strategy | 多种密码验证方式 | 易于扩展新的验证方式 |

### 9.3 变更历史
| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|---------|
| 1.0 | 2026-02-06 | [作者] | 初始版本 |
```

## Discovery Questions

Use these questions to clarify module design:

### Responsibility Confirmation
- "What is the boundary of this module? Which behaviors belong to it?"
- "Which modules does this module depend on? Why?"
- "Are there overlapping responsibilities with other modules?"

### Interface Details
- "How should interface errors be expressed? Support idempotency?"
- "What are the SLA requirements? (response time, throughput)"
- "Do we need versioning for this API?"

### Substitutability
- "Do we need to support multiple implementations (e.g., different databases)?"
- "Will this module run in different environments (cloud/on-prem)?"

### Performance and Scale
- "What's the expected query volume? Peak vs average?"
- "Which operations are performance-critical?"

## Using Prior Documents

**MANDATORY workflow**:

1. Read `.hyper-designer/systemFunctionalDesign/系统功能设计.md` for module description and interface contracts
2. Use module relationship and data flow diagrams from system requirement decomposition to validate dependencies and data ownership
3. Use FMEA/activity decomposition risks as basis for testing and fault tolerance strategies

**Example**:
```
从系统功能设计文档读取:
- M001 (用户管理) 负责用户CRUD和认证
- M001对外接口: /api/users/* (REST API)
- M001依赖: 无外部模块依赖
- M001被依赖: M002订单管理需要M001的认证功能

从FMEA读取:
- M001风险: 密码泄露 (严重度: 高)
- 缓解措施: bcrypt哈希 + 安全审计

映射到模块设计:
- 实现bcrypt密码哈希 (PasswordHasher组件)
- 实现审计日志 (记录敏感操作)
- 接口需要JWT认证保护
```

## Visualization Guidelines

**Recommended diagrams**:

### Class Diagram
Show classes, interfaces, and relationships:
```mermaid
classDiagram
    class UserService {
        <<interface>>
        +CreateUser(req) User
        +GetUser(id) User
    }
    
    class UserServiceImpl {
        -repo UserRepository
        +CreateUser(req) User
        +GetUser(id) User
    }
    
    class UserRepository {
        <<interface>>
        +Create(user) error
        +FindByID(id) User
    }
    
    UserService <|.. UserServiceImpl
    UserServiceImpl --> UserRepository
```

### Sequence Diagram
Show interaction flow:
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Repository
    participant DB
    
    Client->>API: POST /api/users
    API->>Service: CreateUser(req)
    Service->>Repository: FindByUsername(username)
    Repository->>DB: SELECT ...
    DB-->>Repository: NULL
    Repository-->>Service: NULL
    Service->>Repository: Create(user)
    Repository->>DB: INSERT ...
    DB-->>Repository: Success
    Repository-->>Service: Success
    Service-->>API: User
    API-->>Client: 201 Created
```

### State Machine Diagram
Show entity lifecycle:
```mermaid
stateDiagram-v2
    [*] --> Active: 创建用户
    Active --> Inactive: 停用
    Inactive --> Active: 激活
    Active --> Suspended: 违规
    Suspended --> Active: 解封
    Active --> [*]: 删除
    Inactive --> [*]: 删除
```

## Interaction Techniques

### Dialogue Pattern

**Phase 1: Clarify boundaries**
```
我将基于系统功能设计创建模块详细设计草稿。
首先确认模块边界和主要职责:

该模块的核心职责是什么?
哪些功能属于该模块? 哪些不属于?
该模块依赖哪些其他模块? 被哪些模块依赖?
```

**Phase 2: Interface specification**
```
接口需要包含错误码与SLA。
请确认:
- 默认使用HTTP语义 (400/401/403/500) 还是自定义错误协议?
- SLA要求是什么? (P95响应时间, 吞吐量)
- 是否需要接口版本控制? (/v1/, /v2/)
```

**Phase 3: Implementation details**
```
对于关键算法 (如订单拆单逻辑):
- 是否可以共享样例数据以便编写性能测试?
- 是否有边界条件需要特别处理? (并发, 空值, 异常)
- 时间复杂度有要求吗?
```

**Phase 4: Testing strategy**
```
我们将提供单元测试和集成测试用例。
请确认:
- 哪些场景是最关键的? (需要优先覆盖)
- 是否有特定的测试环境或数据要求?
```

### Handling Tricky Situations

**Situation: Module needs multiple backend implementations**

Strategy:
- Define abstract interface: `UserRepository interface`
- Implement factory/strategy pattern: `NewUserRepository(type string) UserRepository`
- Write compatibility layer: Adapter pattern for different backends
- Document trade-offs: "PostgreSQL for ACID, MongoDB for flexible schema"

**Situation: Performance vs correctness conflict**

Strategy:
- Provide optimized path for critical operations: "Fast path uses cache (eventual consistency), slow path uses DB (strong consistency)"
- Keep consistency verification: "Background job validates cache vs DB"
- Document trade-off: "User info API uses cached data (5min stale), admin audit uses real-time DB query"

**Situation: Circular dependency between modules**

Strategy:
- Introduce event-driven decoupling: Module A publishes event, Module B subscribes
- Use message queue: Asynchronous communication
- Refactor responsibilities: Extract shared logic to new module
- Document decision: "OrderService publishes order.created event instead of calling UserService directly to avoid circular dependency"
