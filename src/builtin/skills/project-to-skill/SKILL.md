---
name: project-to-skill
description: |
  Transform any code project into a structured Claude skill for rapid onboarding and AI-assisted development.
  Use this skill whenever: (1) a user provides a project path and wants it documented or analyzed,
  (2) generating onboarding materials or architecture docs from a codebase, (3) producing a development
  skill from an existing repo, (4) analyzing project structure, modules, or design patterns.
  Triggers: "create project skill", "generate onboarding skill", "project to skill", "skill for project",
  "analyze my project", "document this codebase", "帮我为项目生成skill", "项目分析skill",
  "代码项目生成技能", "把项目转成skill", "分析项目架构"
  Even if the user just pastes a file path or says "analyze this repo" — use this skill.
---

# Project-to-Skill

将任意代码项目转化为结构化 Claude skill，包含架构文档、模块分析和开发纲领。

---

## Stage 概览

| Stage | 目标 | Reference 文件 | 输出文件 |
|-------|------|---------------|----------|
| **1: projectOverview** | 初始化 + 探索 + 用户对齐 + 文档生成 | `references/Stage1-Overview.md` | Overview.md, Architecture.md, Guides.md, Principles.md |
| **2: moduleAnalysis** | 模块分解 + 粒度确认 | `references/Stage2-Modules.md` | Modules.md |
| **3: detailedModules** | 并行深度模块分析 | `references/Stage3-Detailed.md` | modules/M{id}-{name}.md |
| **4: skillGeneration** | 生成最终 SKILL + 洞察 | `references/Stage4-SkillGen.md` | SKILL.md, Insights.md |

**⛔ 每个阶段开始前必须先读取对应的 reference 文件，然后严格按文件中的编号步骤逐步执行。禁止跳步或合并步骤。**

---

## 输出目录结构

```
{skill_name}/
├── SKILL.md
└── references/
    ├── Overview.md
    ├── Architecture.md
    ├── Modules.md
    ├── Guides.md
    ├── Principles.md
    ├── Insights.md
    └── modules/
        └── M001-{Name}.md
```

输出根目录：`./.hyper-designer/projectToSkill/`

---

## GitNexus 命令速查

GitNexus 是本 skill 的核心分析工具，用于替代手动 grep/find，大幅节省上下文窗口。

### 初始化（仅 Stage 1 执行一次）

```bash
cd <project-path>
npx gitnexus analyze .
```

### Cypher 查询（直接访问图数据库）

```bash
# 统计概览
npx gitnexus cypher "MATCH (n) RETURN count(n) AS total_nodes" --repo <repo>

# 查看所有导出函数（公共 API 发现）
npx gitnexus cypher "MATCH (n:Function) WHERE n.isExported = true RETURN n.name, n.filePath LIMIT 30" --repo <repo>

# 查看执行流程（stepCount 越高越核心）
npx gitnexus cypher "MATCH (p:Process) RETURN p.heuristicLabel, p.processType, p.stepCount ORDER BY p.stepCount DESC LIMIT 10" --repo <repo>

# 发现模块社区（自然聚类边界）
npx gitnexus cypher "MATCH (c:Community) RETURN c.heuristicLabel, c.symbolCount ORDER BY c.symbolCount DESC LIMIT 15" --repo <repo>
npx gitnexus cypher "MATCH (f)-[:CodeRelation {type: 'MEMBER_OF'}]->(c:Community) RETURN c.heuristicLabel, collect(f.name) LIMIT 20" --repo <repo>

# 发现核心文件（被最多文件依赖）
npx gitnexus cypher "MATCH (f:File)<-[:CodeRelation {type: 'IMPORTS'}]-(g:File) RETURN f.name, count(g) AS deps ORDER BY deps DESC LIMIT 10" --repo <repo>

# 跨文件调用热图（模块间依赖强度）
npx gitnexus cypher "MATCH (a)-[:CodeRelation {type: 'CALLS'}]->(b) WHERE a.filePath <> b.filePath WITH a.filePath AS from, b.filePath AS to, count(*) AS n ORDER BY n DESC LIMIT 15 RETURN from, to, n" --repo <repo>

# 发现循环依赖
npx gitnexus cypher "MATCH path=(a:File)-[:CodeRelation*2..5]->(a) WHERE ALL(r IN relationships(path) WHERE r.type = 'IMPORTS') RETURN path LIMIT 10" --repo <repo>
```

> **多仓库场景**：`status` 提示 `Multiple repositories indexed` 时，所有命令必须加 `--repo <repo-name>`。

### query 命令（语义搜索执行流程）

```bash
npx gitnexus query "project entry point and initialization" --repo <repo>
npx gitnexus query "authentication flow" --repo <repo>
npx gitnexus query "{ModuleName} core logic flow" --repo <repo>
npx gitnexus query "error handling" --repo <repo>
# 带上下文和目标
npx gitnexus query "API routing" --context "web app" --goal "find request handling" --repo <repo>
# 含源码（上下文充足时）
npx gitnexus query "core business logic" --content --limit 3 --repo <repo>
```

### context 命令（符号 360° 视图）

```bash
npx gitnexus context <SymbolName> --repo <repo>
npx gitnexus context <SymbolName> --file src/auth/service.ts --repo <repo>  # 消除同名歧义
npx gitnexus context <SymbolName> --content --repo <repo>                   # 含源码
npx gitnexus context --uid "Function:validateUser" --repo <repo>            # 精确 UID
```

### impact 命令（变更影响分析）

```bash
npx gitnexus impact <FunctionName> --direction upstream --repo <repo>    # 谁依赖它
npx gitnexus impact <FunctionName> --direction downstream --repo <repo>  # 它依赖谁
npx gitnexus impact <FunctionName> --depth 2 --include-tests --repo <repo>
```

---

## 代码引用规则

```markdown
[File: src/auth/validator.ts:15-30]
[Function: validateUser() in File: src/auth/service.ts:45]
[Class: AuthService in File: src/auth/service.ts:10-100]
```

相对路径、包含行范围、引用最小相关单元。禁止绝对路径。

---

## Mermaid 图表规范

| 类型 | 用途 |
|------|------|
| `graph TD` | 层次结构、目录树 |
| `graph LR` | 流程、依赖、数据流 |
| `sequenceDiagram` | 调用序列 |
| `classDiagram` | 类关系 |

每张图最多 50 个节点，超出时拆分。

---

## YAML Front Matter（所有输出文件必须包含）

```yaml
---
title: 文档标题
version: 1.0
last_updated: YYYY-MM-DD
type: project-overview | system-architecture | module-analysis | operational-guides | development-principles | llm-insights | module-detail
project: {project_name}
---
```

---

## Subagent 验证协议

**阶段 1、2、3 完成后，必须委派 subagent 执行验证。** 先展示给用户，再决定是否修正。

```
任务：验证 {Stage} 输出的完整性和准确性
输入：{生成的文档列表} | 源码路径：{project-path}

检查：
1. 重要组件是否已识别（与源码交叉验证）
2. 层次结构是否与实际代码组织匹配
3. 设计模式是否有代码证据（不能猜测）
4. 数据流是否与实际调用链匹配
5. 是否有遗漏的关键模块或接口
6. 路径引用是否正确（无绝对路径，文件实际存在）

输出：✅ 已验证（附证据）| ❌ 问题项（附位置）| ⚠️ 不确定项（需用户确认）
```
