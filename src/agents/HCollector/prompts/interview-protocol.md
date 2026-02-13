# HCollector 访谈委托协议 (Interview Delegation Protocol)

## 1. 协议概述

HCollector 作为 Subagent，无法直接使用 `ask_user` 工具与用户交互。因此采用**访谈委托模式**：

1. **HCollector 定义访谈框架**：设计问题树、路由逻辑、判断条件
2. **主 Agent 执行访谈**：根据框架与用户进行多轮交互
3. **HCollector 分析结果**：接收访谈记录，生成结论并决定下一步

---

## 2. 结构化输入/输出 Schema

### 2.1 输入 Schema (主 Agent → HCollector)

```typescript
{
  "stage": string,                    // 当前阶段名称（如 "dataCollection"）
  "status": "init" | "interview_result",  // 状态类型
  
  // 仅在 status=init 时提供
  "required_assets"?: Array<{
    category: string,
    description: string
  }>,
  
  // 仅在 status=interview_result 时提供
  "interview_result"?: {
    "session_id": string,             // 访谈会话ID（便于追溯）
    "completed": boolean,             // 访谈是否完整完成
    "answers": Array<{
      "question_id": string,          // 问题ID
      "question": string,             // 问题文本
      "answer": string,               // 用户回答
      "timestamp": string             // 回答时间
    }>,
    "notes": string                   // 主 Agent 记录的观察或异常
  }
}
```

### 2.2 输出 Schema (HCollector → 主 Agent)

```typescript
{
  "action": "conduct_interview" | "finish",
  
  // 若 action=conduct_interview，必须提供访谈框架
  "interview_framework"?: {
    "session_id": string,             // 访谈会话ID（用于后续结果追溯）
    "purpose": string,                // 访谈目的说明
    "questions": Array<{
      "id": string,                   // 问题唯一标识（如 "Q1", "Q2.1"）
      "text": string,                 // 问题文本
      "type": "open" | "choice" | "confirm",  // 问题类型
      "choices"?: string[],           // 若 type=choice，提供选项列表
      "required": boolean,            // 是否必答
      "next": string | {              // 下一个问题的路由规则
        "default": string,            // 默认下一个问题ID
        "conditions": Array<{
          "if": string,               // 条件表达式（如 "answer == 'A'"）
          "then": string              // 满足条件时的下一个问题ID
        }>
      }
    }>,
    "start_question": string,         // 起始问题ID
    "guidance": string                // 访谈引导说明（帮助主 Agent 理解访谈目标）
  },
  
  // 若 action=finish，提供最终报告
  "report"?: {
    "summary": string,                // 资料收集总结
    "manifest_path": string,          // 生成的 manifest 文件路径
    "missing_items": Array<{
      "category": string,
      "impact": "high" | "medium" | "low",
      "recommendation": string
    }>
  },
  
  "message": string                   // 对主 Agent 的说明/指示
}
```

---

## 3. 访谈框架设计指南

### 3.1 问题树结构

问题树是一个**有向图**，通过 `next` 字段定义问题之间的流转关系。

**示例：线性访谈**

```json
{
  "questions": [
    {
      "id": "Q1",
      "text": "您是否有现有的系统架构文档？",
      "type": "confirm",
      "required": true,
      "next": "Q2"
    },
    {
      "id": "Q2",
      "text": "请提供文档路径或上传文件",
      "type": "open",
      "required": false,
      "next": "END"
    }
  ],
  "start_question": "Q1"
}
```

**示例：条件分支访谈**

```json
{
  "questions": [
    {
      "id": "Q1",
      "text": "系统类型是什么？",
      "type": "choice",
      "choices": ["Web应用", "移动应用", "桌面应用", "嵌入式系统"],
      "required": true,
      "next": {
        "conditions": [
          { "if": "answer == 'Web应用'", "then": "Q2_web" },
          { "if": "answer == '移动应用'", "then": "Q2_mobile" }
        ],
        "default": "Q2_general"
      }
    },
    {
      "id": "Q2_web",
      "text": "前端技术栈是什么？（React/Vue/Angular/其他）",
      "type": "open",
      "required": true,
      "next": "Q3"
    },
    {
      "id": "Q2_mobile",
      "text": "目标平台是什么？（iOS/Android/跨平台）",
      "type": "open",
      "required": true,
      "next": "Q3"
    },
    {
      "id": "Q2_general",
      "text": "请简要描述技术栈",
      "type": "open",
      "required": false,
      "next": "Q3"
    },
    {
      "id": "Q3",
      "text": "是否有性能基准要求文档？",
      "type": "confirm",
      "required": true,
      "next": "END"
    }
  ],
  "start_question": "Q1"
}
```

### 3.2 条件表达式语法

条件表达式支持简单的逻辑判断：

- **等值判断**：`answer == 'value'`
- **包含判断**：`answer.includes('keyword')`
- **非空判断**：`answer != ''`
- **逻辑与**：`answer == 'A' && previous['Q1'] == 'B'`（引用之前的问题答案）

**注意**：主 Agent 需要实现简单的条件解析器来执行这些规则。

### 3.3 访谈指导原则

**HCollector 在设计访谈框架时应遵循**：

1. **目标导向**：每个问题必须服务于明确的资料收集目标
2. **最小化轮次**：尽量用分支逻辑合并多个场景，避免过长的访谈链
3. **容错设计**：对非必答问题提供 `required: false`，允许用户跳过
4. **清晰指引**：在 `guidance` 中说明访谈目的，帮助主 Agent 理解上下文
5. **结构化选项**：优先使用 `choice` 类型而非开放式问题，提高结果可解析性

---

## 4. 主 Agent 访谈执行流程

主 Agent 收到 HCollector 的 `interview_framework` 后，应执行以下流程：

### 4.1 初始化

1. 读取 `start_question` 确定起始问题
2. 创建访谈记录结构：
   ```typescript
   {
     session_id: string,
     answers: [],
     current_question_id: string
   }
   ```

### 4.2 访谈循环

```
LOOP:
  1. 根据 current_question_id 查找问题定义
  2. 使用 ask_user 向用户提问
  3. 记录用户答案到 answers 数组
  4. 根据 next 规则计算下一个问题ID：
     - 若 next 是字符串，直接使用
     - 若 next 是对象，遍历 conditions 找到匹配项，否则使用 default
  5. 若 next == "END" 或 null，跳出循环
  6. 更新 current_question_id，继续循环
```

### 4.3 结果提交

访谈完成后，调用 HCollector 并传入：

```json
{
  "stage": "...",
  "status": "interview_result",
  "interview_result": {
    "session_id": "...",
    "completed": true,
    "answers": [...],
    "notes": "用户在Q3表示需要更多时间准备文档"
  }
}
```

---

## 5. HCollector 工作流集成

### 状态机修订

| 当前状态 | 触发条件 | 执行动作 | 下一状态 |
| :--- | :--- | :--- | :--- |
| **Init** | `status=init` | 初始化草稿，执行预扫描，生成访谈框架 | **Wait_Interview** |
| **Wait_Interview** | `status=interview_result` | 处理访谈结果，分析资料收集情况 | **Finalizing** 或 **Wait_Interview**（需补充访谈） |
| **Finalizing** | 所有资料项核对完毕 | 生成 Manifest 索引 | **Exit** |

### Step 1: 初始化与预扫描（修订）

在原有的预扫描基础上，额外执行：

1. **分析资料缺口**：对比 `required_assets` 和扫描结果，识别缺失项
2. **设计访谈框架**：
   - 为每个缺失项设计对应的问题
   - 建立问题间的路由关系（如：若用户回答"有文档"则询问路径，若"无"则询问原因）
   - 设置访谈目标和指引
3. **输出访谈委托**：
   ```json
   {
     "action": "conduct_interview",
     "interview_framework": { ... },
     "message": "请根据访谈框架与用户交互，收集以下类别的资料：[列表]"
   }
   ```

### Step 2: 访谈结果处理

收到 `interview_result` 后：

1. **解析答案**：提取关键信息（文件路径、外部链接、用户说明）
2. **更新草稿**：将访谈结果记录到 `draft.md`
3. **评估完整性**：判断是否需要补充访谈
   - **若需要**：生成新的 `interview_framework`，返回 `action: conduct_interview`
   - **若完成**：进入 Finalizing 状态，生成 `manifest.md`

---

## 6. 错误处理与边界情况

### 6.1 用户中断访谈

若主 Agent 在 `interview_result` 中标记 `completed: false`：

- HCollector 应检查已收集的部分答案
- 评估影响，决定是否继续访谈或标记为缺失项

### 6.2 无效答案

若用户回答不符合预期（如选择题给了自定义答案）：

- 主 Agent 应在 `notes` 中记录异常
- HCollector 收到后可设计补充问题澄清

### 6.3 访谈框架过于复杂

若问题树深度超过 10 层或节点超过 30 个：

- HCollector 应拆分为多个 `interview_framework`，分批执行
- 避免单次访谈过长导致用户疲劳

---

## 7. 示例：完整访谈委托流程

### 7.1 HCollector 输出访谈框架

```json
{
  "action": "conduct_interview",
  "interview_framework": {
    "session_id": "interview_001_dataCollection",
    "purpose": "收集系统现有文档和领域知识资料",
    "questions": [
      {
        "id": "Q1",
        "text": "您是否有现有的系统架构文档或设计文档？",
        "type": "confirm",
        "required": true,
        "next": {
          "conditions": [
            { "if": "answer == '是'", "then": "Q1_yes" },
            { "if": "answer == '否'", "then": "Q2" }
          ],
          "default": "Q2"
        }
      },
      {
        "id": "Q1_yes",
        "text": "请提供文档路径或上传文件（可以是本地路径、URL或描述）",
        "type": "open",
        "required": false,
        "next": "Q2"
      },
      {
        "id": "Q2",
        "text": "您是否有领域相关的参考资料？（如行业标准、竞品分析、用户调研报告等）",
        "type": "confirm",
        "required": true,
        "next": {
          "conditions": [
            { "if": "answer == '是'", "then": "Q2_yes" }
          ],
          "default": "Q3"
        }
      },
      {
        "id": "Q2_yes",
        "text": "请提供资料来源（文件路径、网址或简要说明）",
        "type": "open",
        "required": false,
        "next": "Q3"
      },
      {
        "id": "Q3",
        "text": "是否有其他需要我了解的背景信息或限制条件？",
        "type": "open",
        "required": false,
        "next": "END"
      }
    ],
    "start_question": "Q1",
    "guidance": "本次访谈旨在快速定位现有资料和知识缺口，避免后续重复工作。请根据用户回答灵活调整，若用户表示'稍后提供'，可记录为待补充项。"
  },
  "message": "已设计访谈框架，请执行访谈并收集用户回答。访谈目的：收集系统现有文档和领域知识资料。"
}
```

### 7.2 主 Agent 执行访谈

```
[主 Agent 向用户提问 Q1]
User: 有一些设计草稿，但不完整

[主 Agent 记录答案，根据 next 规则判断：answer != '是' 且 != '否'，走 default 路径到 Q1_yes]
[主 Agent 向用户提问 Q1_yes]
User: 草稿在 /docs/draft.md，还有一些手绘图

[继续访谈直到 Q3...]

[最终生成 interview_result]
```

### 7.3 主 Agent 提交结果

```json
{
  "stage": "dataCollection",
  "status": "interview_result",
  "interview_result": {
    "session_id": "interview_001_dataCollection",
    "completed": true,
    "answers": [
      {
        "question_id": "Q1",
        "question": "您是否有现有的系统架构文档或设计文档？",
        "answer": "有一些设计草稿，但不完整",
        "timestamp": "2023-10-27T10:00:00Z"
      },
      {
        "question_id": "Q1_yes",
        "question": "请提供文档路径或上传文件",
        "answer": "草稿在 /docs/draft.md，还有一些手绘图",
        "timestamp": "2023-10-27T10:01:00Z"
      },
      {
        "question_id": "Q2",
        "question": "您是否有领域相关的参考资料？",
        "answer": "否",
        "timestamp": "2023-10-27T10:02:00Z"
      },
      {
        "question_id": "Q3",
        "question": "是否有其他需要我了解的背景信息或限制条件？",
        "answer": "需要兼容老系统的数据格式",
        "timestamp": "2023-10-27T10:03:00Z"
      }
    ],
    "notes": "用户提到手绘图但未提供路径，可能需要后续补充"
  }
}
```

### 7.4 HCollector 分析结果

```json
{
  "action": "finish",
  "report": {
    "summary": "已收集到系统设计草稿（/docs/draft.md）和约束条件（兼容老系统数据格式）。领域参考资料缺失，手绘图待用户补充。",
    "manifest_path": ".hyper-designer/dataCollection/document/manifest.md",
    "missing_items": [
      {
        "category": "Domain Knowledge",
        "impact": "medium",
        "recommendation": "建议后续从公开资料或竞品分析中补充领域知识"
      },
      {
        "category": "Codebase Assets (手绘图)",
        "impact": "low",
        "recommendation": "可通过后续访谈或会议获取，不阻塞当前流程"
      }
    ]
  },
  "message": "资料收集完成，已生成 Manifest 索引。缺失的领域知识建议在后续阶段通过研究补充。"
}
```

---

## 8. 最佳实践

### 8.1 HCollector 设计访谈时

- **先宽后窄**：从高层次确认问题开始，再根据回答深入细节
- **避免过长链条**：单次访谈控制在 5-8 个问题以内
- **提供跳过选项**：非关键问题设置 `required: false`
- **记录假设**：若用户回答模糊，在 `guidance` 中说明如何处理

### 8.2 主 Agent 执行访谈时

- **灵活表述**：根据上下文调整问题措辞，避免机械感
- **及时反馈**：在复杂分支时，向用户说明"根据您的回答，接下来将询问..."
- **异常处理**：若用户拒绝回答或答非所问，在 `notes` 中详细记录

### 8.3 迭代改进

- 若第一次访谈结果不理想，HCollector 可以生成**补充访谈框架**
- 使用 `session_id` 区分不同批次的访谈，便于追溯
