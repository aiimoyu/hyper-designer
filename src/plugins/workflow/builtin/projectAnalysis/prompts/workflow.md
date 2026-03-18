## Project Analysis

此工作流仅定义步骤顺序与阶段目标，方法论与输出模板统一由 `projectAnalysis` skill 提供。

执行顺序：`systemAnalysis` → `componentAnalysis` → `missingCoverageCheck`

### 执行约束

1. 每个阶段只执行当前阶段任务，完成后再 handover 到下一阶段。
2. 每个阶段必须先加载 `projectAnalysis` skill，再读取对应 references 文档。
3. 阶段间交接只通过 Markdown 工件进行，输出根目录为 `./.hyper-designer/projectAnalysis/`。
