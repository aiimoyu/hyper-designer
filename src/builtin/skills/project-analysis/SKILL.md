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

本 SKILL 有两种执行模式：

**路由模式**：根据用户输入的分析范围（整体项目、组件分析、单一组件）路由到不同的分析流程。
**pipeline 模式**：在整体项目分析流程中，按照阶段依次执行，从概览分析到架构分析再到模块分析，最后提炼开发原则。

## Pipeline 模式

- **项目概览分析**: 执行 `references/phase1-system-analysis.md` 中的 S1-S8 阶段，禁止跳步。
- **用户反馈**: 告诉用户："已生成概览分析，可结束流程并直接使用。下一步将进行更详细的模块分析和开发原则提炼，是否需要进入下一步（推荐继续）"
- **深入分析**: 若继续，执行 `references/phase2-component-analysis.md` 中的 S1-S5 阶段，禁止跳步。

## 路由模式

本 skill 负责两类请求：

1. **系统分析**：用户希望整体理解项目、生成概览、架构、模块分析文档，进入 `references/phase1-system-analysis.md` 流程。
2. **组件分析**：用户希望构建每一个组件的详细分析文档，并生成项目原则，进入 `references/phase2-component-analysis.md` 流程。
3. **具体模块分析**：用户只关心单个模块的分析，参考模板 `assets/module-detail-template.md`，直接进入该模块的分析流程。阅读 `references/gitnexus-commands.md` 可了解如何使用 GitNexus 分析代码结构。
