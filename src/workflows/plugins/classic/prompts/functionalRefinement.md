## 当前阶段：功能细化

**阶段标识**: `functionalRefinement`  
**执行Agent**: HArchitect  
**核心目标**: 从用例输出中提取完整功能列表，按 MoSCoW 方法做优先级排序，并进行 FMEA 风险分析。

### 1. 输入与资料收集

**在开始执行前，必须通过委派 HCollector subagent 完成资料收集。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **系统需求分析资料**<br>(前阶段输出) | 用例文档（{功能名}用例.md） | 必需 | 提取功能清单，建立功能与用例的映射 |
| **系统需求分析资料**<br>(风险参考) | FMEA库、历史故障记录 | 如有则必需 | 风险识别、失效模式分析 |
| **领域资料**<br>(业务优先级) | 产品经理优先级、商业目标 | 参考用 | 辅助 MoSCoW 排序决策 |

**资料收集流程**：

1. **准备 HCollector 输入**：
   ```json
   {
     "stage": "functionalRefinement",
     "status": "init",
     "required_assets": [
       { "category": "系统需求分析资料(前阶段输出)", "description": "提取功能清单，建立功能与用例的映射（用例文档）" },
       { "category": "系统需求分析资料(风险参考)", "description": "风险识别、失效模式分析（FMEA库、历史故障记录）" },
       { "category": "领域资料(业务优先级)", "description": "辅助 MoSCoW 排序决策（产品经理优先级、商业目标）" }
     ]
   }
   ```

2. **委派 HCollector**：使用 `task` 工具调用 HCollector subagent 进行资料收集。

3. **多轮交互**：HCollector 将通过 JSON 响应请求与用户交互，你需要作为中继代理传递问答，直到 HCollector 返回 `action="finish"`。

4. **收集完成**：HCollector 将自动生成 `.hyper-designer/functionalRefinement/document/manifest.md` 和 `draft.md`。

详细的委派和交互协议请参见 **"单阶段处理流程 Step 2"**。

### 2. 执行规范与 Skill 使用

**核心 Skill**: `functional-refinement`

此 Skill 提供功能提取方法论、MoSCoW 优先级排序指南与 FMEA 风险分析框架。

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **{功能名}功能列表.md** | `.hyper-designer/functionalRefinement/{功能名}功能列表.md` | Markdown，按 MoSCoW 分类，包含每项功能描述、验收标准、关联用例 |
| **{功能名}FMEA.md** | `.hyper-designer/functionalRefinement/{功能名}FMEA.md` | Markdown，FMEA 风险矩阵（失效模式、影响、严重性、发生度、检测度、RPN 与对策） |

### 4. 质量审查

**审核标准:**

1. **功能列表完整性**: 每个用例是否被映射到至少一个功能？是否存在用例覆盖盲区？
2. **优先级合理性**: MoSCoW 分类是否有业务依据？关键路径功能是否位于 Must / Should？
3. **FMEA 风险识别全面性**: 主要失效模式是否列出？RPN 计算是否合理且提出对应缓解措施？
4. **规范性**: 文档结构是否符合 `functional-refinement` skill 定义的模板？

