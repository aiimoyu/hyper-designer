# HCritic Review Standards

## 判定标准

### 通过标准

**必须同时满足：**
1. 四个维度中没有 ❌ 不通过
2. 高优先级问题数量 = 0
3. 文档结构完整，内容充实
4. 无明显的逻辑错误或遗漏

### 不通过标准

**满足任一条件即为不通过：**
1. 任一维度评分为 ❌ 不通过
2. 存在高优先级问题
3. 缺少必需章节或内容
4. 存在严重的逻辑错误或矛盾

### 有条件通过

**如果满足：**
1. 所有维度评分为 ✅ 通过 或 ⚠️ 有问题
2. 无高优先级问题
3. 中优先级问题数量 ≤ 3

则可以：**有条件通过**，要求在下一阶段前修复中优先级问题。

## 输出规范

**每次审查必须：**
1. 使用结构化格式
2. 明确给出通过/不通过结论
3. 列出具体问题和建议
4. 按优先级排序问题
5. 提供可操作的改进建议

**禁止：**
- 模糊的评价（如"还不错"、"有些问题"）
- 没有具体位置的问题描述
- 没有可操作建议的批评
- 过于主观的意见

## 各阶段审查重点与Skill对应

HCritic审查Workflow各阶段输出时，**必须通过加载对应Skill获取具体的审查检查清单**。以下是Workflow Stage与Skill的对应关系：

### HCritic 审查技能映射总表

| Workflow 阶段 | Stage 标识 | 必须加载的 Skills | Skill 调用指令 |
|--------------|-----------|------------------|---------------|
| **Data Collection** | `dataCollection` | *(无专用Skill)* | *(使用通用审查框架)* |
| **IR Analysis** | `IRAnalysis` | `IR Analysis` | `/IR Analysis` |
| **Scenario Analysis** | `scenarioAnalysis` | `scenario-analysis` | `/scenario-analysis` |
| **Use Case Analysis** | `useCaseAnalysis` | `use-case-analysis` | `/use-case-analysis` |
| **Functional Refinement** | `functionalRefinement` | `functional-refinement` | `/functional-refinement` |
| **Requirement Decomposition** | `requirementDecomposition` | `sr-ar-decomposition` + `ir-sr-ar-traceability` | `/sr-ar-decomposition` + `/ir-sr-ar-traceability` |
| **System Functional Design** | `systemFunctionalDesign` | `functional-design` | `/functional-design` |
| **Module Functional Design** | `moduleFunctionalDesign` | `functional-design` | `/functional-design` |

**使用说明：**
1. **识别Stage**：根据用户请求或workflow状态确定当前审查的阶段
2. **加载Skills**：查表找到对应的Skills，使用slashcommand工具加载（例如：`slashcommand(command="IR Analysis")`）
3. **提取检查清单**：从加载的Skill中提取Quality Checklist和审查要点
4. **执行审查**：按照Skill检查清单+通用四维度（完整性、一致性、可实现性、规范性）进行审查
5. **输出结果**：在审查报告的"问题"部分明确引用违反的Skill检查项

---

### 1. Data Collection (数据采集)
**对应Skill：** *(无专用Skill)*

**审查重点：**
- 数据收集是否完整、准确
- 需求来源是否可靠、可追溯
- 是否包含足够的上下文信息
- 数据格式是否规范统一

**审查方法：**
- 检查收集的数据覆盖度
- 验证数据来源的权威性
- 确认是否包含必要的元数据（时间、来源、收集者）

**注意：** 此阶段无专用Skill，使用通用四维度审查框架即可。

---

### 2. IRAnalysis (初始需求分析)
**对应Skill：** `IR Analysis`

**Skill调用指令：** `/IR Analysis`

**审查重点：**
- **完整性：** 5W2H框架是否完整应用
- **一致性：** 一句话总结是否准确反映5W2H内容
- **可实现性：** 需求是否具体、可验证（避免"性能要好"等模糊描述）
- **规范性：** 是否遵循ir-5w2h-template.md模板

**加载Skill后检查清单：**

- 一句话总结清晰传达核心价值
- Who 涵盖所有关键利益相关者
- What 具体可验证，非抽象描述
- 同一个 IR 内的诉求具有强相关性
- When 明确时间和频率特征
- Why 追溯到业务根源和痛点
- Where 覆盖物理、技术、业务环境
- How Much 包含可衡量的规格约束
- How 描述具体使用方式和流程

**审查示例：**

```markdown
### 1. 完整性 (Completeness)
**问题：**
- 违反IR Analysis Skill检查项"Who 涵盖所有关键利益相关者"：当前IR未识别系统管理员角色
- 违反IR Analysis Skill检查项"What 具体可验证"："系统性能要好"过于抽象，应量化为"API响应时间<200ms"
```

---

### 3. Scenario Analysis (场景分析)
**对应Skill：** `scenario-analysis`

**Skill调用指令：** `/scenario-analysis`

**审查重点：**
- **完整性：** 是否覆盖主场景、备选场景、异常场景
- **一致性：** 场景之间逻辑是否连贯，与IR是否一致
- **可实现性：** 场景描述是否具体可操作
- **规范性：** 是否使用Gherkin语法，格式是否标准

**加载Skill后检查清单：**

- CRUD覆盖：Create/Read/Update/Delete场景是否齐全
- 角色覆盖：每个识别的角色都有对应场景
- 主场景：覆盖最常见的成功路径
- 备选场景：覆盖不同的达成方式
- 异常场景：覆盖网络/权限/数据/业务/资源异常
- 非功能需求：性能/安全/可用性/数据需求已评估
- 场景依赖关系清晰

**审查示例：**

```markdown
### 1. 完整性 (Completeness)
**问题：**
- 违反scenario-analysis Skill检查项"CRUD覆盖"：缺少Delete场景（用户删除通知）
- 违反scenario-analysis Skill检查项"异常场景"：未涵盖网络中断情况下的重连机制
```

---

### 4. Use Case Analysis (用例分析)
**对应Skill：** `use-case-analysis`

**Skill调用指令：** `/use-case-analysis`

**审查重点：**
- **完整性：** 用例规格是否完整（输入、输出、前置条件、后置条件）
- **一致性：** 用例与场景映射是否一致
- **可实现性：** 验收标准是否具体、可测试
- **规范性：** 是否遵循use-case-template.md模板

**加载Skill后检查清单：**

- 每个输入都有类型、来源、约束定义
- 每个输出都有类型、格式、约束定义
- 输入输出都有具体示例
- 主流程步骤清晰、可执行
- 扩展场景覆盖主要变体
- 异常流程覆盖常见错误
- 验收标准具体、可测试（避免"用户体验好"等模糊标准）
- DFX属性有量化指标
- 依赖关系清晰、无循环

**审查示例：**

```markdown
### 3. 可实现性 (Feasibility)
**问题：**
- 违反use-case-analysis Skill检查项"验收标准具体、可测试"："用户体验流畅"无法测试，应改为"通知显示延迟<100ms"
- 违反use-case-analysis Skill检查项"输入约束定义"：未定义通知标题的最大字符数限制
```

---

### 5. Functional Refinement (功能列表梳理)
**对应Skill：** `functional-refinement`

**Skill调用指令：** `/functional-refinement`

**审查重点：**
- **完整性：** 所有用例是否都映射到技术功能
- **一致性：** 前后端职责划分是否清晰合理
- **可实现性：** 复杂度评估是否客观，技术方案是否可行
- **规范性：** 隐性需求识别是否充分

**加载Skill后检查清单：**

- 所有用例都已映射到功能
- 功能按前端/后端/数据库/第三方服务正确分类
- 每个功能都有清晰的隐性需求说明（幂等、日志、监控等）
- 数据校验职责划分明确（前端格式校验 vs 后端业务校验）
- 异步处理功能已识别
- 复杂度评估有依据（实现难度+技术风险+依赖关系+测试难度）
- 功能依赖关系清晰
- 对现有功能的影响已分析
- 安全隐性需求检查：输入验证、输出编码、权限校验、敏感数据加密

**审查示例：**

```markdown
### 4. 规范性 (Conformance)
**问题：**
- 违反functional-refinement Skill检查项"隐性需求识别"：功能"发送通知"缺少幂等性设计（防止重复发送）
- 违反functional-refinement Skill检查项"安全隐性需求"：未明确用户输入的通知内容需要进行XSS防护
```

---

### 6. Requirement Decomposition (需求分解)
**对应Skill：** `sr-ar-decomposition` + `ir-sr-ar-traceability`

**Skill调用指令：** `/sr-ar-decomposition` + `/ir-sr-ar-traceability`

**审查重点：**
- **完整性：** 所有功能需求是否都分解为SR和AR
- **一致性：** IR→SR→AR追溯链是否完整、无断裂
- **可实现性：** AR工作量是否≤0.5K，技术方案是否可行
- **规范性：** 是否使用5W2H描述SR，AR是否参考具体代码位置

**加载Skill后检查清单：**

# sr-ar-decomposition Skill检查项：
- 所有功能需求分解为SRs
- 每个SR使用完整的5W2H描述
- SRs与DDD bounded contexts对齐
- 所有SRs分解为ARs
- 每个AR ≤ 0.5K工作量
- ARs引用具体的实现位置（代码文件/API/函数）
- 团队分配清晰

# ir-sr-ar-traceability Skill检查项：
- 无orphaned SR（无IR支撑的SR）
- 无orphaned AR（无SR支撑的AR）
- 无missing AR（SR已定义但未分配AR）
- 追溯性矩阵完整（IR-SR映射、SR-AR映射清晰）
- 一致性评分 ≥ 80%

**特别要求：**
- 必须执行IR-SR-AR双向追溯性分析
- 生成追溯性矩阵和一致性评分
- 识别过度设计（over-design）和实现缺失（missing implementation）

**审查示例：**

```markdown
### 2. 一致性 (Consistency)
**问题：**
- 违反ir-sr-ar-traceability Skill检查项"无orphaned SR"：发现3个SR无对应IR支撑（SR-007, SR-012, SR-015），可能属于过度设计
- 违反sr-ar-decomposition Skill检查项"AR工作量"：AR-023工作量估算为1.2K，超过0.5K上限，需进一步拆分
```

---

### 7. System Functional Design (系统功能设计)
**对应Skill：** `functional-design`

**Skill调用指令：** `/functional-design`

**审查重点：**
- **完整性：** 架构图是否覆盖所有模块及外部依赖
- **一致性：** 与SR-AR分解中的模块定义是否一致
- **可实现性：** 技术选型是否有权衡记录，架构是否可演进
- **规范性：** 数据模型、接口规范、非功能策略是否完整

**加载Skill后检查清单：**

- 总体架构图覆盖所有模块及外部依赖
- 技术栈选择有权衡记录（选项比较、决策理由、风险评估）
- 关键数据模型已定义并有一致性策略（强一致/最终一致）
- 接口协议和鉴权策略已明确（REST/gRPC/消息）
- 非功能需求已映射到具体实现策略（缓存、限流、降级等）
- 部署与CI/CD流程有说明
- 测试策略覆盖集成、性能与容错
- 风险/权衡记录已保存

**审查示例：**

```markdown
### 1. 完整性 (Completeness)
**问题：**
- 违反functional-design Skill检查项"技术栈权衡记录"：选择WebSocket作为实时通信协议，但未记录与SSE、Long Polling的对比分析
- 违反functional-design Skill检查项"非功能需求映射"：性能需求"支持1000并发用户"未映射到具体的缓存、连接池、负载均衡策略
```

---

### 8. Module Functional Design (模块功能设计)
**对应Skill：** `functional-design`

**Skill调用指令：** `/functional-design`

**审查重点：**
- **完整性：** 模块职责、接口、内部结构、数据结构是否完整
- **一致性：** 与系统功能设计中的模块定义是否一致
- **可实现性：** 接口是否可测试，算法/流程是否清晰
- **规范性：** 是否遵循SOLID原则，设计模式使用是否恰当

**加载Skill后检查清单：**

- 模块职责明确且不与其他模块重叠
- 接口规范包含错误语义、SLA和示例
- 内部组件与类的职责和边界清晰
- 关键算法/流程有伪代码或流程图说明
- 数据模型包含字段、索引和一致性说明
- 单元/集成/性能测试用例覆盖关键场景
- 部署配置和运维检查项已列明
- 遵循SOLID原则
- 设计模式使用恰当且有说明

**审查示例：**

```markdown
### 4. 规范性 (Conformance)
**问题：**
- 违反functional-design Skill检查项"SOLID原则"：NotificationService类违反单一职责原则，同时处理通知发送、日志记录和数据库持久化
- 违反functional-design Skill检查项"接口规范"：sendNotification()接口缺少错误码定义和重试策略说明
```
