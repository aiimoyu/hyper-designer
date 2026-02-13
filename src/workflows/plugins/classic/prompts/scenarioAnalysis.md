## 当前阶段：场景分析

**阶段标识**: `scenarioAnalysis`  
**执行Agent**: HArchitect  
**核心目标**: 识别系统参与者、分析业务场景（主场景/备选场景/异常场景），生成功能场景文档。

### 1. 输入与资料收集

**在开始执行前，必须通过委派 HCollector subagent 完成资料收集。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **系统需求分析资料**<br>(前阶段输出) | `需求信息.md` | 必需 | 理解需求背景、目标与约束 |
| **领域资料**<br>(业务流程) | 业务流程图、操作手册 | 如有则必需 | 理解现有业务场景与操作流程 |
| **系统需求分析资料**<br>(场景参考) | 用户场景、使用案例 | 可选 | 参考类似系统的场景描述 |
| **领域资料**<br>(用户角色) | 用户画像、角色权限定义 | 必需 | 识别Actor及其职责边界 |

**资料收集流程**：

1. **准备 HCollector 输入**：
   ```json
   {
     "stage": "scenarioAnalysis",
     "status": "init",
     "required_assets": [
       { "category": "系统需求分析资料", "description": "理解需求背景、目标与约束（前阶段输出：需求信息.md）" },
       { "category": "领域资料(业务流程)", "description": "理解现有业务场景与操作流程（业务流程图、操作手册）" },
       { "category": "系统需求分析资料(场景参考)", "description": "参考类似系统的场景描述（用户场景、使用案例）" },
       { "category": "领域资料(用户角色)", "description": "识别Actor及其职责边界（用户画像、角色权限定义）" }
     ]
   }
   ```

2. **委派 HCollector**：使用 `task` 工具调用 HCollector subagent 进行资料收集。

3. **多轮交互**：HCollector 将通过 JSON 响应请求与用户交互，你需要作为中继代理传递问答，直到 HCollector 返回 `action="finish"`。

4. **收集完成**：HCollector 将自动生成 `.hyper-designer/scenarioAnalysis/document/manifest.md` 和 `draft.md`。

详细的委派和交互协议请参见 **"单阶段处理流程 Step 2"**。

### 2. 执行规范与 Skill 使用

**核心 Skill**: `scenario-analysis`

此 Skill 提供场景识别方法论、参与者分析指南，帮助系统化地识别和分析主场景、备选场景与异常场景。

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **{功能名}场景.md** | `.hyper-designer/scenarioAnalysis/{功能名}场景.md` | Markdown，包含主场景、备选场景、异常场景 |

### 4. 质量审查

**审核标准:**

1. **完整性**: 主场景、备选场景、异常场景是否覆盖完整？是否存在遗漏的关键路径？
2. **一致性**: Actor 定义是否清晰，各场景间的Actor行为是否一致且无矛盾？
3. **可追溯性**: 场景与需求信息是否对应？每个场景能否追溯到具体的业务目标？
4. **规范性**: 场景描述是否符合 `scenario-analysis` skill 定义的模板？