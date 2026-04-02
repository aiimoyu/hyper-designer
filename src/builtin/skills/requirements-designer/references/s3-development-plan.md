---
metadata:
  pattern: pipeline
  stages: 2
  sub_patterns: generator
---

# S3 Development Plan (SDD)

Based on the requirements design specification, complete task decomposition and plan scheduling, producing the **Development Plan (SDD)**. This provides an unambiguous, directly executable task sequence for development agents (e.g., Claude Code).

## Core Principles

| Principle | Practice | Anti-pattern |
|-----------|----------|--------------|
| **Framework First** | Greenfield projects must scaffold the skeleton before writing business logic | ❌ Dive straight into business code |
| **Coupling Priority** | Group tasks by functional coupling, not mechanically by AR | ❌ One plan per AR |
| **Right-sized Workload** | Each plan is 2–5 person-days; total plan count ≤ 3 | ❌ Plans too granular or too heavy |
| **Test First** | Define test scenarios for each task before implementing features | ❌ Write implementation first, then add tests |
| **Traceable** | Every task traces back to an AR and its capability points | ❌ Freelance beyond the design |
| **Explicit Locations** | Every task specifies exact files, line numbers, function names to modify | ❌ Vague "modify related code" |

## Stage Objectives

Complete the following four analysis and confirmation items, then generate the document:

1. Understanding of the requirements design specification & codebase
2. Task decomposition plan (AR → development task mapping, grouping, and ordering)
3. Modification location targeting (specific files and change points for each task)
4. Test & acceptance strategy (TDD test checklist, QA scenarios, acceptance workflow)

**This stage has 2 Step nodes. Follow the [S] sequence below strictly — no skipping.**

---

## [S1] Plan Exploration

### [A1.1] Confirm Plan Materials

Before starting, **must confirm whether the following materials are available.** Request all missing items from the user in a single batch:

```
开发计划需要以下材料，请补充缺少的部分：

1. 需求设计说明书（必须）
   - [已完成的需求设计说明书路径]

2. 代码库（必须，除非全新项目）
   - 本项目代码：[路径 / 仓库链接]
```

### [A1.2] Codebase Analysis & Modification Targeting

**Complete the following analysis items one by one** (mandatory for incremental projects; skip for greenfield projects):

| Analysis Dimension | What to Do |
|--------------------|------------|
| **Locate Target Files** | Based on AR capability points, locate specific files to modify/create |
| **Locate Modification Points** | Pinpoint to line-number ranges or function names; confirm modification type (add/modify/delete) |
| **Verify Fence Boundaries** | Cross-check frozen modules from the requirements design specification; ensure no task crosses boundaries |
| **Identify Integration Points** | How new code integrates with existing code (call method, registration method, configuration method) |
| **Identify Existing Patterns** | Existing code's naming conventions, directory structure, error-handling conventions |

### [A1.3] Task Grouping & Ordering Analysis

**Determine task grouping and ordering according to the following priority**:

Ordering principle: Framework first, progressive refinement
Wave count: Determined by task complexity, typically 1–3

```
Wave 0 (Infrastructure Layer):
├── Project scaffolding initialization
├── Build tool configuration
├── Directory structure creation
├── Base type definitions
└── Core dependency installation

Wave 1 (Data & Interface Layer):
├── Data model / Schema definitions
├── Interface type declarations
├── Base utility functions
└── Configuration files

Wave 2 (Core Business Layer):
├── Core business logic implementation
├── Service layer implementation
└── Business rule handling

Wave 3 (Interface & Integration Layer):
├── API endpoint implementation
├── UI component implementation
└── Inter-module integration

Wave FINAL (Acceptance Layer):
├── Integration tests
├── End-to-end tests
└── Requirements coverage audit
```

---

## [S2] Development Plan Generation

### [A2.1] Task Writing Principles

#### Facts-First Principle

> **⚠️ Do NOT generate any task before the facts are clear.**

- Treat the current codebase as the single source of truth
- Do not blindly trust documents or analysis files
- When uncertain, explore first

#### Task Numbering Rules

- Format: `T-{milestone-number}{sequence:02d}`, e.g., `T-101` (Milestone 1, task 1)
- For greenfield projects, framework scaffolding tasks start from `T-001` (Wave 0 has its own numbering)

#### Task Content Requirements

Each task **must include**:

| Required Field | Description |
|----------------|-------------|
| AR Mapping | Which AR and its capability points this task corresponds to |
| Target Files & Locations | Specific file paths, line numbers / function names, modification type |
| Capability Point Checklist | Directly from AR capability points; checkable |
| Implementation Notes | Key steps described from the implementer's perspective |
| Test Checklist | Test file paths, normal / exception / boundary scenarios |
| QA Scenarios | At least 2 (happy path + error path), with specific assertions |
| Acceptance Criteria | Executable acceptance commands |

#### Greenfield Project Framework Scaffolding Task

**The first milestone for a greenfield project must be framework scaffolding**, including:

```
1. 项目初始化
   - 包管理器配置
   - TypeScript / 构建工具配置
   - 代码规范配置

2. 目录结构
   - src/ tests/ docs/ 及子目录

3. 基础依赖
   - 运行时依赖 + 开发依赖 + 类型定义

4. 开发脚本
   - dev / build / test / lint

验收标准：
- [ ] npm run build 编译通过
- [ ] npm run test 框架可运行
- [ ] npm run lint 检查通过
- [ ] npm run dev 服务可启动
```

### [A2.2] Generation Workflow

1. Load the document template `assets/development-plan-template.md`
2. Populate the template structure with content; generate the document to the designated location
3. Output a document summary for the user to review quickly

### [A2.3] Quality Self-Check Checklist

**Task Completeness**:

- [ ] Every AR corresponds to at least one development task
- [ ] Each task's capability point checklist comes directly from AR capability points
- [ ] Each task has explicit target file paths and locations
- [ ] Each task has a test checklist (test file paths, scenario coverage)
- [ ] Each task has QA scenarios (happy path + error path)
- [ ] Task dependencies are fully annotated
- [ ] Modification fences are reflected in the execution instructions

**Plan Structure**:

- [ ] Milestone count is reasonable (≤ 3)
- [ ] Tasks are ordered by dependency relations and technical layers (not mechanically by AR)
- [ ] Coupled ARs are merged into the same milestone
- [ ] Greenfield projects include a framework scaffolding milestone