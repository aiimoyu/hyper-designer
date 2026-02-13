---
name: sr-ar-decomposition
description: SR-AR Decomposition skill for breaking down System Requirements (SR) into Allocated Requirements (AR) using DDD principles. Use when decomposing functional requirements into module-level SRs and implementation-level ARs, mapping to system components, performing requirements allocation for development teams, or when workflow state is functionalRefinement and next step needs system-level requirement analysis.
---

# SR-AR Decomposition (系统需求与分配需求分解)

## Overview

Transform a functional requirements list into:
1. **System Requirements (SR)**: High-level functional modules derived from customer requirements
2. **Allocated Requirements (AR)**: Implementation-level requirements allocated to specific components/teams

## Quick Start

**Before starting, load reference documents based on your needs:**

1. **First-time users**: Read all references for complete understanding
2. **Experienced users**: Load specific references as needed during work

**Typical workflow**:
```
1. Read functional requirements → Understand context
2. Load DDD Patterns reference → Identify bounded contexts and modules
3. Create SRs using 5W2H Framework reference → Write comprehensive SR descriptions
4. Decompose SRs into ARs → Map to components and teams
5. Estimate AR workloads using AR Estimation reference → Ensure each AR ≤ 0.5K
6. Use Template reference → Generate final output document
```

## Core Concepts

### System Requirement (SR)
**Definition**: System-level functional requirements created by system engineers (SE) by decomposing initial requirements (IR) based on overall system architecture understanding.

**Characteristics**:
- Describes major functional modules needed by the system
- Includes page modifications, functional logic, data models, usage scope, and preconditions
- One IR may decompose into multiple SRs
- Uses 5W2H framework for comprehensive description

### Allocated Requirement (AR)
**Definition**: Further decomposition and refinement of SRs by requirement managers and system engineers, considering system characteristics and customer needs.

**Characteristics**:
- Scenario-specific, detailed implementation requirements
- References existing system capabilities or specifies new implementations
- Describes frontend extensions, backend API modifications, success/failure handling
- Each AR workload ≤ 0.5K effort units
- Uses conceptual design-level descriptions

## Input Requirements

**Required artifacts** (read these first):
1. Functional requirements list: `XX功能列表.md`
2. Project codebase context files
3. Component/module organization document

**Context to gather**:
- Existing system architecture and components
- Current API endpoints and data models
- Team/component boundaries and ownership

## Output Structure

### Standard SR-AR Decomposition Table

```markdown
# SR-AR分解分配表

## Metadata
- Project: [项目名称]
- Version: [版本号]
- Date: [创建日期]
- Input: [功能列表文件路径]

---

## SR-001: [SR名称]

### SR描述 (5W2H)
- **Who**: [系统或子系统名称] - 内部可理解即可，无需外部可见
- **When**: [功能生命周期阶段] - 可继承IR的when
- **What**: [功能内容]
  - 新增功能描述 / 功能变更点描述
  - 发布件变化说明
  - 仅测试工作的变化（需分析测试变化原因）
- **Where**: [功能运行上下文] - 运行环境、依赖组件、部署位置
- **Why**: [需求来源] - 继承自哪个IR
- **How Much**: [规模估算]
  - 若为多个SR需分解
  - 若仅一个SR直接继承IR的how much
- **How**: [使用方式] - 在当前系统中如何使用该功能、如何发挥作用

### 关联组件
- [组件A]: [职责说明]
- [组件B]: [职责说明]

### 分配的AR列表

#### AR-001-01: [AR名称]
**AR描述**:
- **场景**: [具体使用场景]
- **实现方式**:
  - 选项1：复用现有功能
    - 位置: [模块/文件/函数位置]
    - 修改点: [后端接口扩充/前端功能扩展的具体内容]
  - 选项2：新增功能
    - 调用接口: [API endpoint]
    - 成功处理: [成功时的行为]
    - 失败处理: [失败时的行为]
- **数据模型**: [涉及的数据结构变更]
- **工作量估算**: [≤0.5K]
- **分配团队**: [负责组件团队]

#### AR-001-02: [AR名称]
[同上结构...]

---

## SR-002: [SR名称]
[重复SR-001结构...]
```

## Reference Documents

This skill includes detailed reference guides. Load them as needed:

- **[5W2H Framework](references/5w2h-framework.md)**: Complete guide for writing SR descriptions using 5W2H structure. Load when writing SR descriptions or validating existing SRs.
- **[DDD Patterns](references/ddd-patterns.md)**: Domain-Driven Design patterns for bounded context identification and module organization. Load when decomposing functions into SRs or organizing modules.
- **[AR Estimation](references/ar-estimation.md)**: Workload estimation techniques and AR splitting strategies. Load when estimating AR workloads or splitting ARs that exceed 0.5K.
- **[Example](references/example.md)**: Complete worked example of SR-AR decomposition for an e-commerce authentication feature. Load when you need a reference example to understand the complete workflow.
- **[Template](templates/sr-ar-template.md)**: Standard SR-AR decomposition table template. Load when starting a new decomposition document.

**When to load references**:
- First time using this skill → Read Example for complete understanding, then other references as needed
- Writing SR descriptions → Load 5W2H Framework
- Identifying modules → Load DDD Patterns
- Estimating ARs → Load AR Estimation
- Creating output document → Load Template

## Workflow

### Phase 1: Analyze Inputs

**Step 1: Read functional requirements**
```bash
# Read the functional requirements list
Read: [功能列表文件路径]
```

**Step 2: Understand system context**
- Read component organization document
- Identify existing modules, APIs, and data models
- Map component ownership to teams

**Step 3: Analyze codebase structure**
```typescript
// Use explore agent for codebase pattern discovery
delegate_task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  prompt="Find existing component boundaries, module organization, and API patterns in the codebase"
)
```

### Phase 2: Decompose into SRs (DDD-based Module Identification)

**Step 1: Identify bounded contexts**
Apply Domain-Driven Design principles:
- Group related functions into logical modules
- Maintain high cohesion, low coupling
- Identify core domain entities (Aggregate Roots)

**Step 2: Create SRs**
For each identified module:
1. Define SR using 5W2H framework
2. Map to functional requirements
3. Identify affected components
4. Estimate scope (how much)

**Key questions to ask**:
- What data does this function access?
- Which existing components handle similar logic?
- What are the functional boundaries?
- Are there cross-cutting concerns (auth, logging, etc.)?

### Phase 3: Decompose SRs into ARs

**Step 1: Scenario analysis**
For each SR, identify all usage scenarios:
- User interactions
- System integrations
- Edge cases and error conditions

**Step 2: Create ARs**
For each scenario:
1. **Determine implementation approach**:
   - Reuse existing function (specify location and modification)
   - Create new function (specify interfaces and behavior)
2. **Define success/failure handling**
3. **Estimate workload** (must be ≤ 0.5K)
4. **Assign to component team**

**AR description checklist**:
- [ ] Specific scenario described
- [ ] Implementation approach chosen (reuse vs new)
- [ ] Success/failure handling defined
- [ ] Data model changes specified
- [ ] Workload ≤ 0.5K
- [ ] Team assignment clear

### Phase 4: Validate and Refine

**Validation checklist**:
- [ ] All functional requirements mapped to SRs
- [ ] Each SR follows 5W2H structure
- [ ] SRs maintain high cohesion within modules
- [ ] Low coupling between SRs
- [ ] All SRs decomposed into ARs
- [ ] Each AR workload ≤ 0.5K
- [ ] ARs reference specific code locations or APIs
- [ ] Component team assignments are clear
- [ ] No AR description exceeds conceptual design level

**Common validation issues**:
| Issue | Detection | Fix |
|-------|-----------|-----|
| AR too large | Workload > 0.5K | Split into multiple ARs by scenario |
| AR too vague | Missing code location or API | Add specific module/file/function references |
| SR spans multiple domains | Low cohesion indicators | Split into separate SRs by bounded context |
| Duplicate functionality | Multiple ARs doing same thing | Consolidate or reference existing implementation |

## DDD Principles for Module Identification

### Bounded Context Discovery
Ask these questions for each functional requirement:

1. **Entity ownership**: What core data entities does this function own?
2. **Business capability**: What single business capability does this provide?
3. **Change frequency**: Do these functions change together?
4. **Team structure**: Can a single team own this module?

### Module Responsibility Definition
For each identified module:

```markdown
## Module: [模块名称]

**Core Responsibility**: [一句话描述核心职责]

**Aggregate Roots**: [核心领域实体列表]
- Entity1: [说明]
- Entity2: [说明]

**Bounded Context**: [边界说明]

**Dependencies**: [依赖的其他模块]
```

### System-Wide Requirements
Identify cross-cutting concerns separately:
- Authentication/Authorization (OAuth2, JWT, etc.)
- Logging and monitoring standards
- Error handling patterns
- API versioning strategy
- Data consistency requirements

## Example Output

```markdown
# SR-AR分解分配表

## SR-001: 用户认证模块

### SR描述 (5W2H)
- **Who**: 用户认证子系统
- **When**: 系统启动和用户访问时
- **What**: 
  - 新增OAuth2.0认证功能
  - 支持JWT token生成和验证
  - 发布件: 新增auth-service组件
- **Where**: API网关层，所有受保护端点的前置检查
- **Why**: 基于IR-005用户安全需求
- **How Much**: 预估3个冲刺(6周)，8人力
- **How**: 通过API Gateway统一拦截请求，验证token有效性后放行

### 关联组件
- auth-service: 认证逻辑实现
- api-gateway: token验证拦截
- user-db: 用户凭证存储

### 分配的AR列表

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
- **工作量估算**: 0.3K
- **分配团队**: Auth组件团队

#### AR-001-02: Token验证中间件
**AR描述**:
- **场景**: 所有受保护API调用前验证token
- **实现方式**: 复用现有功能
  - 位置: api-gateway/middleware/auth.ts
  - 修改点: 
    - 后端接口扩充: 增加JWT验证逻辑
    - 前端功能扩展: 在所有HTTP请求头添加Authorization字段
- **数据模型**: 无变更
- **工作量估算**: 0.2K
- **分配团队**: Gateway团队
```

## Common Pitfalls

| Pitfall | How to Avoid |
|---------|--------------|
| SR too granular | Ensure SR represents a complete functional module, not individual features |
| AR too abstract | Always reference specific code locations or API endpoints |
| Missing 5W2H in SR | Use checklist to verify all 5W2H elements present |
| AR workload > 0.5K | Split into multiple ARs by scenario or implementation phase |
| Unclear team assignment | Always specify which component team owns each AR |
| Duplicate AR creation | Check existing system capabilities before defining new ARs |

## Success Criteria

- [ ] All functional requirements decomposed into SRs
- [ ] Each SR uses complete 5W2H description
- [ ] SRs aligned with DDD bounded contexts
- [ ] All SRs decomposed into ARs
- [ ] Each AR ≤ 0.5K workload
- [ ] ARs reference specific implementation locations
- [ ] Clear team assignments for all ARs
- [ ] Output saved to `.hyper-designer/sr-ar-decomposition/[项目名]-SR-AR分解表.md`
