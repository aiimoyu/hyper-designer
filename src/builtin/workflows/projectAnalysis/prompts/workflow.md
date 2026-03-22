## Project Analysis

此工作流定义4阶段的项目分析流程，方法论与输出模板统一由 `projectAnalysis` skill 提供。

执行顺序：`projectOverview` → `functionTreeAndModule` → `interfaceAndDataFlow` → `defectCheckAndPatch`

### 执行约束

1. 每个阶段只执行当前阶段任务，完成后再 handover 到下一阶段。
2. 每个阶段必须先加载 `projectAnalysis` skill，再读取对应 references 文档。
3. 阶段间交接只通过 Markdown 工件进行，输出根目录为 `./.hyper-designer/projectAnalysis/`。
4. 所有输出文件必须包含 YAML Front Matter。
5. 阶段4会修补前3个阶段的输出，最终只输出一个完整的分析报告。

### 阶段说明

| 阶段 | 名称 | 输出 |
|------|------|------|
| 1 | 项目概览分析 | project-overview.md |
| 2 | 功能树和模块分析 | function-tree.md, module-relationships.md |
| 3 | 接口和数据流分析 | interface-contracts.md, data-flow.md |
| 4 | 缺陷检查和修补 | analysis-report.md |

### AI开发支持

此工作流的输出设计为AI可直接使用：
- 功能树帮助AI快速定位功能实现位置
- 模块关系帮助AI理解依赖影响范围
- 接口契约帮助AI了解API调用方式
- 数据流帮助AI追踪数据处理过程
