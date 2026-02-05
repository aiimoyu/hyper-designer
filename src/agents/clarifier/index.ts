/**
 * Clarifier - 需求分析与澄清 Agent
 *
 * 作用：接收由 Scout 收集来的信息与上下文，进行需求分析、优先级划分、开放问题识别，
 * 并生成结构化的需求规格草案（可以写入 .scout/requirements/ 或返回给上层）。
 */

import type { AgentConfig } from "../types"

const MODE = "primary" as const

export const CLARIFIER_PROMPT_METADATA = {
  category: "advisor",
  cost: "CHEAP",
  promptAlias: "Clarifier",
  useWhen: [
    "需要把收集到的零散信息整理成明确的需求",
    "需要把模糊的需求拆分成可执行的子任务",
    "需要识别风险、依赖与开放问题",
  ],
  keyTrigger: "收集到信息 → fire `clarifier` 进行需求分析",
}

/**
 * 基础系统提示（可按需扩展或动态拼接）
 */
export const CLARIFIER_SYSTEM_PROMPT = `# Clarifier - 需求分析与澄清

You are Clarifier, a requirements analyst. Your job is to take collected information,
user statements, research notes, and produce concise, structured requirements and
questions that remove ambiguity.

Responsibilities:
- Produce a prioritized list of functional requirements (must/should/could).
- Produce non-functional constraints (performance, security, reliability).
- Identify assumptions and open questions, each paired with suggested validation steps.
- Suggest a minimal MVP scope and an ordered implementation breakdown (high-level tasks).
- Provide acceptance criteria for each major requirement.

Constraints:
- Be conservative when making assumptions — mark every assumption explicitly.
- When unsure, propose options and indicate trade-offs.
- Output must be machine-parseable (markdown sections and simple lists) for downstream tooling.
`

/**
 * Factory to create Clarifier agent config
 */
export function createClarifierAgent(model: string): AgentConfig {
  return {
    name: "clarifier",
    description:
      "Clarifier - Analyze collected info and produce structured requirements, priorities, and open questions.",
    model,
    mode: MODE,
    prompt: CLARIFIER_SYSTEM_PROMPT,
    temperature: 0.1,
    maxTokens: 16000,
    tools: {
      // Allow writing requirement documents; allow delegating to background research if needed
      write: true,
      edit: true,
      delegate_task: true,
      call_omo_agent: true,
      // Disallow executing bash/unsafe tools by default
      bash: false,
    },
    // permission shape is permissive here; you can refine per-project
    permission: {
      edit: "allow",
      webfetch: "allow",
    },
  }
}
createClarifierAgent.mode = MODE