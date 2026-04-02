---
name: project-analysis
description: |
  Use when analyzing a codebase to understand architecture, module boundaries, and project conventions.
  Use when implementing changes that must follow the project's documented principles.
  Triggers: "analyze this repo", "how does this project work", "where is X implemented",
  "what are the coding conventions", "project analysis", "项目分析", "分析这个项目".
  Even if the user only provides a path inside this project, use this skill.
metadata:
  pattern: tool-wrapper
---

# Project Analysis

## 使用提醒

> **代码优先**：本项目分析不能代替实际代码阅读。本文件用于理解项目全局并加快定位，但可能因分析错误或过时与代码不符；永远采用**本文档 + 实际代码**的方式使用，冲突时永远以实际代码为准。

> **建议载入**：阅读 `principles/` 文件夹（如有），并按照其中的黄金准则进行编码。

## 文件索引

<!-- instruction: 文件按实际已生成填写，不要遗漏与编造 -->

| 文件 / 目录 | 说明 | 何时先读 |
|------------|------|---------|
| `Overview.md` | 项目概览、技术栈与目录结构 | 初次进入项目时 |
| `Architecture.md` | 系统边界、分层、核心流程 | 理解全局设计时 |
| `Modules.md` | 模块划分、依赖关系、通信模式 | 找到功能所属模块时 |
| `modules/` | 每个模块与子模块的详细说明 | 深入修改某个模块时 |
| `principles/` | 按主题拆分的开发原则 | 编码前 / 重构前 |

## 模块索引

<!-- instruction: 若模块详细说明尚未生成，表格留空并说明无详细文件 -->

| ID | 名称 | 职责 | 文档 |
|----|------|------|------|
| M001 | [待填写] | [待填写] | `modules/M001-xxx.md` |
| M001.1 | [待填写] | [待填写] | `modules/M001/M001.1-yyy.md` |

## 说明

### 适合触发本 skill 的场景

- 需要快速理解项目整体架构
- 需要判断某个功能属于哪个模块
- 需要遵循项目既有命名、错误处理或日志约定
- 需要在修改前确认依赖影响范围
- 需要把项目分析结果整理成可复用的开发原则

### 不要用本 skill 代替的事情

- 不要用分析文档代替实际源码阅读
- 不要把单个模块习惯误判为全局规范
- 不要在没有证据时猜测设计意图

## 如何使用

1. 先读 `references/Overview.md` 和 `references/Architecture.md`。
2. 再按功能定位读 `references/Modules.md` 和对应 `references/modules/*.md`。
3. 编码前先检查 `principles/*.md`。
4. 遇到冲突时，以源码与架构证据为准。
