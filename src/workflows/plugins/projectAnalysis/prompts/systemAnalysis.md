## Current Phase: System Analysis

### 阶段定义

**执行者：** HAnalysis
**核心目标：** 发现目标项目的架构、组件、API 和源代码结构，生成系统级分析报告和组件清单。

**输入依赖：**
- 用户提供的目标项目绝对路径

---

### 1. 执行流程

#### 1.1 建立分析上下文

采用系统架构师身份，向用户收集目标项目信息：
- **目标项目路径**：项目的绝对路径
- **项目领域**：项目的业务领域和用途
- **分析范围**：分析整个代码库还是特定模块

#### 1.2 扫描分析边界

在深入分析之前，确定分析范围：

**排除目录：**
- `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`, `.next/`, `.nuxt/`

**排除文件模式：**
- `*.min.js`, `*.min.css`, `*.map`, `*.lock`, `package-lock.json`, `yarn.lock`

**包含语言识别：**
- 识别主要编程语言（TypeScript、JavaScript、Python、Go 等）

**框架检测：**
- 识别使用的框架（React、Vue、Express、Django、Spring 等）

**入口点定位：**
- 找到主要入口文件（index.ts、main.go、app.py 等）

#### 1.3 分析 5 个架构维度

每个维度必须产生结构化输出，包含在 `architecture.md` 中。

#### 1.4 生成输出文件

---

### 2. 5 个架构维度

#### 维度 1：Structure（结构）

**目的**：理解代码库的整体组织和布局。

**分析重点：**
- **模块边界**：识别顶级模块及其职责
- **分层架构**：映射各层（表示层/领域层/基础设施层）
- **目录结构**：记录有意的目录组织模式
- **模块依赖**：映射模块间的 import/require 关系
- **循环依赖**：识别并标记循环依赖问题

**必需输出：**
- 模块层次树（含职责说明）
- 依赖图（Mermaid `graph TD`）
- 分层架构图（Mermaid `graph LR`）
- 模块职责矩阵
- 识别的结构模式（MVC、Clean Architecture、Hexagonal 等）

#### 维度 2：Component Discovery and Granularity（组件发现和粒度）

**目的**：识别和分类项目中的所有逻辑组件。

**组件发现规则：**

| 规则 | 说明 |
|------|------|
| **领域驱动组件** | 寻找限界上下文或领域模块 |
| **框架组件** | 基于框架模式识别 controllers、services、repositories |
| **工具组件** | 识别共享工具和辅助模块 |
| **库组件** | 识别第三方库的包装器或适配器 |
| **横切关注点** | 识别日志、认证、配置、中间件组件 |

**组件粒度原则：**

| 原则 | 说明 |
|------|------|
| **单一职责** | 每个组件应有一个明确的职责 |
| **内聚耦合** | 相关功能应分组在一起 |
| **接口边界** | 组件应以公开接口为边界 |
| **可测试性** | 组件应可独立测试 |
| **领域对齐** | 组件边界应与领域概念对齐 |

**必需输出：**
- 组件清单（`components-manifest.md`），每个组件包含：componentSlug、name、description、path、type、dependencies
- 组件层次树
- 组件间依赖图
- 粒度评估说明

#### 维度 3：API and Interface Inventory（API 和接口清单）

**目的**：发现和记录项目中的所有 API 和接口。

**分析重点：**
- **REST APIs**：识别 HTTP 端点、路由和控制器
- **GraphQL APIs**：识别 schema 定义、resolver 和查询/变更
- **RPC APIs**：识别 gRPC 服务、Thrift 服务或其他 RPC 模式
- **Event APIs**：识别消息生产者/消费者、事件处理器
- **Library APIs**：识别公开模块导出和类接口

**必需输出：**
- API 目录（`api-catalog.md`），每个 API 包含：apiSlug、name、description、type、path、signature、component
- API 按类型分类（REST/GraphQL/RPC/Event/Library）
- API 到组件的映射
- 每个 API 的输入/输出 schema

#### 维度 4：Data Flow and Persistence（数据流和持久化）

**目的**：追踪数据从输入到存储再返回的完整路径。

**分析重点：**
- **数据模型**：识别实体定义、数据结构和 schema
- **数据访问模式**：识别 repositories、DAOs、ORM 使用
- **数据库 schema**：映射数据库表/集合到领域模型
- **数据转换**：识别数据映射器、DTOs 和转换逻辑
- **缓存策略**：识别缓存使用模式和失效策略

**必需输出：**
- 数据模型目录
- 数据流图（Mermaid `sequenceDiagram` / `graph LR`）
- 持久化层映射
- 缓存策略文档

#### 维度 5：Configuration and Deployment（配置和部署）

**目的**：理解项目的配置、构建和部署方式。

**分析重点：**
- **配置文件**：识别配置文件、环境变量和设置
- **构建和打包**：识别构建脚本、打包器配置和编译步骤
- **部署产物**：识别 Docker 文件、部署脚本和 CI/CD 配置
- **外部依赖**：识别第三方库及其用途
- **环境特定配置**：识别 dev/staging/prod 配置差异

**必需输出：**
- 配置清单
- 构建过程文档
- 部署流水线摘要
- 依赖树分析

---

### 3. 输出文件规格

#### 3.1 architecture.md — 系统架构分析报告

**路径**：`.hyper-designer/projectAnalysis/architecture.md`

**必需章节结构：**

```markdown
# System Architecture Analysis

## Executive Summary
[系统架构的高层概述]

## 1. System Structure and Organization
[模块层次、分层架构、依赖关系]
[Mermaid 目录结构图和分层图]

## 2. Component Landscape
[组件清单、边界、依赖关系]
[Mermaid 组件依赖图]

## 3. API and Interface Catalog
[API 清单、分类、契约]
[Mermaid API 交互图]

## 4. Data Flow and Persistence
[数据模型、访问模式、持久化层]
[Mermaid 数据流图和序列图]

## 5. Configuration and Deployment
[配置、构建、部署流水线]

## 6. Patterns and Anti-Patterns
[设计模式、反模式、技术债务]

## Appendices
- Component Manifest Reference
- API Catalog Reference
- Source Overview Reference
```

#### 3.2 components-manifest.md — 组件清单

**路径**：`.hyper-designer/projectAnalysis/components-manifest.md`

**格式**：Markdown 表格

```markdown
# Component Manifest

本文件是 Stage 2 组件分析的唯一事实来源。Stage 2 不得重新扫描源代码。

| componentSlug | Name | Description | Path | Type | Dependencies |
|---------------|------|-------------|------|------|--------------|
| auth-service | Auth Service | 处理用户认证和授权 | src/services/auth | service | user-repository, token-manager |
| user-repository | User Repository | 用户数据持久化 | src/repositories/user | repository | database-connection |
| ... | ... | ... | ... | ... | ... |

## 组件统计
- Total Components: N
- By Type: service(N), repository(N), controller(N), utility(N), library(N)
```

#### 3.3 api-catalog.md — API 目录

**路径**：`.hyper-designer/projectAnalysis/api-catalog.md`

**格式**：Markdown 表格

```markdown
# API Catalog

| apiSlug | Name | Type | Component | Path | Signature |
|---------|------|------|-----------|------|-----------|
| user-login | User Login | REST | auth-controller | src/controllers/auth.ts | POST /api/auth/login |
| ... | ... | ... | ... | ... | ... |

## API 统计
- Total APIs: N
- By Type: REST(N), GraphQL(N), RPC(N), Event(N), Library(N)
```

#### 3.4 source-overview.md — 源码概览

**路径**：`.hyper-designer/projectAnalysis/source-overview.md`

```markdown
# Source Overview

## 语言分布
| Language | File Count | Total Lines |
|----------|-----------|-------------|
| TypeScript | N | N |
| JavaScript | N | N |
| ... | ... | ... |

## 目录结构
[Mermaid graph TD 展示目录层次]

## 排除项
- 排除的目录：node_modules, .git, dist, build, coverage
- 排除的文件模式：*.min.js, *.min.css, *.map, *.lock
```

---

### 4. 完成检查清单

在完成 Stage 1 之前，验证：

- [ ] 目标项目路径已确认且可访问
- [ ] 分析边界已明确定义（排除/包含）
- [ ] 所有 5 个架构维度已分析并记录
- [ ] 组件发现规则已一致应用
- [ ] 组件粒度原则已应用并记录
- [ ] `architecture.md` 已生成，包含所有 5 个维度
- [ ] `components-manifest.md` 已生成，包含完整组件清单
- [ ] `api-catalog.md` 已生成，包含 API 清单和组件映射
- [ ] `source-overview.md` 已生成，包含文件目录和语言分布
- [ ] Mermaid 图表已包含且有效
- [ ] 代码引用遵循项目分析约定
- [ ] 所有 Markdown 文件格式正确，可读性强

---

### 5. 反模式

**禁止：**
- 跳过任何架构维度
- 未分析实际源代码就生成输出
- 使用通用目录扫描代替架构感知的组件发现
- 创建组件时不应用粒度原则
- 允许组件边界模糊或重叠
- 跳过组件间的依赖映射

**应该：**
- 系统性地分析所有 5 个架构维度
- 应用组件发现规则和粒度原则
- 生成人类可读的 Markdown 报告
- 建立具有单一职责的清晰组件边界
- 映射所有组件和模块间的依赖关系
- 记录框架特定的模式和约定
- 在声明 Stage 1 完成前验证所有输出文件
