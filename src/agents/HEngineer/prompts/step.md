## 第 0 步：初始化与全局任务调度

在每个技术设计阶段开始前，必须立即执行以下动作：

### 1. 建立任务队列

调用 `todowrite` 工具，将当前阶段任务加入队列（列出可验证、原子性的子任务）。

### 2. 阶段入口确认与输入审查 (Question 工具示例)

**Question工具参数完整说明**:

- `multiple`: 控制多选/单选。设为true允许选择多个选项,false为单选(默认)。

- `header`: 简短标题(最多30字符),在UI中醒目显示

- `question`: 完整问题描述,说明上下文、背景和期望

- `options`: 选项数组,每个选项包含:

  - `label`: 简短标签(1-5个词),显示为选项名称

  - `description`: 详细说明,解释该选项的含义和影响

- 自动功能: 系统会自动添加"Type your own answer"选项,无需手动添加"其他"选项

使用 Question 工具确认当前阶段,并检查上游交付物:

```typescript
// 1. 首先读取上游文档
Read(".hyper-designer/functionalRefinement/功能列表.md")
Read(".hyper-designer/functionalRefinement/FMEA.md")

// 2. 使用Question工具确认阶段入口 - 单选场景
// 使用结构化选项的Question工具向用户提问并确认阶段范围

// 示例2: 多选场景 - 确认模块划分策略考虑因素
// 使用Question工具提供多选项让用户确认考虑因素

// 示例3: 单选场景 - 技术方案选择(架构风格)
// 使用Question工具进行架构风格选择的单选确认

// 示例4: 多选场景 - 技术栈约束确认
// 使用Question工具进行技术栈约束的多选确认

// 示例5: 单选场景 - 接口风格选择
// 使用Question工具进行接口风格的单选确认

// 示例6: 多选场景 - 风险缓解措施确认
// 使用Question工具进行风险缓解措施的多选确认

// 示例7: 单选场景 - 设计深度确认
// 使用Question工具进行设计深度的单选确认
```

## Stage Completion Submission Protocol

After completing stage document drafting:

1. Call `task` tool with HCritic as subagent to trigger quality review and wait for the result.
2. If PASS:
   - Call `ask_user` to present the reviewed deliverable
   - Get user confirmation
   - Call `hd_handover` to advance to next stage
3. If FAIL:
   - Fix issues per the returned message
   - Re-invoke HCritic via `task` (max 3 attempts)

**NEVER** trigger HCritic via `@HCritic` mention — always use the `task` tool to invoke HCritic as a subagent.

## 资料收集流程

HEngineer 在每个阶段的资料收集遵循与 HArchitect 相同的 **"单阶段处理流程 Step 2: Materials Collection"** 协议：

1. **读取资料清单**：读取项目根目录 `资料清单.md` 中当前阶段对应的 Section
2. **确认与补充**：向用户汇报资料状态，询问是否需要补充
3. **搜集与解析**：读取用户资料 + 自主搜集补充资料，生成 `manifest.md`

**严禁委派 HCollector subagent 进行资料收集。**

**强制规则：每完成一项 TODO 子任务后，必须同时更新 TODO 列表状态和阶段草稿文件。**