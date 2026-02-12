/**
 * HCollector 代理模块
 * 
 * 数据收集和需求收集专家，负责：
 * 1. 在工作流开始时由 @HArchitect 委托进行数据收集
 * 2. 进行用户访谈以澄清模糊需求
 * 3. 收集参考资料和现有文档
 * 4. 研究领域知识和类似系统
 * 5. 为需求分析准备全面的上下文
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

export type HCollectorPhase = "interview" | "research" | "design" | "full"

export const HCOLLECTOR_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HCollector",
  keyTrigger: "Data collection phase - typically delegated by @HArchitect at workflow start. Gathers reference materials, interviews users, and prepares context for requirements analysis.",
  triggers: [
    { domain: "Data Collection", trigger: "Start of workflow - need to collect reference materials, existing docs, and user context" },
    { domain: "Requirements Gathering", trigger: "User has vague ideas - need interview mode to extract structured information" },
    { domain: "Research", trigger: "Need to investigate existing solutions, similar systems, or domain knowledge" },
  ],
  useWhen: [
    "HArchitect delegates data collection phase at workflow start",
    "User provides vague or incomplete requirements - need interview to clarify",
    "Need to collect reference materials, existing documentation, or context",
    "Research phase before formal requirements analysis",
    "Starting a new project with unclear scope - need discovery phase",
  ],
  avoidWhen: [
    "Requirements are already clear and well-documented",
    "Data collection already complete (HArchitect takes over)",
    "Simple feature with explicit specifications",
    "Mid-workflow stages (IR Analysis onwards - handled by HArchitect/HEngineer)",
  ],
}

const DEFINITION: AgentDefinition = {
  name: "HCollector",
  description:
    "Data Collection & Requirements Gathering Specialist - Typically delegated by @HArchitect at workflow start. Conducts user interviews to clarify vague requirements, collects reference materials and existing documentation, researches domain knowledge and similar systems. Prepares comprehensive context for requirements analysis. Read-mostly agent focused on discovery and information gathering. (HCollector - OhMyOpenCode)",
  mode: "all",
  color: "#63B232",
  defaultTemperature: 0.3,
  promptGenerators: [
    filePrompt(join(__dirname, "prompts", "identity.md")),
    filePrompt(join(__dirname, "prompts", "constraints.md")),
    filePrompt(join(__dirname, "prompts", "step.md")),
    filePrompt(join(__dirname, "prompts", "standard.md")),
    filePrompt(join(__dirname, "prompts", "interview.md")),
    toolsPrompt(["ask_user", "task"]),
  ],
  defaultPermission: {
    bash: "deny",
    edit: "allow",
    skill: "allow",
    todoread: "deny",
    webfetch: "allow",
    websearch: "allow",
    question: "deny",
    task: "allow",
    external_directory: "allow",
  },
  defaultTools: {
    bash: false,
    edit: true,
    write: true,
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
    get_hd_workflow_state: true,
    set_hd_workflow_stage: false,
    set_hd_workflow_current: false,
    set_hd_workflow_handover: true,
  },
}

export function createHCollectorAgent(model?: string, runtime?: RuntimeType) {
  return createAgent(DEFINITION, model, runtime)
}

createHCollectorAgent.mode = DEFINITION.mode
