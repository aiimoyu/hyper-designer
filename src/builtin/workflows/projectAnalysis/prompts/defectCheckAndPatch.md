## Current Phase: Defect Check and Patch

请按以下流程执行当前阶段：

1. 加载 skill：`projectAnalysis`
2. 读取共享参考文档：`references/workflowShared.md`
3. 读取阶段参考文档：`references/defectCheckAndPatch.md`
4. 严格依据该 references 文档完成阶段输出

输出目录统一使用：`./.hyper-designer/projectAnalysis/`
输入基线文件：
- `./.hyper-designer/projectAnalysis/project-overview.md`
- `./.hyper-designer/projectAnalysis/function-tree.md`
- `./.hyper-designer/projectAnalysis/module-relationships.md`
- `./.hyper-designer/projectAnalysis/interface-contracts.md`
- `./.hyper-designer/projectAnalysis/data-flow.md`

### 本阶段目标

检查分析完整性，修补前几个阶段的输出，生成最终报告。

### 重要说明

本阶段会：
1. 检查前3个阶段输出的完整性
2. 检查前3个阶段输出的一致性
3. 识别并修补缺陷
4. 生成最终分析报告

### 输出文件

- `analysis-report.md` - 最终分析报告（包含YAML Front Matter）
