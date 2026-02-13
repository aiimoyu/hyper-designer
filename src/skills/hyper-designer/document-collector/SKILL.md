---
name: document-collector
description: |
  An interactive skill for collecting and indexing materials required for a specific workflow phase.

  **Core Principle - Interactive Collection**:
  This skill operates through a structured **dialogue with the user**. It does NOT execute automated background collection or make assumptions about relevance. It must validate findings, confirm scope, and request missing resources via explicit user interaction.

  **When to Use**:
  - Triggered when the system prompt indicates "collect materials first" or "gather context".
  - Used to audit existing assets and identify gaps *before* task execution.
  - Interprets user commands like "do X" or "build X" as "collect materials needed to implement X" (preparation phase).
  - Used when a structured, user-verified inventory of codebases or documents is needed.

  **Output**:
  Produces `.hyper-designer/{stage}/document/draft.md` (process log) and `.hyper-designer/{stage}/document/manifest.md` (final index), where `{stage}` is the current stage name.
---

# 资料收集

**资料收集时唯一职责：收集资料，建立索引。不执行任务，不制定规划，不编写代码。**

当用户说"做X"、"实现X"、"构建X"时，始终解读为：**"收集实现X所需的参考资料"**。

## 绝对约束

### 核心铁律

1.  **强制交互**：Step 3（预扫描确认）和 Step 4（访谈补充）是**必经环节**。严禁在预扫描后直接生成索引并退出。
2.  **聚焦当前**：仅扫描和收集与**当前阶段**强相关的资料。文件夹中资料若与当前阶段无关，应忽略。
3.  **复用优先**：优先读取 `manifest.md`，复用其他阶段已收集且本阶段依赖的资料。若 `manifest.md` 已存在某资料，**禁止重复收集**，仅需引用。

### 禁止

- 编写代码文件（`.ts`、`.js`、`.py` 等）
- 编辑项目源代码（`.hyper-designer/*.md` 除外）
- 运行实现命令（build、deploy、test 等）
- 创建非 markdown 文件
- 任何"执行工作"而非"收集资料"的行为
- **跳过交互环节直接输出结果**
- **对整个代码库进行漫无目的的全量扫描**

## 收集流程

共 5 步，严格按顺序执行。**每一步都必须完成，不得跳跃**。

### Step 1: 界定范围与复用检查

**目标**：明确本次收集的边界，最大化复用已有资产。

1.  **加载上下文**：
    - 提取**当前阶段名称**及**本阶段所需资料类别**。
2.  **复用检查（关键！）**：
    - 读取 `.hyper-designer/{stage}/document/manifest.md`（若存在，`{stage}` 为当前阶段名称）。
    - 识别已收集的资料中，哪些是本阶段依赖的（如：通用规范、基础组件文档）。
    - 将这些资料标记为 **[已索引-复用]**，后续步骤跳过收集，仅在草稿中引用。
3.  **界定扫描范围**：
    - 基于当前阶段任务，确定需要**新搜集**的资料类别。
    - 明确排除已复用的资料和无关的文件夹路径。

> **输出**：在 `draft.md` 中记录"复用资产清单"和"本次待收集范围"。

### Step 2: 针对性预扫描

**目标**：仅对 Step 1 界定的"待收集范围"进行扫描。

1.  **精准扫描**：
    - 使用 Glob/Grep/Ls 针对特定目录或模式搜索。
    - **过滤**：排除与当前阶段无关的文件（如前端阶段扫描后端部署脚本）。
    - **过滤**：排除 `manifest.md` 已索引的文件。
2.  **调用子智能体**：
    - 仅当需要深度分析特定模块时，调用 `task(subagent_type="explore")`，并限定其搜索范围。
3.  **记录结果**：
    - 在草稿中记录发现的文件路径、简要说明。

### Step 3: 确认预扫描准确性（强制交互）

**【交互检查点 1 - 必须执行】**

**严禁**跳过此步直接进入下一步或退出。

向用户展示扫描结果并确认预扫描是否正确并相关：

```markdown
## 预扫描结果确认

**当前阶段**：{阶段名称}
**已复用资料**：{列表，来自 manifest.md}
**本次新发现资料**：

### {资料类别A}

- [ ] file1.md — 描述
- [ ] file2.ts — 描述

### {资料类别B}

- [ ] file3.json — 描述

**请确认**：

1. 以上发现的文件是否与当前阶段相关？（多选确认）
2. 是否有需要重点关注的文件？
3. 是否有遗漏的文件需要补充？
```

**根据用户反馈更新草稿**：移除用户确认不相关的文件，补充遗漏文件。

### Step 4: 访谈补充资料（强制交互）

**【交互检查点 2 - 必须执行】**

**严禁**跳过此步直接生成索引。

按资料类别逐项核对，询问用户是否还有资料补充。

**开场话术**：

```
在【{当前阶段}】中，除去已复用的资料，还需要关注：{A}、{B}。
目前 A 已扫描到 {N} 份，B 已扫描到 {M} 份，C 暂缺。
我将按顺序逐项核对。如果某项资料已具备，请确认；如果暂缺，请告知是否需要现在补充或稍后处理。
我们先从【{A}】开始……
```

**交互策略**：

| 场景             | 响应                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| 用户确认资料充分 | "收到。已标记为[完整]。进入下一项……"                                   |
| 用户补充资料     | "收到。需要下载还是仅建立索引？" -> 更新草稿                           |
| 用户表示缺失     | "明白，已标记为[缺失]。这对后续任务可能有影响，稍后评估。进入下一项……" |

**每获得新信息，立即更新草稿**。

### Step 5: 生成索引并退出

1.  汇总草稿内容，更新 `{stage}/document/manifest.md`（`{stage}` 为当前阶段名称）。
2.  **索引结构**：
    - **当前阶段区块**：包含新收集的资料和复用的资料引用。
    - **复用标记**：明确区分 `[新搜集]` 和 `[复用自XX阶段]`。
3.  退出资料收集模式。

## 文件规范

### 目录结构

```
.hyper-designer/{stage}/document/  # {stage} 为当前阶段名称
├── draft.md                  # 收集过程草稿
├── manifest.md               # 最终资料索引
├── external-projects/        # 外部参考项目
└── downloads/                # 下载的公开资料
```

### 草稿模板更新（draft.md）

```markdown
# 资料收集草稿

## 阶段：{当前阶段名称}

### 1. 范围界定与复用

**本次目标**：收集实现 {当前阶段任务} 所需资料。

**复用资产（来自 {stage}/document/manifest.md，`{stage}` 为资料收集所在阶段）**：
| 资料名称 | 来源阶段 | 用途 | 状态 |
| --- | --- | --- | --- |
| api-spec.md | 需求分析 | 接口定义参考 | [复用] |

**待新搜集资料类别**：

- [ ] 资料类别A
- [ ] 资料类别B

### 2. 预扫描结果

（扫描结果，仅列出待新搜集部分）

### 3. 用户交互记录

（Step 3 和 Step 4 的交互记录）

### 4. 最终清单

（本次收集的所有资料汇总）
```

### 索引模板更新（manifest.md）

```markdown
# 资料索引

## 阶段：{当前阶段名称}

### {资料类别A}

| 名称        | 路径/地址          | 描述     | 来源            | 分析摘要    |
| ----------- | ------------------ | -------- | --------------- | ----------- |
| auth.ts     | ./src/core/auth.ts | 认证核心 | [新搜集]        | JWT实现     |
| api-spec.md | ./docs/api.md      | 接口规范 | [复用-需求分析] | RESTful规范 |

---
```

```

```
