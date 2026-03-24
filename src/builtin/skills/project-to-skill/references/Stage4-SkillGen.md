# Stage 4: SKILL.md 和洞察生成

## 阶段定义

**核心目标：** 将前三个阶段的分析成果提炼为一个高质量的 SKILL.md，使 AI 能够直接使用它来辅助该项目的开发工作。

**核心原则：代码优先**

- 代码是唯一的事实来源，README/文档可能过时或错误
- 所有分析结论必须有代码证据支撑
- GitNexus 是导航工具，必须结合实际代码阅读

**输入依赖：**

- `Overview.md` (阶段1)
- `Architecture.md` (阶段1)
- `Guides.md` (阶段1)
- `Principles.md` (阶段1)
- `Modules.md` (阶段2)
- `modules/*.md` (阶段3)

**输出文件：**

- `SKILL.md` — 主技能文件
- `Insights.md` — LLM 洞察

---

## 执行流程

**执行顺序：先生成 Insights.md，再生成 SKILL.md。**

原因：Insights 是对项目的全面审视，生成过程中可能发现重要的风险点或设计问题，这些发现应该反映在 SKILL.md 的开发原则和注意事项中。先洞察，再提炼。

---

### 4.1 生成 Insights.md

Insights 是 AI 对项目的**诚实评估**——不是宣传材料，是真实观察。先做这一步，因为分析过程中可能发现重要的风险点或设计问题，这些发现需要反映在后续的 SKILL.md 中。

**要求：**

- 每个观察必须有具体的文件引用
- 正面模式和改进领域都要有
- 建议必须可操作，不能是"需要改进"这种空话
- 技术债务需要量化严重程度

```markdown
---
title: {项目名称} 洞察
version: 1.0
last_updated: YYYY-MM-DD
type: llm-insights
project: {project_name}
---

# {项目名称} 洞察

> 基于自动代码分析生成。这些是观察，不是定论——请结合实际上下文判断。

## 代码质量观察

### 值得保持的模式 ✅

- **{pattern}**：{具体观察，含文件引用}
  > 见 [File: `{path}`:{line}]

### 建议改进的地方

- **{area}**：{观察} → 建议：{具体可操作的建议}
  > 影响文件：`{files}`

## 架构观察

### 优势

1. {strength — 含证据}

### 需要关注的点

1. **{concern}**
   - 风险等级：高 / 中 / 低
   - 原因：{分析}
   - 建议：{具体方案}
   - 相关文件：`{files}`

## 技术债务

| 类型 | 严重度 | 位置 | 建议 | 预估影响 |
|------|--------|------|------|----------|
| {type} | 高/中/低 | `{files}` | {suggestion} | {impact} |

## 设计模式分析

### 已识别的模式

| 模式 | 使用位置 | 使用是否合理 | 说明 |
|------|----------|------------|------|
| {pattern} | `{files}` | ✅/⚠️/❌ | {reasoning} |

### 可以引入的模式

| 模式 | 适用场景 | 预期收益 |
|------|----------|----------|
| {pattern} | {where_it_would_help} | {benefit} |

## 优先改进建议

| 优先级 | 建议 | 影响范围 | 工作量估计 |
|--------|------|----------|----------|
| 高 | {recommendation} | {scope} | 小/中/大 |
| 中 | {recommendation} | {scope} | 小/中/大 |
| 低 | {recommendation} | {scope} | 小/中/大 |
```

---

### 4.2 生成 SKILL.md

**在开始前，回顾 Insights.md 中的高优先级发现**——如果发现了严重的技术债务或架构风险，需要在 SKILL.md 的开发原则中体现。

遵循 skill-creator 方法论：

#### 关键原则

1. **Frontmatter description 是触发机制**：必须包含触发条件，要"稍微强势"——避免 AI 在明显应该用 skill 时不触发

2. **Body 的 Progressive Disclosure**：
   - SKILL.md 只提供索引和关键判断
   - 细节放在 references/ 文件中，通过链接引用
   - 不要在 SKILL.md 中复制粘贴 references/ 的内容

3. **只包含 AI 不能从代码中推断的信息**：
   - ✅ 模块地图（AI不会自动分析）
   - ✅ 开发流程（隐性知识）
   - ✅ 冲突解决优先级（主观决策）
   - ❌ 函数签名（AI可以读代码）
   - ❌ 目录结构（AI可以用 ls）

4. **优先级规则**：
   - 代码是事实来源（优先级最高）
   - Principles.md — 已建立的模式
   - Architecture.md — 系统完整性
   - Guides.md — 操作最佳实践

---

#### 输出模板

**首先获取项目 git commit id（如果项目使用 git）：**

```bash
cd <project-path>
git rev-parse HEAD 2>/dev/null || echo "not a git repo"
```

```markdown
---
name: {project-name}
git_commit: {commit_id 或 "not a git repo"}
description: |
  Development skill for {project_name} — {一句话描述项目核心价值}.
  Use when: (1) understanding {project_name} architecture or module boundaries,
  (2) implementing new features following {project_name} conventions,
  (3) debugging {project_name} issues and tracing data flows,
  (4) reviewing code changes for consistency with {project_name} principles.
  Triggers: "{project_name}", "{project_keywords}", "working on {project_name}",
  "{project_name} codebase", "开发{project_name}", "{project_name}项目",
  "{any_domain_specific_terms}".
  Even if the user only mentions a file path from this project, use this skill.
---

# {Project Name}

{一句话描述} — 使用 {主要技术栈}。

> **基于 commit**: `{commit_id}`（如果项目有 git）

## 快速开始

```bash
{install_command}
{run_command}
```

主入口：`{entry_file}`

## 架构概览

{2-3句话核心架构说明，不要照搬 Architecture.md}

层次：{Layer1} → {Layer2} → {Layer3}

详细架构：[Architecture.md](references/Architecture.md)

## 核心模块

| 模块 | 职责（一句话） | 详情 |
|------|--------------|------|
| **{M001-Name}** | {purpose} | [→](references/modules/M001-{Name}.md) |
| **{M002-Name}** | {purpose} | [→](references/modules/M002-{Name}.md) |
| **{M003-Name}** | {purpose} | [→](references/modules/M003-{Name}.md) |

模块依赖图：[Modules.md](references/Modules.md)

## 开发时去哪里找什么

| 我需要... | 读这个 |
|-----------|--------|
| 了解项目整体 | [Overview.md](references/Overview.md) |
| 理解系统设计和层次 | [Architecture.md](references/Architecture.md) |
| 找到某个功能在哪个模块 | [Modules.md](references/Modules.md) |
| 深入某个模块的接口 | [modules/{ModuleID}-{Name}.md](references/modules/) |
| 搭建环境 / 运行项目 | [Guides.md](references/Guides.md) |
| 遵循编码规范和设计原则 | [Principles.md](references/Principles.md) |
| 了解项目潜在问题和建议 | [Insights.md](references/Insights.md) |

## 开发原则（最重要的几条）

{从 Principles.md 中提炼，结合 Insights.md 高优先级发现}

1. {principle_1}
2. {principle_2}
3. {principle_3}
4. 完整规范：[Principles.md](references/Principles.md)

## 添加新功能的正确流程

1. {step_1 — 含需要修改的文件/目录}
2. {step_2}
3. {step_3}
4. {validation_step}

## 调试数据流

当遇到问题时，关键追踪路径：

```
{main_entry} → {module_1} → {module_2} → {module_3}
```

详细路径：[Modules.md#关键数据路径](references/Modules.md)

## GitNexus CLI（深度分析）

```bash
npx gitnexus analyze <project-path>          # 首次使用索引项目
npx gitnexus query "概念描述" --repo <repo>   # 按概念搜索代码
npx gitnexus context {SymbolName} --repo <repo>  # 获取符号的完整上下文
npx gitnexus impact {FunctionName} --direction upstream --repo <repo>  # 修改前检查影响范围
```

## 冲突解决优先级

文档与代码冲突时：

1. **代码是事实** — 代码说什么，以代码为准
2. **Principles.md** — 遵循已建立的模式和约定
3. **Architecture.md** — 维护系统层次完整性
4. **Guides.md** — 遵循操作最佳实践

```

---

## 验证

### SKILL.md 验证清单

- [ ] Frontmatter 包含 `name`、`git_commit` 和 `description`
- [ ] `description` 包含触发条件（Use when + Triggers）
- [ ] `git_commit` 字段已填写（commit id 或 "not a git repo"）
- [ ] Body 少于 500 行
- [ ] 所有链接指向已存在的文件
- [ ] 无绝对路径
- [ ] 开发流程步骤可操作（含文件）
- [ ] 冲突解决优先级已定义
- [ ] 模块地图已包含

### Insights.md 验证清单

- [ ] 每个观察有文件引用（不是空泛的"代码质量不好"）
- [ ] 建议是可操作的（不是"需要重构"）
- [ ] 技术债务有严重程度评级
- [ ] 正面和负面观察都有

---

## 完成检查清单

- [ ] 读取了所有阶段的输出文件（不是从记忆中生成）
- [ ] Insights.md 先于 SKILL.md 生成
- [ ] Insights.md 观察有文件引用证据
- [ ] Insights.md 建议可操作，技术债务有严重度评级
- [ ] SKILL.md 结合了 Insights.md 高优先级发现
- [ ] SKILL.md body < 500 行
- [ ] SKILL.md 不重复 references/ 文件中的详细内容
- [ ] SKILL.md 中的模块地图与 Modules.md 一致
- [ ] SKILL.md 中的开发流程与 Principles.md 一致
- [ ] 所有输出包含 YAML Front Matter
- [ ] 最终向用户展示 SKILL.md 并请求确认
