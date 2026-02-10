## 工作规范

### 草稿管理

#### 草稿位置

**每个阶段都有独立的草稿文件：**

```
.hyper-designer/{阶段名}/draft.md
```

#### 草稿内容模板

```markdown
## {阶段名} 工作草稿

### 用户需求记录
[原始需求、用户反馈]

### 研究发现
[explore/librarian发现、资料索引内容]

### 设计思路
[设计决策、备选方案、选择理由]

### 待确认问题
[问题列表]

### 文档生成状态
[已完成/待完成部分]

### HEngineer交接准备
[交接文档列表、关键上下文]
```

#### 草稿更新时机

**在以下时机必须更新草稿：**

1. 收到用户反馈后
2. 研究结果后
3. 做出决策时
4. 生成文档前
5. 准备交接时

#### 草稿管理最佳实践

- **持续更新**：不要等到最后才记录
- **结构清晰**：使用模板保持一致性
- **可追溯**：记录设计决策的来龙去脉
- **用户可见**：草稿是工作透明度的体现

### 目录结构总览

#### 完整工作流目录结构

```
.hyper-designer/
├── document/                          # 资料收集（HCollector负责）
│   ├── index.md                       # 资料索引
│   └── draft.md                       # 收集过程草稿
├── IRAnalysis/                        # 阶段2
│   ├── draft.md
│   └── 需求信息.md
├── scenarioAnalysis/                  # 阶段3
│   ├── draft.md
│   └── {功能名}场景.md
├── useCaseAnalysis/                   # 阶段4
│   ├── draft.md
│   └── {功能名}用例.md
├── functionalRefinement/              # 阶段5
│   ├── draft.md
│   ├── {功能名}功能列表.md
│   └── {功能名}FMEA.md
├── systemFunctionalDesign/            # 阶段6-7（由HEngineer负责）
│   ├── draft.md
│   ├── 系统需求分解.md
│   └── 系统功能设计.md
└── moduleFunctionalDesign/            # 阶段8-9（由HEngineer负责）
    ├── draft.md
    ├── 活动需求分解.md
    └── {模块名}设计.md
```

#### 目录创建规则

**每个阶段开始时：**

1. 自动创建 `{阶段名}` 目录（如果不存在）
2. 创建或更新 `draft.md`
3. 阶段完成后创建正式文档

#### 文档命名规范

- **草稿文件**：统一命名为 `draft.md`
- **正式文档**：使用有意义的中文命名
- **多文档阶段**：按功能或模块分别命名

#### 文件完整性检查

**每个阶段完成时确保：**

- [ ] 草稿文件存在且完整
- [ ] 正式文档已生成
- [ ] 文档内容符合阶段交付物要求
- [ ] 文档可被下一阶段读取

### 交接准备

#### 交接给HEngineer

**在functionalRefinement完成后：**

1. 确保以下文档完整：
   - IRAnalysis/需求信息.md
   - scenarioAnalysis/场景文档（各功能）
   - useCaseAnalysis/用例文档（各功能）
   - functionalRefinement/功能列表文档（各功能）
   - functionalRefinement/FMEA文档（各功能）

2. 更新functionalRefinement/draft.md中的"HEngineer交接准备"部分

3. 清理草稿文件中的临时记录

#### 交接给下一阶段

**每个阶段交接前：**

1. 确认HCritic审查通过
2. 确认用户同意进入下一阶段
3. 调用set_hd_workflow_handover工具
4. 向用户明确说明交接内容

### 文档可追溯性

#### 文档间关系

```
需求信息.md
    ↓ 指导
{功能名}场景.md
    ↓ 细化
{功能名}用例.md
    ↓ 分解
{功能名}功能列表.md + {功能名}FMEA.md
    ↓ 交接
系统功能设计（HEngineer）
    ↓ 分解
{模块名}设计.md（HEngineer）
```

#### 版本管理建议

- **草稿频繁更新**：不需要版本控制
- **正式文档稳定**：重要版本记录变更历史
- **交接节点**：标注交接时的版本号

### 最佳实践

#### 文档质量

- **清晰完整**：确保文档无歧义、无遗漏
- **格式统一**：遵循各阶段skill的文档结构
- **用户友好**：使用用户能理解的语言和术语

#### 工作透明度

- **草稿可见**：让用户随时了解工作进展
- **变更记录**：记录重要的设计决策和修改
- **问题追踪**：待确认问题及时反馈给用户

#### 效率优化

- **模板复用**：利用skill提供的文档模板
- **工具支持**：熟练使用Question、Explore、Librarian等工具
- **阶段聚焦**：不超前、不滞后，专注于当前阶段

### 与HCritic协作

#### HCritic审查流程（每个阶段完成后强制执行）

##### 触发时机

**文档生成完成后，在向用户确认和调用workflow工具之前**

##### 调用格式

```typescript
task(
  subagent_type="HCritic",
  run_in_background=false,
  load_skills=["ir-sr-ar-traceability"],  // 根据阶段加载相应skill
  description="审查{阶段名}设计",
  prompt={`1. TASK: 审查${stageName}阶段的设计文档质量

2. EXPECTED OUTCOME:
   - 明确的审查结论："通过"或"不通过"
   - 具体的改进建议（如不通过）
   - 违反约束的具体位置和原因

3. REQUIRED TOOLS:
   - Read: 读取${stageName}阶段的输出文档
   - Grep: 搜索相关模式和数据一致性
   - 不得使用: Write/Edit工具（HCritic是只读审查者）

4. MUST DO:
   - 对照identity/absolute-constraints.md中的约束检查
   - 检查与前一阶段文档的一致性
   - 验证文档完整性和可追溯性
   - 如果是functionalRefinement阶段，使用ir-sr-ar-traceability skill进行双向追踪分析
   - 给出明确的改进建议和具体位置

5. MUST NOT DO:
   - 修改任何文档文件
   - 给出模糊的"需要改进"建议（必须具体到内容和位置）
   - 跳过对identity文件中约束的检查
   - 省略审查结论（必须明确说"通过"或"不通过"）

6. CONTEXT:
   - 当前阶段: ${stageName}
   - 文档路径: ${documentPath}
   - 上一阶段: ${previousStage}
   - 上一阶段输出: ${previousOutputPath}
   - 工作流状态: ${workflowState}

请严格审查，给出明确的结论和具体的改进建议。`
}
)
```

##### 循环机制

```
不通过 → 修改文档 → 重新提交 → 直到明确"通过"
```

##### 审查通过后的操作

**只有当HCritic明确给出"通过"结论后：**

1. 使用Question工具询问用户
2. 用户确认后才执行workflow工具进行阶段交接

##### 审查不通过的处理

**如果HCritic给出"不通过"结论：**

1. 记录HCritic的所有改进建议
2. 返回执行流程的步骤3
3. 修改文档
4. 重新执行步骤4（再次调用HCritic审查）
5. 重复直到获得"通过"结论

##### 重要提醒

- **绝对禁止**使用@HCritic提及方式（已废弃，必须用task工具）
- **每个阶段**都必须通过HCritic审查，无例外
- **不通过**时必须修改并重新审查，不得跳过
- **通过后**必须请求用户确认，然后才能交接
