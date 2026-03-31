---
metadata:
  pattern: pipeline
  stages: 3
  sub_patterns: [inversion, generator]
---

# S2 Requirements Design

Based on the requirements analysis specification, complete the architecture change design and SR-AR decomposition, producing the **Requirements Design Specification**. This provides a clear technical blueprint for subsequent development planning and code implementation.

## Core Principles

| Principle | Practice | Anti-pattern |
|-----------|----------|--------------|
| **Minimal Change** | Prefer reusing and extending existing modules and interfaces | ❌ Rewrite from scratch at the slightest provocation |
| **Clear Boundaries** | Each module has an explicit allowed/prohibited modification scope | ❌ Vague "adjust as needed" |
| **Interface First** | Define interface contracts before designing internal implementation | ❌ Write implementation first, then retrofit interfaces |
| **Traceable** | Every design decision traces back to the requirements analysis specification | ❌ Decide based on gut feeling |
| **Prevent Tech Debt** | Interface changes must annotate compatibility impact and migration plan | ❌ Silently change without disclosure |

## Stage Objectives

Complete the following four analysis and confirmation items, then generate the document:

1. Understanding of existing architecture & codebase
2. Architecture change plan (module add/remove/modify + modification boundaries + frozen zones)
3. Interface change plan (new / modified / reused interfaces and compatibility impact)
4. Design pattern selection & DFx strategy

**This stage has 3 process nodes. Follow the [Proc] sequence below strictly — no skipping.**

---

## [Proc1] Design Exploration

### 1.1 Confirm Design Materials

**Confirm whether the following materials are available.** Request all missing items from the user in a single batch:

```
需求设计需要以下材料，请补充缺少的部分：

1. 需求分析说明书（必须）
   - [已完成的需求分析说明书路径]

2. 代码库
   - 本项目代码分析文档：[路径 / 文档链接]
   - 本项目代码：[路径 / 仓库链接 / 模块结构]
   - 参考项目代码：[有类似实现可参考时提供]

3. 领域资料（如有）
   - 领域架构分析 / 合规要求 / 特殊领域需求

4. 设计参考（如有）
   - 现有系统设计说明书 / 模块功能设计说明书 / 业界设计参考
```

**No codebase**: After confirming "greenfield project," skip the existing-system analysis in 1.2 and proceed directly to design.

### 1.2 Codebase & Reference Material Analysis

**Must complete the following analysis items based on the codebase**:

| Analysis Dimension | What to Do |
|--------------------|------------|
| **Module Structure** | Identify existing modules and their responsibility boundaries |
| **Dependency Relations** | Call/dependency chains between modules |
| **Core Interfaces** | Major interface definitions, providers, and consumers |
| **Data Models** | Core entities and their relationships |
| **Design Patterns** | Identify design patterns already used in existing code (e.g., Strategy, Observer, Factory, etc.) |
| **Tech Stack** | Frameworks, middleware, infrastructure |

### 1.3 Requirements Mapping Analysis

Map functional requirements from the requirements analysis specification to the existing architecture:

- Which features can be implemented by **extending existing modules**?
- Which features require **new modules**?
- Which existing modules **need modification**?
- Which existing modules **must NOT be modified**, including **protected (involved but modification prohibited)** and **not involved**? Why?
- What **interface connections** are needed between new and existing modules? Reuse existing interfaces or create new ones?
- After integration, does the new module **actually start up**?
- When modifying existing interfaces, how is **backward compatibility** ensured?

---

## [Proc2] Architecture Change Confirmation (Execute after codebase analysis is complete)

> **Iron Rule**: Inversion pattern — **do NOT generate the design document** until the architecture plan is confirmed by the user.

### 2.1 Module Change & Modification Boundary Confirmation

Present the complete module change plan including modification boundaries (fences), and confirm with the user **in a single batch**:

> **Q1**："我建议本次需求涉及的模块变更为：新增 ___、修改 ___、删除/废弃 ___、禁止修改 ___，这个划分是否合理？"
>
> **Q2**："新功能接入现有系统的方式为：通过 ___ 模块，复用已有接口 ___，新增接口 ___，修改接口 ___，这个方案是否接受？"
>
> **Q3**："我识别到的风险与边界为：___（如稳定核心模块不可改、接口兼容性要求、避免逻辑下沉到旧模块等），是否需要调整？"

### 2.2 Design Pattern & DFx Strategy Confirmation

Present the complete technical design strategy including architecture patterns and quality attribute safeguards, and confirm with the user **in a single batch**:

> **Q1**："我建议本次设计采用的模式策略为 ___，这个选型是否合理？"
>
> **Q2**："本次 DFx 保障方案为：可用性/可靠性方面 [如容错与降级、重试与熔断、超时控制、幂等设计、数据一致性]，易用性方面 [如错误提示与降级]，可扩展性方面 [如插件机制]，这些措施是否覆盖到位？"

### 2.4 Inversion Completion Criteria

All of the following conditions must be met before proceeding to document generation:

- [ ] User has confirmed the module change plan and modification boundaries
- [ ] User has confirmed the interface change plan and compatibility handling
- [ ] User has confirmed the design pattern and DFx strategy
- [ ] No unresolved technical conflicts or ambiguous areas remain

---

## [Proc3] Document Generation (Generator Pattern)

### 3.1 Generation Workflow

1. Load the document template `assets/requirements-design-template.md`
2. If any unconfirmed items or conflicts remain, **complete confirmation before generating**
3. Populate the template structure with content; generate the document to the designated location
4. Execute the quality self-check
5. Output a document summary for the user to review quickly

### 3.2 SR-AR Decomposition Principles

**When generating the document, follow these decomposition rules**:

#### SR Decomposition Rules

- **Total Control**: SR count should generally be 1–2; avoid excessive numbers
- **Scenario Correspondence**: Each SR corresponds to one major scenario or functional domain from the requirements analysis specification
- **Merge First**: Before adding a new SR, ask — **"Which major scenario does it correspond to? Can it be merged into an existing SR?"**

#### AR Assignment Rules

- **One AR, One Element**: Each AR belongs to exactly one system element (module/component/service)
- **Default 1–2**: Each SR defaults to 1–2 ARs, maximum 3
- **Over-limit Confirmation**: Exceeding 3 requires confirming the split rationale with the user
- **Must List Capability Points**: Each AR must list specific capability points — no vague descriptions
- **Valid Split Reasons**: Belongs to different system elements / different tech stacks / can be developed in parallel with clear boundaries

### 3.3 Quality Self-Check Checklist

**Architecture Design**:

- [ ] Unified architecture change diagram is drawn, showing add/modify/protect/not-involved
- [ ] Change type, modification scope, and protection rationale for each module are explicit
- [ ] Interface change list is complete, with compatibility impact and migration plan annotated
- [ ] No "implicit modifications" — all affected modules appear in the change table

**SR-AR Decomposition**:

- [ ] SR count is reasonable (1–2; exceeding 3 requires user confirmation), corresponding to major scenarios
- [ ] Each AR lists specific capability points
- [ ] Any increase in SR/AR count has been justified for necessity

**Design Patterns**:

- [ ] Existing design patterns in the codebase have been identified
- [ ] Newly introduced design patterns have explicit selection rationale and applicable scenarios

**Performance Targets**:

- [ ] Performance metrics are consistent with the requirements analysis specification
- [ ] Performance targets are decomposed to the module level

**Document Quality**:

- [ ] Document contains no code; described through natural language and Mermaid diagrams