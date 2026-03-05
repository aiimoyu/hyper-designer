## 当前阶段：功能细化

**阶段标识**: `functionalRefinement`  
**执行Agent**: HArchitect  
**核心目标**: 从用例输出中提取完整功能列表，按 MoSCoW 方法做优先级排序，并进行 FMEA 风险分析。

### 1. 资料收集

**必须先完成资料收集，再开始执行。**
使用 `HD_TOOL_DELEGATE` 工具委派 HCollector 进行资料收集

#### 所需资料类别

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **系统需求分析资料**<br>(前阶段输出-IR) | 需求信息（需求信息.md） | 必需 | 理解需求背景、约束与业务目标 |
| **系统需求分析资料**<br>(前阶段输出-用例) | 用例文档（{功能名}用例.md） | 必需 | 提取功能清单，建立功能与用例的映射 |
| **系统需求分析资料**<br>(风险参考) | FMEA库、历史故障记录 | 如有则必需 | 风险识别、失效模式分析 |
| **DFX 属性来源**<br>(NFR 资源) | IR 约束、场景需求、用例 DFX 属性 | 必需 | NFR 提取与整合，支持 strictest-metric 规则 |
### 2. 执行规范与 Skill 使用

**核心 Skill**: `functional-refinement`

此 Skill 提供功能提取方法论、MoSCoW 优先级排序指南与 FMEA 风险分析框架。

**核心参考资料**: `.hyper-designer/document/systemRequirementAnalysis/manifest.md`，由 HCollector 生成，包含已收集资料的结构化摘要和引用链接。

**NFR 提取与 SR 映射**: 从 IR 约束、场景需求、用例 DFX 属性中提取非功能需求，应用 strictest-metric 整合规则，并为每个功能分配 SR 编号（SR-NNN 格式），建立可追溯链。
### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **{功能名}功能列表.md** | `.hyper-designer/functionalRefinement/{功能名}功能列表.md` | Markdown，包含：功能分析思路与结果总结（用例到功能的映射）、功能描述（功能内容/功能规则/功能约束/功能影响分析表格/MoSCoW优先级）、SR 映射表、NFR/DFX 汇总表 |
| **{功能名}FMEA.md** | `.hyper-designer/functionalRefinement/{功能名}FMEA.md` | Markdown，FMEA 风险矩阵（失效模式、影响、严重性、发生度、检测度、RPN 与对策） |

#### 审查提示词

```
# 文档审核任务
## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/functionalRefinement/{功能名}功能列表.md` 和 `.hyper-designer/functionalRefinement/{功能名}FMEA.md`
---
## 🔍 审核维度
**参考规范**：请读取 `functional-refinement` skill 文件，理解该文档的撰写规范与模板要求。
在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **功能列表完整性** | 每个用例是否都映射到至少一个功能（新增/修改标注清晰）？是否存在用例覆盖盲区？ | 🔴 Critical |
| **功能描述质量** | 每个功能是否有清晰的功能内容（1-2句话）、业务规则和约束条件？功能影响分析表格是否完整填写？ | 🟡 Major |
| **SR 映射与 NFR 完整性** | SR 映射表是否完整？每个功能是否分配 SR 编号？NFR/DFX 汇总是否从上游输入提取并按 strictest-metric 整合？ | 🔴 Critical |
| **FMEA 风险识别全面性** | 主要失效模式是否列出？RPN 计算是否合理且提出对应缓解措施？ | 🟡 Major |
| **规范性** | 文档结构是否符合 `functional-refinement` skill 定义的模板？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
- 在输出报告前调用 `hd_submit_evaluation` 工具提交评分
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```
