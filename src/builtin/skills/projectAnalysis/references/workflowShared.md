# Project Analysis Workflow Shared Reference

## 术语表

| 术语 | 定义 |
|------|------|
| **目标项目 (Target Project)** | 被分析的外部项目（在阶段1提供路径） |
| **分析根目录 (Analysis Root)** | 目标项目中的 `./.hyper-designer/projectAnalysis/` 目录 |
| **功能 (Function)** | 系统提供的业务功能，按层次组织成功能树 |
| **模块 (Module)** | 具有清晰职责边界的代码逻辑单元 |
| **接口 (Interface)** | 模块对外提供的API或函数 |
| **数据流 (Data Flow)** | 数据在系统中的流动过程 |

---

## 输出文件约定（纯 Markdown + YAML Front Matter）

所有分析工件以纯 Markdown 格式输出，使用 YAML Front Matter 存储元数据。

### 输出目录结构

```
.hyper-designer/projectAnalysis/
├── project-overview.md          # 阶段1：项目概览（基本信息、技术栈、目录结构、入口点）
├── function-tree.md             # 阶段2：功能树（功能层次、依赖、模块映射）
├── module-relationships.md      # 阶段2：模块关系（模块清单、依赖、接口、数据流）
├── interface-contracts.md       # 阶段3：接口契约（API清单、函数签名、错误契约）
├── data-flow.md                 # 阶段3：数据流（数据模型、流图、转换、存储）
└── analysis-report.md           # 阶段4：最终报告（完整性检查、缺陷、修补说明）
```

### Markdown 驱动的交接

所有阶段通过 `.md` 文件交换数据。下游阶段不得重新扫描源代码，必须使用上游阶段生成的 Markdown 文件作为唯一事实来源。各文件用途：

- `project-overview.md`：阶段2的项目基础参照
- `function-tree.md`：阶段3的功能参照
- `module-relationships.md`：阶段3的模块参照
- 所有文件：阶段4的检查和修补对象

---

## YAML Front Matter 约定

每个 Markdown 文件必须包含 YAML Front Matter：

```yaml
---
title: 文档标题
version: 1.0
last_updated: YYYY-MM-DD
type: document_type
sections:
  - section1
  - section2
metadata:
  key: value
---
```

### 元数据字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| title | string | 是 | 文档标题 |
| version | string | 是 | 文档版本号 |
| last_updated | date | 是 | 最后更新日期 |
| type | string | 是 | 文档类型标识 |
| sections | array | 是 | 文档包含的章节列表 |
| metadata | object | 否 | 额外元数据 |

---

## Mermaid 图表约定

### 支持的图表类型

| 类型 | 用途 | 适用阶段 |
|------|------|----------|
| `graph TD` | 层次结构、目录结构、功能树 | 全部 |
| `graph LR` | 流程、依赖、数据流 | 全部 |
| `sequenceDiagram` | 调用序列 | 阶段3 |
| `classDiagram` | 接口结构 | 阶段3 |
| `stateDiagram` | 状态机、生命周期 | 可选 |
| `erDiagram` | 数据库模式、实体关系 | 可选 |

### 图表命名规则

每个图表必须有描述性标题。

### 节点命名约定

- 文件和模块：使用相对于目标项目根目录的完整路径
- 功能：使用功能ID（如 F001）
- 模块：使用模块ID（如 M001）
- 层级：使用标准层级名称

### 边类型

| 边类型 | 样式 | 含义 |
|--------|------|------|
| 直接依赖 | `-->` | 标准依赖 |
| 弱依赖 | `-.->` | 可选或间接 |
| 双向 | `<-->` | 循环依赖（警告） |
| 数据流 | `==>` | 数据移动 |
| 控制流 | `-->` | 执行顺序 |

### 图表大小限制

- 最大节点数：50
- 最大边数：100
- 最大嵌套深度：5层

超出限制时拆分为多个图表并编号。

---

## 代码引用规则

所有分析工件必须使用标准化引用格式引用源代码。

### 引用格式

- 行内引用：`[File: 相对路径/文件.ts:行范围]`
- 函数引用：`[Function: 函数名 in File: 相对路径/文件.ts:行范围]`
- 类引用：`[Class: 类名 in File: 相对路径/文件.ts:行范围]`

### 引用规则

1. 使用相对路径，禁止机器绝对路径
2. 行内引用必须包含行范围
3. 引用最小相关单元，避免过宽引用
4. 所有引用必须指向实际存在的文件
5. 避免逐行过度引用，按代码单元引用
6. 多个相关引用应分组展示

---

## 工作流行为说明

### 非阻塞验证模式

阶段4的缺陷检查是诊断工具，不会阻止工作流推进。

### 增量分析支持

工件支持恢复/重新运行。若现有 Markdown 文件有效，可复用并进行增量补全。

### 可扩展性支持

所有文档格式支持后续扩展，新增功能时只需要在相应章节添加内容，无需重构整体结构。

### AI开发支持

分析结果设计为AI可直接使用：
- 功能树帮助AI快速定位功能实现位置
- 模块关系帮助AI理解依赖影响范围
- 接口契约帮助AI了解API调用方式
- 数据流帮助AI追踪数据处理过程
