## 单阶段处理流程

### 🔥 CRITICAL PROTOCOL: 8-Step Pipeline

**严令：每个阶段必须严格遵循以下 8 步流程，禁止跳过或合并步骤。**

```
Step 1: Drafting & Planning (use specific skills)
Step 2: Materials Collection (delegate to HCollector)
Step 3: Context Loading
Step 4: Execution & Interaction -> Loop until done
Step 5: HCritic Review -> If failed, back to Step 4
Step 6: User Confirmation -> If modify, back to Step 4
Step 7: Handover
Step 8: Idle State
```

**其中强制执行循环**

**强制规则：每完成一项 TODO 子任务后，必须同时更新 TODO 列表和阶段草稿文件。**

```mermaid
graph TD
    A[生成文档] --> B[自动触发HCritic审查]
    B --> C{审核结果}
    C -- 未通过 --> D[根据反馈修正文档]
    D --> B
    C -- 通过 --> E[向用户汇报结果]
    E --> F{用户确认}
    F -- 确认 --> G[调用workflow工具进入下一阶段]
    F -- 需修改 --> D
```

### Step 1: Drafting & Planning

**🎯 Goal:** 载入领域skill，明确阶段目标，建立可追踪的任务清单。

**✅ Actions:**

1. **Load Skills**: 载入当前阶段依赖的 specific skills。
2. **Init Draft**: 创建或更新阶段草稿文件 `.hyper-designer/{stage_name}/draft.md`。
3. **Create TODO**: 调用 `todowrite` 工具，生成原子化的 TODO 列表。
    * 要求：每个 TODO 项必须是可验证的、具体的子任务。
    * 示例：❌ "完成需求分析" -> ✅ "分析用户认证模块的输入输出定义"。

**🚫 Prohibitions:**

* 禁止跳过草稿直接执行。
* 禁止 TODO 项过于笼统模糊。

### Step 2: Materials Collection (委派 HCollector)

**🎯 Goal:** 委派 HCollector 完成资料收集，确保必需资料完备。

**✅ Actions:**

1. **调用 HCollector**: 使用 `task` 工具委派 HCollector，传入当前阶段名和所需资料类别。
2. **状态循环**: 根据 HCollector 返回状态进行交互处理。
3. **确认完成**: 当 HCollector 返回 `COMPLETED` 状态，确认资料已就绪，进入 Step 3。

### Step 3: Context Loading

**🎯 Goal:** 获取必要的上下文记忆。

**✅ Actions:**

1. **Read Manifest**: 读取 `.hyper-designer/{stage}/document/manifest.md` 获取参考资料索引（`{stage}` 为当前阶段名称）。
2. **Load History**: 读取上一阶段的输出件，对齐当前状态。

### Step 4: Execution & Interaction

**🎯 Goal:** 深度协作完成任务，**严格遵守 Human-in-the-Loop 原则**。

**✅ Actions:**

1. **Iterate TODO**: 按清单逐项执行。
2. **Micro-Confirmation**:
    * **关键规则**：每完成一个原子步骤，必须使用 `ask_user` 工具确认。
    * **禁止**：连续执行多个步骤而不交互，或擅自进入 `idle` 状态。
3. **Research**: 必要时调用 `explore`/`librarian` 进行深度研究。
4. **Update Draft**: 实时更新草稿文件，记录决策过程。
5. **Generate Output**: 生成正式交付文档。

### Step 5: HCritic Review

**🎯 Goal:** 强制质量门控，确保输出符合标准。

**✅ Actions:**

1. **Notify User**: "正在提交 HCritic 进行专业审查..."
2. **Invoke Agent**: 使用 `task` 工具调用 `HCritic` agent (参考 "与 HCritic 协作" 章节)。
3. **Process Feedback**:
    * **Status: REJECTED** -> 返回 **Step 4** 修正，修正后重回 **Step 5**。
    * **Status: MINOR_ISSUES** -> 修正后重回 **Step 5** 确认。
    * **Status: PASSED** -> 进入 **Step 6**。

### Step 6: User Confirmation

**🎯 Goal:** 获得用户明确授权，作为阶段切换的守门员。

**✅ Actions:**

1. **Prerequisite**: 仅在 HCritic 审查通过后执行。
2. **Final Check**: 使用 `ask_user` 工具询问：“本阶段工作已完成，是否进入下一阶段？”
3. **Handle Response**:
    * **"修改"** -> 返回 **Step 4** 调整，随后重新执行评审流程。
    * **"确认"** -> 进入 **Step 7**。

### Step 7: Handover

**🎯 Goal:** 触发工作流状态流转。

**✅ Actions:**

1. **Execute Handover**: 调用 `set_hd_workflow_handover`，设置 `handover` 状态为下一阶段名称。
2. **Notify**: "阶段交接完成，正在激活下一阶段: {Next Stage Name}"。

### Step 8: Idle State

**🎯 Goal:** 结束当前回合，等待系统调度。

**✅ Actions:**

1. **Terminate**: 完成上述步骤后自然结束。
2. **Wait**: 系统将自动加载下一阶段 Skill，等待新指令。
