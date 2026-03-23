---
name: project-to-skill
description: |
  Transform any code project into a comprehensive Claude skill for rapid onboarding and guided development.
  Use when: (1) Creating a skill from an existing codebase, (2) Generating project documentation for AI-assisted development,
  (3) Building onboarding materials for new developers, (4) Analyzing project architecture and modules.
  Triggers: "create project skill", "generate onboarding skill", "project to skill", "skill for project",
  "帮我为项目生成skill", "项目分析skill", "代码项目生成技能", "把项目转成skill"
---

# Project-to-Skill Skill

将任意代码项目转化为结构化的 Claude skill，包含架构文档、模块分析和开发纲领。

## 术语表

| 术语 | 定义 |
|------|------|
| **目标项目** | 被分析的外部项目（在阶段1提供路径） |
| **Skill根目录** | 最终输出的技能目录：`{skill_name}/` |
| **模块 (Module)** | 具有清晰职责边界的代码逻辑单元 |
| **接口 (Interface)** | 模块对外提供的API或函数 |
| **数据流 (Data Flow)** | 数据在系统中的流动过程 |
| **开发纲领** | 项目的设计偏好、编码标准、最佳实践 |

## Stage Overview

本工作流包含4个阶段，每个阶段有明确的目标和输出：

| Stage | 目标 | 输出文件 |
|-------|------|----------|
| **projectOverview** | 建立项目基础认知，生成概览、架构、指南、开发纲领 | Overview.md, Architecture.md, Guides.md, Principles.md |
| **moduleAnalysis** | 分解项目为模块，定义层次、依赖、接口 | Modules.md |
| **detailedModules** | 深入分析每个模块的类、函数、设计模式 | modules/M001-xxx.md 等 |
| **skillGeneration** | 生成最终SKILL.md和LLM洞察 | SKILL.md, Insights.md |

## Stage Routing — 强制加载 Reference

**每个阶段开始前，必须先读取对应的 reference 文件。**

| Stage | 强制加载的 Reference | 包含内容 |
|-------|---------------------|----------|
| `projectOverview` | `references/Stage1-Overview.md` | 执行流程、输出模板、检查清单、反模式 |
| `moduleAnalysis` | `references/Stage2-Modules.md` | 模块发现方法、粒度确认流程、输出模板 |
| `detailedModules` | `references/Stage3-Detailed.md` | 并行委派策略、模块分析模板、验证要求 |
| `skillGeneration` | `references/Stage4-SkillGen.md` | SKILL.md生成方法论、Insights.md模板 |

**⛔ 禁止跳过 reference 直接执行阶段。**

## Output Contract

### 输出目录结构

```
{skill_name}/
├── SKILL.md                      # 主技能文件
└── references/
    ├── Overview.md               # 项目概览
    ├── Architecture.md           # 系统架构
    ├── Modules.md                # 模块分析
    ├── Guides.md                 # 操作指南
    ├── Principles.md             # 开发纲领
    ├── Insights.md               # LLM洞察
    └── modules/
        └── M001-xxx.md           # 模块详情
```

### 输出约定

- 输出根目录：`./.hyper-designer/projectToSkill/`
- 输出格式：Markdown + YAML Front Matter
- 所有代码引用使用相对路径
- 阶段边界严格：只生成当前阶段要求的输出
- 下游阶段使用上游生成的 Markdown 文件，不重新扫描源代码

### YAML Front Matter 约定

```yaml
---
title: 文档标题
version: 1.0
last_updated: YYYY-MM-DD
type: document_type
project: {project_name}
---
```

### 文档类型标识

| 文件 | `type` 值 |
|------|-----------|
| Overview.md | `project-overview` |
| Architecture.md | `system-architecture` |
| Modules.md | `module-analysis` |
| Guides.md | `operational-guides` |
| Principles.md | `development-principles` |
| Insights.md | `llm-insights` |
| M001-xxx.md | `module-detail` |

## Mermaid 图表约定

| 类型 | 用途 |
|------|------|
| `graph TD` | 层次结构、目录结构、功能树 |
| `graph LR` | 流程、依赖、数据流 |
| `sequenceDiagram` | 调用序列 |
| `classDiagram` | 接口结构、类关系 |

**限制**：最大节点数 50，最大边数 100，超出时拆分图表。

## 代码引用规则

```markdown
[File: src/auth/validator.ts:15-30]
[Function: validateUser() in File: src/auth/service.ts:45]
[Class: AuthService in File: src/auth/service.ts:10-100]
```

规则：使用相对路径，行引用包含行范围，引用最小相关单元。

## GitNexus CLI（可选）

GitNexus 是可选的代码智能工具：

```bash
gitnexus analyze <project-path>     # 索引项目
gitnexus query "concept" --repo r   # 查询执行流
gitnexus context Symbol --repo r    # 获取符号上下文
gitnexus impact Symbol --direction upstream --repo r  # 检查影响
gitnexus status                     # 检查索引状态
```

## Multi-Agent Collaboration

**你是规划者和协调者，不是唯一的执行者。**

### 可委派的任务类型

| 任务 | 说明 |
|------|------|
| 探索特定模块的代码结构 | 专注的代码遍历 |
| 查找外部库/框架的文档 | 外部资源检索 |
| 验证接口实现一致性 | 交叉验证 |
| 分析复杂的数据流 | 深度追踪 |

### 委派策略

1. **识别独立任务** — 不相互依赖的任务可以并行执行
2. **并行委派** — 多个独立任务同时发起，不要串行等待
3. **继续工作** — 委派后继续处理非重叠的工作
4. **综合结果** — 收集结果，整合到分析中

### 禁止事项

- ❌ 独自完成所有探索（上下文过载）
- ❌ 委派综合/写作任务（这是你的核心职责）
- ❌ 在有非重叠工作时等待 subagent
- ❌ 委派时给出模糊的指令

## Execution Discipline

1. 读取当前阶段的 reference
2. 规划方法并识别可委派的任务
3. 并行发起 subagent 进行独立探索
4. 生成 reference 要求的所有输出
5. 输出可直接被下游阶段使用
6. 所有路径使用相对路径
7. 所有关系使用 Mermaid 图表
8. 所有文档使用 YAML Front Matter

## AI Development Support

分析结果设计为 AI 可直接使用：
- **Architecture**: 帮助 AI 理解系统设计
- **Module Map**: 帮助 AI 理解依赖影响范围
- **Interface Contracts**: 帮助 AI 了解 API 使用方式
- **Data Flow**: 帮助 AI 追踪数据处理过程
- **Principles**: 帮助 AI 遵循项目编码规范
