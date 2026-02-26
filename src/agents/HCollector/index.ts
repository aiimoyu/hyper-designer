/**
 * HCollector 代理模块
 * 
 * 数据收集和需求收集专家，负责：
 * 1. 在工作流开始时由 @HArchitect 委托进行数据收集
 * 2. 通过 GATHERING/NEEDS_CLARIFICATION/COMPLETED 状态协议进行数据收集
 * 3. 收集参考资料和现有文档
 * 4. 研究领域知识和类似系统
 * 5. 为需求分析准备全面的上下文
 */

import type { AgentPromptMetadata } from "../types"
import type { AgentDefinition } from "../factory"
import { filePrompt } from "../factory"
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
  keyTrigger: "Workflow initialization phase. Delegated by HArchitect to perform pre-scanning, structured data collection via GATHERING/NEEDS_CLARIFICATION/COMPLETED status protocol, and generate data manifest. Operates strictly as a stateful Subagent.",
  triggers: [
    { domain: "Initialization", trigger: "Workflow start - requires pre-scanning codebase and establishing draft state in .hyper-designer" },
    { domain: "Data Collection", trigger: "Structured collection needed to fill missing gaps in required assets list (Status: GATHERING/NEEDS_CLARIFICATION)" },
    { domain: "Indexing", trigger: "Need to finalize collection and generate manifest.md for a specific stage (State: Finalizing)" },
  ],
  useWhen: [
    "Starting a new workflow stage that requires specific reference materials (assets list provided)",
    "Need to scan existing project structure for relevant files without executing tasks",
    "Require stateful, multi-turn interaction to collect missing documents (handles status transitions via draft.md)",
    "Generating the .hyper-designer/{stage}/document/manifest.md index",
    "HArchitect explicitly delegates the collection phase with a defined 'required_assets' structure",
  ],
  avoidWhen: [
    "Direct conversation with user is needed (HCollector uses status protocol only, cannot chat freely)",
    "Execution of coding tasks, building, or deploying (Violates core constraints)",
    "Simple queries that don't require persistent state or multi-round collection",
    "Analysis or design phases that follow data collection (handled by HArchitect/HEngineer)",
    "When no specific 'required assets' list is available for the current stage (Input validation failure)",
  ],
}

const DEFINITION: AgentDefinition = {
  name: "HCollector",
  description:
    "Data Collection & Requirements Gathering Specialist - Typically delegated by @HArchitect at workflow start. Conducts data collection via GATHERING/NEEDS_CLARIFICATION/COMPLETED status protocol to clarify requirements, collects reference materials and existing documentation, researches domain knowledge and similar systems. Prepares comprehensive context for requirements analysis. Read-mostly agent focused on discovery and information gathering. (HCollector - OhMyOpenCode)",
  mode: "subagent",
  color: "#63B232",
  defaultTemperature: 0.3,
  promptGenerators: [
    filePrompt(join(__dirname, "prompts", "collector.md")),
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
    set_hd_workflow_handover: false,
  },
}

export function createHCollectorAgent(model?: string, runtime?: RuntimeType) {
  return createAgent(DEFINITION, model, runtime)
}

createHCollectorAgent.mode = DEFINITION.mode