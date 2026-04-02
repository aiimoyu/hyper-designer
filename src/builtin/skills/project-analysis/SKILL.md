---
name: project-analysis
description: |
  Use when analyzing a codebase to understand architecture, module boundaries, and project conventions.
  Use when implementing changes that must follow the project's documented principles.
  Use when the user asks to analyze a repository, document a codebase, trace where a feature lives, or turn a project into a reusable skill.
  Triggers: "analyze this repo", "how does this project work", "where is X implemented", "what are the coding conventions", "project analysis", "项目分析", "分析这个项目".
  Even if the user only provides a path inside this project, use this skill.
metadata:
  pattern: router
---

# Project Analysis

## 路由模式

本 skill 负责两类请求：

1. **项目分析**：用户希望整体理解项目、生成概览、架构、模块与原则文档。
2. **具体模块分析**：用户只关心某个模块、某个目录或某个文件。

### 项目分析流程

- **项目概览分析**: 执行 `references/phase1-overview.md`
- **用户反馈**: 告诉用户："已生成概览分析，可结束流程并直接使用。下一步将进行更详细的模块分析和开发原则提炼，是否需要进入下一步（推荐继续）"
- **深入分析**: 若继续，执行 `references/phase2-module-detail.md`

### 具体模块分析流程

- 阅读 `references/gitnexus-commands.md` 可了解如何使用 GitNexus 分析代码结构
- 阅读 `assets/module-detail-template.md` 可了解模块分析的输出格式