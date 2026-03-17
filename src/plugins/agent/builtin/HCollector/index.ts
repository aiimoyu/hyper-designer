import type { AgentPromptMetadata } from "../../../../agents/types"
import type { AgentDefinition } from "../../../../agents/factory"
import { filePrompt } from "../../../../agents/factory"
import { createAgent } from "../../../../agents/factory"
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
    "Data Collection & Requirements Gathering Specialist - Typically delegated by @HArchitect at workflow start. Conducts data collection via GATHERING/NEEDS_CLARIFICATION/COMPLETED status protocol to clarify requirements, collects reference materials and existing documentation, researches domain knowledge and similar systems. Prepares comprehensive context for requirements analysis. Read-mostly agent focused on discovery and information gathering.",
  mode: "all",
  color: "#63B232",
  defaultTemperature: 0.3,
  promptGenerators: [
    filePrompt(join(__dirname, "prompts", "collector.md")),
  ],
  defaultPermission: {
    bash: "deny",
    edit: "allow",
    skill: "allow",
    todoread: "allow",
    todowrite: "allow",
    webfetch: "allow",
    websearch: "allow",
    question: "allow",
    task: "allow",
    external_directory: "allow",
    hd_workflow_state: "allow",
    hd_handover: "deny",
    hd_record_milestone: "deny",
    hd_force_next_step: "deny",
  },
}

export function createHCollectorAgent(model?: string) {
  return createAgent(DEFINITION, model)
}

createHCollectorAgent.mode = DEFINITION.mode
