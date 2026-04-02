# 阶段 1: 系统分析

## 重要说明

本阶段是 **project-analysis** skill 的一部分。project-analysis 是一个项目分析工作流，包含3个阶段：
1. 系统分析（当前阶段）
2. 组件分析
3. 缺漏检查

在使用本阶段提示词时，请确保理解整个 skill 的上下文和目标。

## 任务

分析目标项目并生成3个核心文档。

## 前置条件

- 确认目标项目路径
- 读取 `project-analysis` skill 中的 `references/phase1-overview.md` 获取完整方法论

## 输出

1. `overview.md` — 项目概览
2. `architecture.md` — 系统架构
3. `modules.md` — 模块分析

## 关键步骤

1. **初始化 GitNexus**：执行 `npx gitnexus analyze .` 建立代码知识图谱
2. **探索项目结构**：分析目录结构、技术栈、配置文件
3. **深度阅读关键代码**：并行委派 subagent 分析入口、核心流程、系统边界、模块结构
4. **生成文档**：基于模板生成 overview.md、architecture.md、modules.md
5. **验证文档**：确保文档间的一致性和完整性

详细方法论见 `project-analysis` skill 的 `references/phase1-overview.md`
