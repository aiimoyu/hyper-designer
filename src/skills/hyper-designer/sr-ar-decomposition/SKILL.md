---
name: sr-ar-decomposition
description: SR-AR Decomposition skill for breaking down System Requirements (SR) into Allocated Requirements (AR) with system element mapping, interface specification, and DFX analysis. Use when decomposing functional requirements into system-level SRs and implementation-level ARs, identifying system elements and their interfaces, capturing non-functional (DFX) requirements, and preparing structured input for systemFunctionalDesign and moduleFunctionalDesign stages.
---

# SR-AR Decomposition (系统需求与分配需求分解)

## Overview

将功能需求列表分解为结构化的系统需求(SR)和分配需求(AR)，同时建立系统元素模型、接口规格和DFX属性，为下游的**系统功能设计**和**模块功能设计**提供完整输入。

本阶段输出必须直接支撑：
1. **systemFunctionalDesign**: 系统设计说明书（系统级规格设计、系统级专项设计、设计约束）
2. **moduleFunctionalDesign**: 模块功能设计说明书（功能实现设计、接口设计、DFX分析、分配需求表）

### 核心产出物

| 产出物 | 说明 | 下游消费者 |
|--------|------|-----------|
| SR-AR分解分配表 | SR的5W2H描述 + AR的场景化分解 | 系统设计、模块设计 |
| 系统元素清单 | 架构元素和功能对象的识别与职责定义 | 系统设计（架构视图） |
| 接口规格清单 | 系统元素间的接口定义(名称/类型/I-O/SLA/约束) | 模块设计（接口设计章节） |
| 系统级规格分解 | 全局性能/容量/可靠性指标到功能的分解 | 系统设计（规格设计章节） |
| DFX需求矩阵 | 每个SR/AR关联的可靠性、安全性、性能需求 | 模块设计（DFX分析章节） |
| 系统设计约束清单 | 技术实现层面的关键假设和限制 | 系统设计（约束章节） |

## Quick Start

**Before starting, load reference documents based on your needs:**

1. **First-time users**: Read all references for complete understanding
2. **Experienced users**: Load specific references as needed during work

**Typical workflow**:
```
1. Read functional requirements → Understand context
2. Load DDD Patterns reference → Identify bounded contexts, system elements, and modules
3. Create SRs using 5W2H Framework reference → Write comprehensive SR descriptions
4. Identify system elements → Define architecture elements and functional objects
5. Decompose SRs into ARs → Map to system elements with interface specs
6. Capture DFX requirements → Reliability, security, performance per SR/AR
7. Derive system-level specs and constraints → Quantitative metrics decomposition
8. Estimate AR workloads using AR Estimation reference → Ensure each AR ≤ 0.5K
9. Use Template reference → Generate final output document
```

## Core Concepts

### System Requirement (SR) — 系统需求

**定义**: 系统工程师(SE)基于对系统整体架构的理解，对初始需求(IR)进行分解后产生的系统级功能需求。

**特征**:
- 描述系统为完成预期输出需要执行的功能任务
- 使用5W2H框架进行全面描述
- 包含页面变更、功能逻辑、数据模型、使用范围和前置条件
- 一个IR可分解为多个SR
- **必须关联到系统元素**，建立功能与架构的映射
- **必须标注DFX属性**（可靠性、安全性、性能等非功能需求）
- **必须包含规格指标**（可量化的性能/容量/质量目标）

### Allocated Requirement (AR) — 分配需求

**定义**: 在SR基础上，进一步分解和细化到具体系统元素的实现级需求。

**特征**:
- 场景化的、详细的实现需求
- **分配到具体的系统元素**（不仅仅是团队）
- 描述系统元素间的交互行为
- **必须定义接口规格**（接口名称、类型、输入输出、SLA、约束）
- 每个AR工作量 ≤ 0.5K
- 使用概念设计级描述（不涉及具体代码实现细节）
- 包含成功/失败处理、数据模型变更

### System Element (系统元素) — 新增核心概念

**定义**: 系统架构中可独立识别的构成单元，包括架构元素（如服务、模块、中间件）和功能对象（如领域实体、处理器、适配器）。

**层次**:
```
系统 (System)
├── 子系统 (Subsystem)          — 如: 认证子系统、订单子系统
│   ├── 架构元素 (Architecture Element) — 如: auth-service, api-gateway
│   │   ├── 功能对象 (Functional Object)  — 如: TokenGenerator, SessionManager
│   │   └── ...
│   └── ...
└── ...
```

**为什么需要系统元素**:
- systemFunctionalDesign中的"行为描述"需要展示**系统架构对象和功能对象之间的交互**
- moduleFunctionalDesign中的"实现设计"需要将功能展开到**更细粒度的架构元素交互**
- "分配需求表"要求明确每个AR归属的**系统元素**
- "接口设计"从功能视角提出对**系统元素**的接口诉求

### Interface Specification (接口规格) — 新增核心概念

**定义**: 系统元素之间或系统元素与外部系统之间的交互契约。

**接口规格要素**:

| 项目 | 说明 |
|------|------|
| 接口名称 | 唯一标识，如 `IF-001: 用户认证接口` |
| 接口描述 | 接口的功能目的 |
| 接口类型 | REST API / gRPC / Event / Internal Method / Message Queue |
| 所属系统元素 | 提供该接口的系统元素 |
| 消费系统元素 | 调用/消费该接口的系统元素 |
| 输入要求/参数 | 请求格式、参数类型、必选/可选、约束条件 |
| 输出要求/参数 | 响应格式、返回值类型、错误码定义 |
| SLA定义 | 响应时间、吞吐量、可用性要求 |
| 约束和注意事项 | 并发限制、幂等性、版本兼容、安全要求 |

### System Specification (系统规格) — 新增核心概念

**定义**: 系统全局性的可量化设计指标，需要分解到具体的系统功能上。

**规格类型**:
- **性能规格**: 响应时间、吞吐量、并发能力
- **容量规格**: 数据存储量、用户数、连接数
- **可靠性规格**: MTBF、MTTR、故障恢复时间
- **安全规格**: 认证强度、加密等级、审计要求

### DFX Attributes (DFX属性) — 新增核心概念

**定义**: Design for X，涵盖可靠性(Reliability)、安全性(Security)、性能(Performance)、可维护性(Maintainability)等非功能性设计属性。

**SR级DFX**:
- 每个SR应标注其关键DFX关注点
- 识别需要进行FMEA的功能流程
- 识别需要进行安全威胁分析的功能点
- 标注性能敏感的处理路径

**AR级DFX**:
- 每个AR应继承SR的DFX要求并细化
- 明确异常情况处理方案
- 定义重试/降级/熔断策略
- 标注安全需求（认证、授权、数据保护）

### Design Constraint (设计约束) — 新增核心概念

**定义**: 基于当前技术条件的实现层面约束，来自利益相关人的、在版本生命周期内需遵循的限制。

**约束类型**:
- **技术约束**: 技术栈限制、兼容性要求、标准遵从
- **性能约束**: 系统容量规格、资源运行设定条件
- **安全约束**: 安全/韧性/隐私的全局遵从要求
- **可靠性约束**: 可靠性指标的假设和约束
- **组织约束**: 团队结构、交付时间线

## Input Requirements

**Required artifacts** (read these first):
1. 功能需求列表: `XX功能列表.md`
2. 项目代码库上下文文件
3. 组件/模块组织文档
4. 现有架构文档（如有）

**Context to gather**:
- 现有系统架构和系统元素
- 现有API端点、接口契约和数据模型
- 团队/组件边界和所有权
- 非功能性需求（性能、可靠性、安全性指标）
- 技术栈约束和标准

## Output Structure

### 完整输出件结构

```markdown
# SR-AR分解分配表

## Metadata
- Project: [项目名称]
- Version: [版本号]
- Date: [创建日期]
- Input: [功能列表文件路径]

---

## 一、系统元素清单

### 1.1 架构元素定义

| 元素ID | 元素名称 | 元素类型 | 核心职责 | 所属子系统 | 依赖元素 |
|--------|---------|---------|---------|-----------|---------|
| SE-001 | [名称] | Service/Module/Middleware/... | [一句话职责] | [子系统] | [SE-XXX, ...] |

### 1.2 功能对象定义

| 对象ID | 对象名称 | 所属架构元素 | 核心职责 | 聚合根/实体 |
|--------|---------|------------|---------|------------|
| FO-001 | [名称] | SE-XXX | [职责] | [领域实体] |

### 1.3 领域数据模型

描述核心数据对象、数据对象之间的关系、数据对象归属的系统元素。
用文字或 mermaid ER图表达。

---

## 二、系统设计约束

### 2.1 技术约束
| 约束ID | 约束内容 | 来源 | 影响范围 |
|--------|---------|------|---------|
| TC-001 | [约束描述] | [场景/利益相关人] | [影响的SR/系统元素] |

### 2.2 性能约束
| 约束ID | 指标名称 | 指标要求 | 度量条件 | 影响范围 |
|--------|---------|---------|---------|---------|
| PC-001 | [如：响应时间] | [如：P99 < 200ms] | [负载条件] | [SR/系统元素] |

### 2.3 安全/韧性/隐私约束
| 约束ID | 约束类型 | 约束内容 | 合规要求 | 影响范围 |
|--------|---------|---------|---------|---------|
| SC-001 | 安全/韧性/隐私 | [约束描述] | [标准/法规] | [SR/系统元素] |

### 2.4 可靠性/可用性约束
| 约束ID | 指标名称 | 目标值 | 度量方式 | 影响范围 |
|--------|---------|--------|---------|---------|
| RC-001 | [如：系统可用性] | [如：99.9%] | [计算方式] | [SR/系统元素] |

### 2.5 易用性约束
| 约束ID | 约束内容 | 来源 | 影响范围 |
|--------|---------|------|---------|
| UC-001 | [易用性要求描述] | [来源] | [影响范围] |

---

## 三、系统级规格设计

### 3.1 [规格名称] 系统级规格设计

**设计思路**: [概述设计原则和方法]

**规格分解**:

| 系统级指标 | 目标值 | 分解到系统功能 | 功能级指标 | 分解依据 |
|-----------|--------|-------------|-----------|---------|
| [全局指标] | [值] | SR-XXX | [功能指标] | [为什么这样分] |

---

## 四、SR-AR分解

### SR-001: [SR名称]

#### SR描述 (5W2H)
- **Who**: [系统元素ID + 名称] — 不仅仅是团队，要关联到具体系统元素
- **When**: [功能生命周期阶段]
- **What**: [功能内容 + 发布件变化 + 测试变化]
- **Where**: [运行环境 + 依赖组件 + 部署位置]
- **Why**: [需求来源IR]
- **How Much**: [规模估算]
- **How**: [使用方式 + 工作流程 + 集成点]

#### 关联系统元素
| 系统元素ID | 元素名称 | 在本SR中的职责 | 是否新增 |
|-----------|---------|--------------|---------|
| SE-XXX | [名称] | [职责] | 新增/修改 |

#### DFX需求
| DFX类型 | 需求ID | 需求描述 | 优先级 | 验证方式 |
|---------|--------|---------|--------|---------|
| 可靠性 | DFX-R-001 | [如：功能FMEA需关注的异常场景] | 高/中/低 | [如：故障注入测试] |
| 安全性 | DFX-S-001 | [如：需进行威胁建模的攻击面] | 高/中/低 | [如：渗透测试] |
| 性能 | DFX-P-001 | [如：关键路径响应时间要求] | 高/中/低 | [如：压力测试] |
| 可维护性 | DFX-M-001 | [如：可观测性/日志/监控要求] | 高/中/低 | [如：监控验收] |

#### 系统规格指标
| 指标名称 | 目标值 | 度量条件 | 来源(系统级规格) |
|---------|--------|---------|----------------|
| [指标] | [值] | [条件] | 规格3.1分解而来 |

#### 分配的AR列表

##### AR-001-01: [AR名称]

**AR描述**:
- **场景**: [具体使用场景]
- **前置条件**: [执行前需满足的条件]
- **后置条件**: [执行后的系统状态]

**分配系统元素**: SE-XXX [系统元素名称]

**实现方式**:
- 选项1：复用现有功能
  - 位置: [模块/文件/函数位置]
  - 修改点: [接口扩充/行为变更的具体内容]
- 选项2：新增功能
  - 调用接口: [API endpoint]
  - 成功处理: [成功时的行为]
  - 失败处理: [失败时的行为]

**接口规格**:

| 项目 | 内容 |
|------|------|
| 接口名称 | IF-XXX: [接口名称] |
| 接口描述 | [功能目的] |
| 接口类型 | REST API / gRPC / Event / Internal / MQ |
| 提供方系统元素 | SE-XXX [名称] |
| 消费方系统元素 | SE-YYY [名称] |
| 输入要求/参数 | [参数名称、类型、必选/可选、约束] |
| 输出要求/参数 | [返回值类型、错误码、响应格式] |
| SLA定义 | [响应时间、吞吐量、可用性] |
| 约束和注意事项 | [幂等性、并发、版本兼容、安全] |

**数据模型**: [涉及的数据结构变更]

**DFX要求**:
- 可靠性: [异常处理、重试策略、降级方案]
- 安全性: [认证/授权/数据保护要求]
- 性能: [响应时间/吞吐量要求]

**工作量估算**: [≤0.5K]
**分配团队**: [负责组件团队]

---

## 五、接口规格汇总

| 接口ID | 接口名称 | 接口类型 | 提供方(系统元素) | 消费方(系统元素) | 输入概要 | 输出概要 | SLA | 关联AR |
|--------|---------|---------|----------------|----------------|---------|---------|-----|--------|
| IF-001 | [名称] | [类型] | SE-XXX [名称] | SE-YYY [名称] | [主要入参] | [主要出参] | [要求] | AR-XXX-XX |

---

## 六、分配需求汇总

| 系统需求编号 | 系统需求 | 分配需求编号 | 分配需求描述 | 系统元素 | 分配团队 |
|------------|---------|------------|------------|---------|---------|
| SR-001 | [名称] | AR-001-01 | [描述] | SE-XXX [名称] | [团队] |

---

## 七、DFX需求汇总

### 7.1 可靠性需求矩阵
| SR/AR编号 | 功能描述 | 故障模式 | 故障影响 | 严重度 | 检测方式 | 缓解/恢复措施 |
|-----------|---------|---------|---------|--------|---------|-------------|
| AR-XXX-XX | [描述] | [可能故障] | [对系统/用户的影响] | 高/中/低 | [如何检测] | [如何缓解和恢复] |

### 7.2 安全需求矩阵
| SR/AR编号 | 功能描述 | 威胁场景 | 威胁等级 | 安全要求 | 防护措施 | 验证方式 |
|-----------|---------|---------|---------|---------|---------|---------|
| AR-XXX-XX | [描述] | [威胁] | 高/中/低 | [要求] | [措施] | [验证方法] |

### 7.3 性能需求矩阵
| SR/AR编号 | 功能描述 | 性能指标 | 目标值 | 度量条件 | 优化策略 |
|-----------|---------|---------|--------|---------|---------|
| AR-XXX-XX | [描述] | [如：响应时间] | [如：P99<100ms] | [负载条件] | [缓存/异步/批处理等] |
```

## Reference Documents

This skill includes detailed reference guides. Load them as needed:

- **[5W2H Framework](references/5w2h-framework.md)**: Complete guide for writing SR descriptions using 5W2H structure. Load when writing SR descriptions or validating existing SRs.
- **[DDD Patterns](references/ddd-patterns.md)**: Domain-Driven Design patterns for bounded context identification, system element mapping, and module organization. Load when identifying system elements or organizing modules.
- **[AR Estimation](references/ar-estimation.md)**: Workload estimation techniques and AR splitting strategies. Load when estimating AR workloads or splitting ARs that exceed 0.5K.
- **[Example](references/example.md)**: Complete worked example of SR-AR decomposition with system elements, interfaces, and DFX. Load when you need a reference example to understand the complete workflow.
- **[Template](templates/sr-ar-template.md)**: Standard SR-AR decomposition table template. Load when starting a new decomposition document.

**When to load references**:
- First time using this skill → Read Example for complete understanding
- Writing SR descriptions → Load 5W2H Framework
- Identifying system elements and modules → Load DDD Patterns
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
- Read component organization document and existing architecture
- Identify existing system elements (services, modules, middleware)
- Identify existing interfaces, APIs, and data models
- Map component ownership to teams
- Collect non-functional requirements (performance, reliability, security targets)

**Step 3: Analyze codebase structure**
```typescript
// Use explore agent for codebase pattern discovery
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  prompt="Find existing system element boundaries (services, modules, middleware), interface contracts (API definitions, message schemas), data models, and non-functional patterns (error handling, retry, circuit breaker, auth) in the codebase"
)
```

### Phase 2: Identify System Elements (系统元素识别)

**Step 1: 识别架构元素**
从现有架构和代码结构中识别：
- 独立部署的服务 (Service)
- 可复用的功能模块 (Module)
- 中间件/网关 (Middleware/Gateway)
- 存储组件 (Storage)
- 外部系统适配器 (Adapter)

**Step 2: 识别功能对象**
在每个架构元素内部识别：
- 领域实体和聚合根 (DDD Aggregate Roots)
- 业务处理器 (Handlers/Processors)
- 适配器和工厂 (Adapters/Factories)
- 事件发布/订阅者 (Event Publishers/Subscribers)

**Step 3: 定义领域数据模型**
- 识别核心数据对象及其属性
- 定义数据对象之间的关系（关联、聚合、组合）
- 明确数据对象归属的系统元素
- 用文字或mermaid ER图表达

**Step 4: 记录系统元素清单**
按照模板输出：
- 架构元素定义表 (SE-XXX)
- 功能对象定义表 (FO-XXX)
- 领域数据模型图

### Phase 3: Capture Design Constraints and System Specifications (设计约束与规格)

**Step 1: 识别设计约束**
从场景分析和利益相关人要求中提取：
- 技术栈限制、兼容性要求
- 性能容量规格和资源条件
- 安全/韧性/隐私全局要求
- 可靠性指标假设
- 组织和交付约束

**Step 2: 定义系统级规格**
对全局性设计指标进行初步定义：
- 性能规格（响应时间、吞吐量、并发数）
- 容量规格（数据量、用户规模、连接数）
- 可靠性规格（可用性目标、故障恢复时间）
- 安全规格（认证等级、加密要求）

**Step 3: 规格分解预研**
初步分析如何将系统级规格分解到各个系统功能：
- 确定哪些SR承载哪些规格指标
- 给出分解依据和设计思路
- 注意：详细分解在systemFunctionalDesign阶段完成，此处提供分解基础

### Phase 4: Decompose into SRs (DDD-based Module Identification)

**Step 1: Identify bounded contexts**
Apply Domain-Driven Design principles:
- Group related functions into logical modules
- Maintain high cohesion, low coupling
- Identify core domain entities (Aggregate Roots)
- **Map each bounded context to system elements**

**Step 2: Create SRs**
For each identified module:
1. Define SR using 5W2H framework
2. Map to functional requirements (IR traceability)
3. **Associate with system elements** (not just teams)
4. **Attach DFX requirements** (reliability, security, performance)
5. **Assign system specification indicators** from Phase 3
6. Estimate scope (how much)

**Key questions to ask**:
- What system elements are involved in this function?
- What interfaces does this function need between system elements?
- What are the DFX (non-functional) requirements?
- What quantitative specifications apply?
- What data does this function access and which system element owns it?
- Are there cross-cutting concerns (auth, logging, etc.) → extract as system-wide SRs

### Phase 5: Decompose SRs into ARs (with Interface Specs)

**Step 1: Scenario analysis**
For each SR, identify all usage scenarios:
- User interactions (normal flow)
- System integrations (between system elements)
- Edge cases and error conditions
- **Key use cases that need sequence diagram level detail**

**Step 2: Create ARs**
For each scenario:
1. **Assign to specific system element** (SE-XXX)
2. **Define interface specifications**:
   - 接口名称、类型（REST/gRPC/Event/MQ/Internal）
   - 输入输出参数（类型、格式、约束）
   - SLA要求（响应时间、吞吐量）
   - 约束（幂等性、并发控制、版本兼容）
3. **Capture DFX requirements at AR level**:
   - 可靠性：异常处理、重试/降级/熔断策略
   - 安全性：认证/授权/数据保护
   - 性能：关键路径性能预算
4. Define success/failure handling
5. Specify data model changes
6. Estimate workload (must be ≤ 0.5K)
7. Assign to component team

**AR description checklist**:
- [ ] Specific scenario described with pre/post conditions
- [ ] **Assigned to a specific system element (SE-XXX)**
- [ ] **Interface specification defined (name, type, I/O, SLA, constraints)**
- [ ] Implementation approach chosen (reuse vs new)
- [ ] Success/failure handling defined
- [ ] Data model changes specified
- [ ] **DFX requirements captured (reliability, security, performance)**
- [ ] Workload ≤ 0.5K
- [ ] Team assignment clear

### Phase 6: Build Summary Tables (汇总表)

**Step 1: 接口规格汇总**
将所有AR中定义的接口汇集到统一的接口规格表：
- 去重合并相同接口
- 检查接口一致性（同一接口在不同AR中的定义不矛盾）
- 标注接口间的依赖关系

**Step 2: 分配需求汇总**
构建 SR → AR → 系统元素 的完整追溯表：

| 系统需求编号 | 系统需求 | 分配需求编号 | 分配需求描述 | 系统元素 |
|------------|---------|------------|------------|---------|

**Step 3: DFX需求汇总**
构建可靠性需求矩阵（FMEA输入）和安全需求矩阵：
- 从所有SR/AR中提取DFX需求
- 补充故障模式、威胁场景分析
- 这将直接作为moduleFunctionalDesign中DFX分析章节的输入

### Phase 7: Validate and Refine

**Validation checklist — 覆盖性检查**:
- [ ] All functional requirements mapped to SRs (IR → SR追溯完整)
- [ ] Each SR follows 5W2H structure
- [ ] SRs maintain high cohesion within modules
- [ ] Low coupling between SRs

**Validation checklist — 系统元素检查**:
- [ ] All SRs associated with system elements
- [ ] System elements have clear responsibilities and boundaries
- [ ] Domain data model complete with entity relationships

**Validation checklist — 接口规格检查**:
- [ ] **All AR-to-AR interactions have interface specifications**
- [ ] **Interface I/O parameters are typed and constrained**
- [ ] **SLA requirements defined for external-facing interfaces**
- [ ] Interface consistency across ARs (no contradictions)

**Validation checklist — DFX检查**:
- [ ] Each SR has DFX requirements identified
- [ ] Critical paths have performance budgets
- [ ] Failure modes identified for reliability-sensitive functions
- [ ] Security-sensitive functions have threat scenarios

**Validation checklist — 规格检查**:
- [ ] System-level specifications defined with quantitative targets
- [ ] Specifications mapped to SRs with decomposition rationale
- [ ] Design constraints documented with sources

**Validation checklist — AR检查**:
- [ ] All SRs decomposed into ARs
- [ ] Each AR workload ≤ 0.5K
- [ ] Each AR assigned to specific system element
- [ ] ARs reference specific code locations or APIs
- [ ] Component team assignments are clear
- [ ] No AR description exceeds conceptual design level

**Common validation issues**:
| Issue | Detection | Fix |
|-------|-----------|-----|
| AR missing interface spec | No interface table in AR | Add interface specification with I/O, SLA |
| AR not mapped to system element | Missing SE-XXX reference | Assign to specific system element |
| SR missing DFX | No DFX requirements section | Analyze reliability/security/performance needs |
| Interface inconsistency | Same interface defined differently in two ARs | Unify interface definition |
| System spec not decomposed | Global metric without function-level breakdown | Add decomposition rationale per SR |
| AR too large | Workload > 0.5K | Split into multiple ARs by scenario |
| AR too vague | Missing code location or API | Add specific module/file/function references |
| SR spans multiple domains | Low cohesion indicators | Split into separate SRs by bounded context |

## Downstream Traceability Map

本阶段输出如何映射到下游文档章节：

### → systemFunctionalDesign (系统功能设计说明书)

| 系统设计说明书章节 | 来源 |
|------------------|------|
| 系统设计方案概述 | SR-AR整体结构 + 系统元素清单 |
| 系统级设计约束 | 二、系统设计约束 |
| 系统级规格设计 | 三、系统级规格设计 + SR规格指标 |
| 系统级专项设计 - 行为描述 | AR交互关系 + 接口规格 → 生成时序图 |
| 系统级专项设计 - DFX | 七、DFX需求汇总 |

### → moduleFunctionalDesign (模块功能设计说明书)

| 模块设计说明书章节 | 来源 |
|------------------|------|
| 功能域概述 | SR bounded context描述 |
| 功能域总体方案 | 系统元素清单 + 领域数据模型 |
| 增量系统需求清单 | SR列表 (直接映射) |
| 实现思路 | AR实现方式 |
| 实现设计 - 时序图 | AR接口规格 + 系统元素交互 → 展开为时序图 |
| **接口设计** | **五、接口规格汇总 + AR接口规格** |
| **DFX分析** | **七、DFX需求汇总 + AR级DFX要求** |
| **分配需求** | **六、分配需求汇总** |

## Common Pitfalls

| Pitfall | How to Avoid |
|---------|--------------|
| SR too granular | Ensure SR represents a complete functional module, not individual features |
| AR too abstract | Always reference specific code locations or API endpoints |
| Missing 5W2H in SR | Use checklist to verify all 5W2H elements present |
| AR workload > 0.5K | Split into multiple ARs by scenario or implementation phase |
| **AR缺少接口规格** | **每个涉及系统元素间交互的AR必须定义接口规格表** |
| **SR缺少DFX** | **每个SR必须标注可靠性、安全性、性能的关注点** |
| **未识别系统元素** | **先建立系统元素清单，再进行SR-AR分解** |
| **规格未分解** | **系统级指标必须分解到具体SR/功能** |
| Unclear team assignment | Always specify which component team owns each AR |
| Duplicate AR creation | Check existing system capabilities before defining new ARs |

## Success Criteria

- [ ] All functional requirements decomposed into SRs
- [ ] Each SR uses complete 5W2H description
- [ ] SRs aligned with DDD bounded contexts
- [ ] **System elements identified with clear responsibilities**
- [ ] **Domain data model defined with entity relationships**
- [ ] All SRs decomposed into ARs
- [ ] Each AR ≤ 0.5K workload
- [ ] **Each AR assigned to specific system element (SE-XXX)**
- [ ] **Interface specifications defined for all inter-element interactions**
- [ ] **DFX requirements captured for each SR/AR**
- [ ] **System-level specifications defined and decomposed to SRs**
- [ ] **Design constraints documented**
- [ ] ARs reference specific implementation locations
- [ ] Clear team assignments for all ARs
- [ ] **Summary tables complete**: Interface spec table, allocation table, DFX matrix
- [ ] Output saved to `.hyper-designer/sr-ar-decomposition/[项目名]-SR-AR分解表.md`
