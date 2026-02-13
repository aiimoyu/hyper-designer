# SR-AR Decomposition Example: E-commerce User Authentication

This example demonstrates how to use the SR-AR decomposition skill to break down a user authentication feature.

## Input: Functional Requirement

**FR-005: 第三方账号登录**
- 用户可以使用Google或GitHub账号登录系统
- 首次登录自动创建账号
- 已有账号可关联第三方登录方式
- 预期提升注册转化率15%

## Step 1: Identify Bounded Context (DDD)

Using DDD principles:
- **Bounded Context**: User Authentication
- **Aggregate Roots**: User, Session, OAuthToken
- **Core Responsibility**: 管理用户身份验证和会话

## Step 2: Create SR (Using 5W2H)

### SR-001: 第三方OAuth登录集成

#### Who (谁)
**系统/子系统**: 用户认证子系统 (Auth Team)

#### When (何时)
- 用户访问登录页面时
- 系统启动时加载OAuth配置
- 用户会话期间维持token有效性

#### What (什么)
**功能描述**:
- 新增OAuth2.0第三方登录支持(Google, GitHub)

**发布件变化**:
- 新增 auth-adapter 微服务
- 修改 frontend/login 组件
- user-service 新增 linkOAuthAccount 接口
- 数据库新增 oauth_tokens 表

**测试变化**:
- 新增OAuth流程端到端测试
- 新增账号关联场景测试

#### Where (哪里)
**运行环境**: Node.js 18+ (后端), React 18 (前端)
**依赖组件**: Google OAuth API, GitHub OAuth API, Redis, PostgreSQL
**部署位置**: Kubernetes auth namespace

#### Why (为何)
**需求来源**: 基于 FR-005 "支持第三方账号登录"
**业务价值**: 提升注册转化率15%，减少密码找回工单30%

#### How Much (多少)
**工作量估算**: 1.5K
**时间线**: 3个冲刺(6周)
**团队规模**: 2名后端 + 1名前端 + 1名测试

#### How (如何)
**使用方式**:
1. 用户点击"使用Google登录"
2. 跳转到Google授权页
3. 授权后自动创建或关联账号
4. 返回应用，已登录状态

**集成点**:
- 复用现有SessionMiddleware
- 调用user-service API
- 使用统一JWT token机制

## Step 3: Decompose SR into ARs

### AR-001-01: OAuth Provider适配器实现
**场景**: 系统需要调用Google和GitHub OAuth API

**实现方式**: 新增功能
- 调用接口: Google OAuth 2.0 API, GitHub OAuth API
- 成功处理: 获取access_token和用户基本信息
- 失败处理: 返回标准化错误码，记录日志

**数据模型**:
- 新增 oauth_providers 表 (provider_name, client_id, client_secret)

**工作量估算**: 0.4K
- 任务分解:
  - Google OAuth集成 (5 days)
  - GitHub OAuth集成 (4 days)
  - 统一适配器接口 (3 days)
  - 单元测试 (3 days)
  - 集成测试 (3 days)
  - 文档 (2 days)
  - Buffer 20% (4 days)
  - Total: 24 days = 0.3K (adjusted after review)

**分配团队**: Auth Backend Team

---

### AR-001-02: 用户账号创建/关联逻辑
**场景**: OAuth登录成功后，需要创建新账号或关联已有账号

**实现方式**: 复用现有功能
- 位置: `user-service/src/controllers/userController.ts`
- 修改点:
  - 后端接口扩充: 新增 `POST /v1/users/oauth-link` 接口
  - 前端功能扩展: 在账号设置页面增加"关联第三方账号"按钮

**数据模型**:
- 新增 oauth_tokens 表 (user_id, provider, provider_user_id, access_token, refresh_token, expires_at)
- 修改 users 表增加 oauth_linked_at 字段

**工作量估算**: 0.35K
- 估算方法: 三点估算 (O: 0.25K, M: 0.35K, P: 0.5K)

**分配团队**: User Service Team

---

### AR-001-03: 前端OAuth登录流程
**场景**: 用户在登录页面点击第三方登录按钮

**实现方式**: 新增功能
- 调用接口: `GET /v1/auth/oauth/authorize?provider=google`
- 成功处理: 
  - 重定向到OAuth provider授权页
  - 回调后处理authorization code
  - 存储JWT token到localStorage
  - 跳转到用户首页
- 失败处理:
  - 显示错误提示
  - 记录客户端日志
  - 提供"重试"或"使用密码登录"选项

**工作量估算**: 0.25K

**分配团队**: Frontend Team

---

### AR-001-04: OAuth回调处理端点
**场景**: OAuth provider完成授权后回调系统

**实现方式**: 新增功能
- 调用接口: `GET /v1/auth/oauth/callback`
- 请求参数: { code, state }
- 成功处理:
  - 验证state防CSRF
  - 交换code为access_token
  - 调用provider API获取用户信息
  - 创建或关联用户账号
  - 生成JWT session token
  - 重定向到前端
- 失败处理:
  - 返回错误页面
  - 记录详细错误日志
  - 提供用户友好的错误信息

**数据模型**:
- 临时使用Redis存储state (TTL: 10分钟)

**工作量估算**: 0.3K

**分配团队**: Auth Backend Team

---

### AR-001-05: OAuth Token刷新机制
**场景**: Access token过期时自动刷新

**实现方式**: 新增功能
- 后台定时任务检查即将过期的token
- 使用refresh_token获取新的access_token
- 更新数据库中的token信息

**工作量估算**: 0.2K

**分配团队**: Auth Backend Team

---

## Validation

### Workload Check
- SR-001 total: 0.4K + 0.35K + 0.25K + 0.3K + 0.2K = 1.5K ✅
- Each AR ≤ 0.5K ✅

### 5W2H Check for SR-001
- [x] WHO: 明确 (用户认证子系统)
- [x] WHEN: 明确 (登录时, 启动时, 会话期间)
- [x] WHAT: 详细 (功能、发布件、测试变化)
- [x] WHERE: 明确 (运行环境、依赖、部署)
- [x] WHY: 可追溯 (FR-005)
- [x] HOW MUCH: 估算完整 (1.5K, 6周, 4人)
- [x] HOW: 使用方式清晰

### AR Check
- [x] All ARs have specific scenarios
- [x] All ARs specify implementation approach (reuse vs new)
- [x] All ARs define success/failure handling
- [x] All ARs have team assignments
- [x] All ARs ≤ 0.5K workload

### Module Organization (DDD)
- [x] High cohesion: All ARs related to OAuth authentication
- [x] Low coupling: ARs interact via well-defined interfaces
- [x] Clear bounded context: User Authentication module

## Output Location

Save to: `.hyper-designer/sr-ar-decomposition/E-commerce-用户认证-SR-AR分解表.md`

## Next Steps

1. Review with stakeholders
2. Validate technical feasibility with component teams
3. Adjust workload estimates based on team feedback
4. Proceed to detailed design phase for each AR
