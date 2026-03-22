# 项目分析工作流重构设计汇总

## 1. 设计概述

本设计文档汇总了项目分析工作流（projectAnalysis）的重构方案，旨在解决当前工作流存在的问题，并满足AI后续开发的需求。

## 2. 设计文档列表

### 2.1 总体设计
- [project-analysis-redesign.md](project-analysis-redesign.md) - 总体重构设计

### 2.2 功能设计
- [function-tree-design.md](function-tree-design.md) - 功能树设计
- [patch-mechanism-design.md](patch-mechanism-design.md) - 修补机制和最终报告设计
- [chart-design.md](chart-design.md) - 图表设计规范

### 2.3 技术设计
- [persistence-design.md](persistence-design.md) - 持久化分析结果设计
- [extensible-format-design.md](extensible-format-design.md) - 可扩展文档格式设计

### 2.4 实现设计
- [hanalysis-redesign.md](hanalysis-redesign.md) - HAnalysis Agent重构设计
- [workflow-redesign.md](workflow-redesign.md) - Workflow定义重构设计
- [skill-redesign.md](skill-redesign.md) - Skill方法论和输出模板重构设计

## 3. 主要改进点

### 3.1 阶段重新划分
**原来**：3个阶段
1. systemAnalysis - 系统分析
2. componentAnalysis - 组件分析
3. missingCoverageCheck - 缺失覆盖率检查

**现在**：4个阶段
1. projectOverview - 项目概览分析
2. functionTreeAndModule - 功能树和模块分析
3. interfaceAndDataFlow - 接口和数据流分析
4. defectCheckAndPatch - 缺陷检查和修补

### 3.2 输出文件优化
**原来**：7个文件 + 1个文件夹
```
.hyper-designer/projectAnalysis/
├── architecture.md
├── components-manifest.md
├── api-catalog.md
├── source-overview.md
├── components/
│   └── {componentSlug}.md
├── component-analysis-summary.md
└── coverage-report.md
```

**现在**：6个文件
```
.hyper-designer/projectAnalysis/
├── project-overview.md
├── function-tree.md
├── module-relationships.md
├── interface-contracts.md
├── data-flow.md
└── analysis-report.md
```

### 3.3 新增功能树
- 建立功能层次结构
- 分析功能依赖关系
- 建立功能到模块映射

### 3.4 新增修补机制
- 检查分析完整性
- 检查分析一致性
- 修补前3个阶段的输出
- 生成最终报告

### 3.5 图表增强
- 目录结构图
- 功能树图
- 模块依赖图
- 数据流图
- 调用链图
- 接口图
- 完整架构图

### 3.6 可扩展性支持
- YAML Front Matter
- 模块化章节
- 版本管理
- 增量更新

### 3.7 AI开发支持
- 持久化分析结果
- 机器可读格式
- 查询接口
- 快速定位

## 4. 实现步骤

### 4.1 第一阶段：准备
1. 创建新的目录结构
2. 编写新的SKILL.md
3. 编写新的参考文档

### 4.2 第二阶段：实现
1. 修改HAnalysis Agent定义
2. 修改Workflow定义
3. 修改Prompt文件

### 4.3 第三阶段：测试
1. 单元测试
2. 集成测试
3. 用户验收测试

### 4.4 第四阶段：部署
1. 部署新版本
2. 迁移旧数据
3. 监控运行状态

## 5. 预期效果

### 5.1 文件数量减少
- 从7个文件 + 1个文件夹减少到6个文件
- 减少AI读取文件的数量

### 5.2 分析质量提升
- 新增功能树，更好地展示功能关系
- 新增修补机制，确保分析完整性
- 新增更多图表，更好地展示系统关系

### 5.3 AI开发支持
- 持久化分析结果，避免重复分析
- 机器可读格式，便于AI查询
- 可扩展格式，支持后续扩展

### 5.4 维护性提升
- 模块化设计，便于维护
- 版本管理，支持增量更新
- 一致性检查，确保分析质量
