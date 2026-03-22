# 持久化分析结果设计

## 1. 持久化需求分析

### 1.1 AI开发时的探索需求
AI在开发时通常需要了解：
1. **模块之间的关系**：了解模块如何协作
2. **模块的接口**：了解模块对外提供的功能
3. **数据流**：了解数据如何在系统中流动
4. **调用链**：了解函数调用关系
5. **依赖关系**：了解模块间的依赖关系
6. **功能树**：了解功能之间的关系

### 1.2 持久化的目的
1. **避免重复分析**：分析结果持久化后，不需要重复分析
2. **支持增量更新**：当代码变化时，只需要更新变化的部分
3. **支持版本管理**：可以追踪分析结果的变化
4. **支持快速查询**：AI可以快速查询需要的信息

## 2. 持久化数据结构

### 2.1 元数据
```yaml
---
title: 项目分析元数据
version: 1.0
last_updated: YYYY-MM-DD
project_hash: string  # 项目代码的哈希值，用于检测变化
analysis_version: string  # 分析版本
---
```

### 2.2 项目概览数据
```yaml
project_overview:
  name: string
  description: string
  language: string
  type: string
  tech_stack:
    languages: []
    frameworks: []
    dependencies: []
  directory_structure:
    root: string
    children: []
  entry_points:
    main: string
    others: []
  configuration: []
```

### 2.3 功能树数据
```yaml
function_tree:
  functions:
    - id: string
      name: string
      type: string  # core/auxiliary/basic
      description: string
      parent: string
      children: []
      dependencies: []
      module: string
  dependencies:
    - from: string
      to: string
      type: string  # call/data/sequence
      description: string
```

### 2.4 模块关系数据
```yaml
module_relationships:
  modules:
    - id: string
      name: string
      description: string
      path: string
      type: string
      interfaces: []
  dependencies:
    - from: string
      to: string
      type: string
      description: string
  data_flow:
    - from: string
      to: string
      data: string
      description: string
```

### 2.5 接口契约数据
```yaml
interface_contracts:
  apis:
    - id: string
      name: string
      type: string  # REST/GraphQL/RPC/Library
      module: string
      path: string
      signature: string
      parameters: []
      return_value: string
      exceptions: []
  functions:
    - module: string
      name: string
      parameters: []
      return_value: string
      exceptions: []
      description: string
```

### 2.6 数据流数据
```yaml
data_flow:
  models:
    - id: string
      name: string
      fields: []
      description: string
  flows:
    - from: string
      to: string
      data: string
      description: string
  transformations:
    - id: string
      input: string
      output: string
      description: string
  storage:
    - id: string
      type: string
      location: string
      description: string
```

## 3. 持久化格式

### 3.1 文件结构
```
.hyper-designer/projectAnalysis/
├── metadata.yaml              # 元数据
├── project-overview.md        # 项目概览（Markdown格式）
├── project-overview.yaml      # 项目概览（YAML格式，机器可读）
├── function-tree.md           # 功能树（Markdown格式）
├── function-tree.yaml         # 功能树（YAML格式，机器可读）
├── module-relationships.md    # 模块关系（Markdown格式）
├── module-relationships.yaml  # 模块关系（YAML格式，机器可读）
├── interface-contracts.md     # 接口契约（Markdown格式）
├── interface-contracts.yaml   # 接口契约（YAML格式，机器可读）
├── data-flow.md              # 数据流（Markdown格式）
├── data-flow.yaml            # 数据流（YAML格式，机器可读）
└── analysis-report.md        # 最终分析报告（Markdown格式）
```

### 3.2 双格式设计
1. **Markdown格式**：人类可读，便于查看和编辑
2. **YAML格式**：机器可读，便于AI查询和处理

### 3.3 文件关联
1. **Markdown文件**：包含YAML Front Matter，引用YAML文件
2. **YAML文件**：包含完整的数据结构，供AI查询

## 4. 增量更新机制

### 4.1 变化检测
1. **文件哈希**：计算项目文件的哈希值，检测变化
2. **目录结构**：比较目录结构，检测新增和删除
3. **依赖变化**：比较依赖文件，检测依赖变化

### 4.2 增量更新策略
1. **全量更新**：当项目结构发生重大变化时，重新分析
2. **增量更新**：当只有部分文件变化时，只更新变化的部分
3. **智能更新**：使用AI判断需要更新的部分

### 4.3 更新流程
```mermaid
graph TD
  start[开始更新] --> check[检测变化]
  check --> full[全量更新]
  check --> incremental[增量更新]
  
  full --> reanalyze[重新分析]
  incremental --> identify[识别变化部分]
  identify --> update[更新变化部分]
  
  reanalyze --> save[保存结果]
  update --> save
  save --> end[结束]
```

## 5. 版本管理

### 5.1 版本号规则
1. **主版本号**：当分析格式发生重大变化时
2. **次版本号**：当新增分析维度时
3. **修订号**：当修复分析错误时

### 5.2 版本历史
```yaml
version_history:
  - version: "1.0.0"
    date: "2026-03-22"
    changes: "初始版本"
  - version: "1.0.1"
    date: "2026-03-23"
    changes: "修复功能树分析错误"
```

### 5.3 兼容性
1. **向后兼容**：新版本应该兼容旧版本的分析结果
2. **迁移工具**：提供迁移工具，将旧版本迁移到新版本

## 6. AI查询接口

### 6.1 查询类型
1. **项目概览查询**：查询项目基本信息
2. **功能查询**：查询功能信息
3. **模块查询**：查询模块信息
4. **接口查询**：查询接口信息
5. **数据流查询**：查询数据流信息

### 6.2 查询示例
```yaml
query:
  type: "function"
  name: "用户登录"
  
response:
  id: "F001.2"
  name: "用户登录"
  type: "核心"
  description: "用户登录验证"
  parent: "F001"
  children: []
  dependencies: ["F006"]
  module: "UserModule"
  path: "src/modules/user/login.ts"
```

### 6.3 查询API
```yaml
api:
  - endpoint: "/api/analysis/overview"
    method: "GET"
    description: "获取项目概览"
  
  - endpoint: "/api/analysis/functions"
    method: "GET"
    description: "获取功能列表"
    parameters:
      - name: "type"
        type: "string"
        description: "功能类型"
  
  - endpoint: "/api/analysis/modules"
    method: "GET"
    description: "获取模块列表"
  
  - endpoint: "/api/analysis/interfaces"
    method: "GET"
    description: "获取接口列表"
  
  - endpoint: "/api/analysis/data-flow"
    method: "GET"
    description: "获取数据流"
```

## 7. 使用场景

### 7.1 新功能开发
当AI需要开发新功能时：
1. 查询功能树，确定新功能的位置
2. 查询模块关系，确定实现模块
3. 查询接口契约，确定接口设计
4. 查询数据流，确定数据处理方式

### 7.2 功能修改
当AI需要修改功能时：
1. 查询功能树，了解功能依赖关系
2. 查询模块关系，了解模块依赖关系
3. 查询接口契约，了解接口定义
4. 查询数据流，了解数据处理方式
5. 确定修改影响范围

### 7.3 问题调试
当AI需要调试问题时：
1. 查询数据流，追踪数据处理过程
2. 查询接口契约，了解接口定义
3. 查询模块关系，了解模块依赖关系
4. 定位问题所在模块

### 7.4 代码重构
当AI需要重构代码时：
1. 查询模块关系，了解模块依赖关系
2. 查询接口契约，了解接口定义
3. 查询数据流，了解数据处理方式
4. 确定重构影响范围
