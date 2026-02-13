# 5W2H Framework for SR Description

## Framework Overview

5W2H is a systematic method to ensure comprehensive requirement description by answering 7 key questions.

## The 7 Elements

### 1. WHO (谁)
**Question**: Which system or subsystem implements this SR?

**Guidelines**:
- Use internal identifiable names (no need for external visibility)
- Can be system, subsystem, module, or component name
- Should map to organizational structure when possible

**Examples**:
- ✅ "用户认证子系统"
- ✅ "订单处理模块"
- ✅ "支付网关适配器"
- ❌ "系统" (too vague)
- ❌ "前端" (too broad)

**Template**:
```
Who: [子系统/模块名称] - [可选：所属团队]
```

---

### 2. WHEN (何时)
**Question**: At what stage in the system lifecycle does this function operate?

**Guidelines**:
- Can inherit from parent IR's "when"
- Consider system lifecycle: startup, runtime, shutdown
- Consider business lifecycle: registration, checkout, reporting

**Examples**:
- ✅ "系统启动时加载配置"
- ✅ "用户登录后会话维持期间"
- ✅ "每日凌晨2点批处理时段"
- ✅ "订单创建后立即执行"

**Template**:
```
When: [系统生命周期阶段] + [业务触发条件]
```

**Inheritance Pattern**:
```
IR-001 When: 用户购物车结账时
  └─ SR-001 When: 继承IR-001 - 用户购物车结账时
      └─ SR-002 When: 继承IR-001 - 结账流程中的支付环节
```

---

### 3. WHAT (什么)
**Question**: What is the functional content of this SR?

**Guidelines**:
- Distinguish between **new features** vs **modifications**
- Specify **deliverable changes** (code, config, data schema)
- For **test-only changes**, explain root cause of test variation

**Structure**:
```markdown
What:
  - 功能描述: [新增功能 / 变更点描述]
  - 发布件变化: [代码模块/配置文件/数据库schema等]
  - 测试变化: [如果仅测试工作] 说明导致测试变化的原因
```

**Example - New Feature**:
```
What:
  - 功能描述: 新增OAuth2.0第三方登录支持(Google, GitHub)
  - 发布件变化: 
    - 新增 auth-adapter 模块
    - 修改 user-service API endpoint
    - 数据库新增 oauth_tokens 表
  - 测试变化: 新增集成测试覆盖OAuth流程
```

**Example - Modification**:
```
What:
  - 功能描述: 订单查询接口增加分页和排序功能
  - 发布件变化:
    - 修改 /api/orders GET endpoint
    - 更新前端订单列表组件
  - 测试变化: 扩展现有API测试用例，增加边界测试
```

**Example - Test-Only Change**:
```
What:
  - 功能描述: 无功能变更
  - 发布件变化: 无
  - 测试变化: 
    - 原因: 依赖的支付网关API升级导致mock数据格式变化
    - 变化: 更新支付模块的集成测试mock响应
```

---

### 4. WHERE (哪里)
**Question**: What is the operational context for this function?

**Guidelines**:
- Specify **runtime environment** (browser, server, mobile)
- Identify **dependent components**
- Define **deployment location**

**Structure**:
```markdown
Where:
  - 运行环境: [浏览器/服务器/移动端/边缘节点]
  - 依赖组件: [必需的外部服务/库/模块]
  - 部署位置: [服务器集群/CDN/客户端]
```

**Example**:
```
Where:
  - 运行环境: Node.js 18+ 服务器端
  - 依赖组件: 
    - Redis (会话存储)
    - PostgreSQL (用户数据)
    - OAuth Provider APIs (Google/GitHub)
  - 部署位置: Kubernetes集群，auth-service namespace
```

---

### 5. WHY (为何)
**Question**: What is the source requirement that drives this SR?

**Guidelines**:
- Always reference parent IR (Initial Requirement)
- Include business justification if not obvious from IR
- Link to any related requirements (use cases, user stories)

**Template**:
```
Why: 
  - 来源: 基于 [IR-XXX] [IR简要描述]
  - 业务价值: [可选：额外的业务说明]
```

**Example**:
```
Why:
  - 来源: 基于 IR-005 "支持第三方账号登录需求"
  - 业务价值: 降低用户注册门槛，提升转化率15%（产品目标）
```

---

### 6. HOW MUCH (多少)
**Question**: What is the scale and estimation for this SR?

**Guidelines**:
- **Multiple SRs from one IR**: Decompose parent IR's estimate
- **Single SR from IR**: Directly inherit IR's estimate
- Include: effort, timeline, team size, scope metrics

**Decomposition Rules**:
```
IF IR → 1 SR:
  SR.how_much = IR.how_much
  
IF IR → multiple SRs:
  SR₁.how_much + SR₂.how_much + ... = IR.how_much
  (Distribute estimate across SRs)
```

**Structure**:
```markdown
How Much:
  - 工作量: [人日/人周/故事点]
  - 时间线: [迭代/冲刺数]
  - 团队规模: [人数]
  - 范围指标: [功能点数/代码行数估算/测试用例数]
```

**Example - Single SR**:
```
How Much: (继承 IR-003)
  - 工作量: 10人日
  - 时间线: 1个冲刺(2周)
  - 团队规模: 2名开发 + 1名测试
  - 范围指标: 3个API端点，8个测试用例
```

**Example - Decomposed**:
```
IR-005: 第三方登录功能
  How Much: 30人日，3个冲刺

  SR-005-A: OAuth集成层
    How Much: 15人日，2个冲刺
    
  SR-005-B: 前端登录UI
    How Much: 8人日，1个冲刺
    
  SR-005-C: 用户账号合并逻辑
    How Much: 7人日，1个冲刺
    
  Total: 30人日 ✅ (matches IR-005)
```

---

### 7. HOW (如何)
**Question**: How does this function work within the current system?

**Guidelines**:
- Describe **usage pattern** from user or system perspective
- Explain **value delivery mechanism**
- Include **integration points** with existing system

**Structure**:
```markdown
How:
  - 使用方式: [用户/系统如何触发和使用该功能]
  - 工作流程: [关键步骤简述]
  - 集成点: [与现有系统的连接方式]
  - 价值体现: [如何发挥作用/解决问题]
```

**Example**:
```
How:
  - 使用方式: 
    - 用户在登录页面点击"使用Google登录"按钮
    - 系统跳转到Google OAuth授权页
    - 授权成功后回调至系统，自动创建或关联用户账号
  - 工作流程:
    1. 前端触发OAuth流程
    2. auth-service生成授权请求
    3. 用户在Google完成授权
    4. 系统接收authorization code
    5. 交换access token并获取用户信息
    6. 创建会话，返回JWT token
  - 集成点:
    - 复用现有的会话管理中间件
    - 调用user-service的账号创建/关联接口
    - 使用统一的JWT token机制
  - 价值体现:
    - 用户无需记忆额外密码，降低注册摩擦
    - 系统获得可信第三方验证的用户身份
```

---

## Complete SR Example Using 5W2H

```markdown
## SR-001: 第三方OAuth登录集成

### SR描述 (5W2H)

**Who**: 用户认证子系统 (Auth Team负责)

**When**: 
- 用户访问登录页面时可选择第三方登录
- 系统启动时加载OAuth配置
- 用户会话维持期间保持token有效性

**What**:
- 功能描述: 新增OAuth2.0第三方登录支持(Google, GitHub)
- 发布件变化:
  - 新增 auth-adapter 微服务
  - 修改 frontend/login 组件
  - user-service 新增 linkOAuthAccount 接口
  - 数据库新增 oauth_tokens 表
- 测试变化: 
  - 新增OAuth流程端到端测试
  - 新增账号合并场景测试

**Where**:
- 运行环境: 
  - 后端: Node.js 18+ (auth-adapter服务)
  - 前端: React 18 (浏览器端)
- 依赖组件:
  - Google OAuth 2.0 API
  - GitHub OAuth Apps API
  - Redis (临时state存储)
  - PostgreSQL (token持久化)
- 部署位置: 
  - auth-adapter: Kubernetes auth namespace
  - 前端: CDN静态资源

**Why**:
- 来源: 基于 IR-005 "降低用户注册门槛，支持主流第三方账号登录"
- 业务价值: 预期提升注册转化率15%，减少密码找回工单30%

**How Much**:
- 工作量: 15人日
- 时间线: 2个冲刺(4周)
- 团队规模: 2名后端 + 1名前端 + 1名测试
- 范围指标: 
  - 4个新API端点
  - 2个OAuth provider集成
  - 12个测试用例
  - 1个数据库migration

**How**:
- 使用方式:
  1. 用户在登录页点击"使用Google登录"
  2. 系统跳转到Google授权页面
  3. 用户授权后，系统自动完成账号创建或关联
  4. 返回应用，用户已登录状态
- 工作流程:
  1. Frontend发起OAuth请求 → auth-adapter
  2. auth-adapter生成state并重定向到OAuth provider
  3. 用户在provider完成授权
  4. Provider回调至auth-adapter/callback
  5. auth-adapter验证state，交换code为token
  6. 调用provider API获取用户信息
  7. 查询或创建本地用户账号
  8. 生成JWT session token返回frontend
- 集成点:
  - 复用现有SessionMiddleware验证JWT
  - 调用user-service的createUser/linkAccount接口
  - 使用统一的Redis会话存储
- 价值体现:
  - 用户获得一键登录体验
  - 系统获得可信第三方验证的身份信息
  - 减少密码管理和安全风险
```

---

## 5W2H Quick Checklist

Before finalizing an SR, verify:

- [ ] **WHO**: 明确指定了负责的子系统/模块
- [ ] **WHEN**: 说明了功能的生命周期和触发时机
- [ ] **WHAT**: 详细描述了功能内容、发布件变化、测试变化
- [ ] **WHERE**: 指定了运行环境、依赖组件、部署位置
- [ ] **WHY**: 引用了来源IR并说明业务价值
- [ ] **HOW MUCH**: 提供了工作量、时间线、范围估算
  - [ ] 如果是IR分解出的多个SR，确保总估算匹配IR
  - [ ] 如果是单个SR，确认继承了IR的估算
- [ ] **HOW**: 描述了使用方式、工作流程、集成点、价值体现

---

## Common Mistakes and Fixes

### Mistake 1: Vague "Who"
❌ Bad:
```
Who: 系统
```

✅ Good:
```
Who: 用户认证子系统 (Auth Team)
```

### Mistake 2: Missing "When" Context
❌ Bad:
```
When: 运行时
```

✅ Good:
```
When: 用户首次访问应用时 + 会话过期后重新认证时
```

### Mistake 3: Incomplete "What"
❌ Bad:
```
What: 添加登录功能
```

✅ Good:
```
What:
  - 功能描述: 新增OAuth2.0第三方登录(Google, GitHub)
  - 发布件变化: auth-adapter模块, oauth_tokens表, login组件
  - 测试变化: 新增OAuth流程集成测试
```

### Mistake 4: Vague "Where"
❌ Bad:
```
Where: 服务器
```

✅ Good:
```
Where:
  - 运行环境: Node.js 18+ 
  - 依赖: Redis, PostgreSQL, Google OAuth API
  - 部署: K8s auth namespace
```

### Mistake 5: No "Why" Traceability
❌ Bad:
```
Why: 产品需求
```

✅ Good:
```
Why: 基于 IR-005 "支持第三方登录需求"
     业务价值: 提升转化率15%
```

### Mistake 6: "How Much" Not Decomposed
❌ Bad (when IR → 3 SRs):
```
IR-010: 30人日
  SR-010-A: 30人日  ❌ (each SR claims full estimate)
  SR-010-B: 30人日  ❌
  SR-010-C: 30人日  ❌
```

✅ Good:
```
IR-010: 30人日
  SR-010-A: 12人日  ✅
  SR-010-B: 10人日  ✅
  SR-010-C: 8人日   ✅
  Total: 30人日 ✅
```

### Mistake 7: "How" Lacks Integration Details
❌ Bad:
```
How: 用户点击按钮登录
```

✅ Good:
```
How:
  - 使用方式: 用户点击"使用Google登录"按钮
  - 工作流程: [详细步骤]
  - 集成点: 复用SessionMiddleware, 调用user-service API
  - 价值体现: 降低注册摩擦，提升转化率
```
