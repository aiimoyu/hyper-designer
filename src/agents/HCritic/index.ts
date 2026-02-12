/**
 * HCritic 代理模块
 * 
 * 设计质量门和评审代理，负责：
 * 1. 在 HArchitect/HEngineer 完成任何阶段文档后必须调用
 * 2. 提供结构化质量评估（完整性、一致性、可行性、符合性）
 * 3. 使用阶段特定的检查清单进行技能驱动的评审
 * 4. 在标记工作流阶段完成之前进行只读评审
 */

import type { AgentPromptMetadata } from "../types"
import type { AgentDefinition } from "../factory"
import { filePrompt, toolsPrompt } from "../factory"
import type { RuntimeType } from "../../tools"
import { createAgent } from "../factory"
import { join } from "path"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export const HCRITIC_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HCritic",
  keyTrigger: "MANDATORY review after completing any workflow stage document - ensures quality before proceeding to next stage",
  triggers: [
    { domain: "Quality Gate", trigger: "After HArchitect/HEngineer completes any stage document (IR, Scenario, UseCase, SR-AR, Design)" },
    { domain: "Design Review", trigger: "Before marking workflow stage as complete - verify document passes all quality criteria" },
    { domain: "Iterative Improvement", trigger: "Document failed previous review and needs re-validation after fixes" },
  ],
  useWhen: [
    "HArchitect/HEngineer just finished writing IR信息.md, 功能场景.md, 用例.md, etc.",
    "About to mark a workflow stage as complete (set_hd_workflow_stage)",
    "Need structured feedback on document completeness, consistency, feasibility, and conformance",
    "Document previously failed review and has been revised",
    "Want to ensure document quality meets standards before next stage",
  ],
  avoidWhen: [
    "Document is still in early draft/brainstorming phase",
    "Code review or implementation review (HCritic only reviews requirements/design docs)",
    "Quick informal feedback without structured evaluation",
  ],
}

const DEFINITION: AgentDefinition = {
  name: "HCritic",
  description:
    "Design Quality Gate & Review Agent - MUST be called after HArchitect/HEngineer completes any stage document. Provides structured quality assessment (completeness, consistency, feasibility, conformance) with Pass/Fail decision. Skill-driven review using stage-specific checklists. Read-only reviewer. Call BEFORE marking workflow stage complete. (HCritic - OhMyOpenCode)",
  mode: "subagent",
  color: "#FBC803",
  defaultTemperature: 0.1,
  promptGenerators: [
    filePrompt(join(__dirname, "identity.md")),
    filePrompt(join(__dirname, "constraints.md")),
    filePrompt(join(__dirname, "step.md")),
    filePrompt(join(__dirname, "standard.md")),
    filePrompt(join(__dirname, "interview.md")),
    toolsPrompt(["ask_user", "task"]),
  ],
  defaultPermission: {
    bash: "deny",
    edit: "deny",
    skill: "allow",
    todoread: "deny",
    webfetch: "deny",
    websearch: "deny",
    question: "deny",
    task: "allow",
    external_directory: "deny",
  },
  defaultTools: {
    bash: false,
    edit: false,
    write: false,
    read: true,
    grep: true,
    glob: true,
    list: true,
    patch: false,
    skill: true,
    todowrite: false,
    todoread: false,
    webfetch: true,
    websearch: true,
    question: false,
    task: true,
    get_hd_workflow_state: false,
    set_hd_workflow_stage: false,
    set_hd_workflow_current: false,
    set_hd_workflow_handover: false,
  },
}

export function createHCriticAgent(model?: string, runtime?: RuntimeType) {
  return createAgent(DEFINITION, model, runtime)
}

createHCriticAgent.mode = DEFINITION.mode
