import type { AgentDefinition, AgentPromptMetadata } from '../../../sdk/contracts'
import { agentFilePrompt, createSdkAgent } from '../../../sdk/contracts'
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
    "About to mark a workflow stage as complete (hd_handover)",
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
    "Design Quality Gate & Review Agent - MUST be called after HArchitect/HEngineer completes any stage document. Provides structured quality assessment (completeness, consistency, feasibility, conformance) with Pass/Fail decision. Skill-driven review using stage-specific checklists. Read-only reviewer. Call BEFORE marking workflow stage complete.",
  mode: "subagent",
  color: "#FBC803",
  defaultTemperature: 0.1,
  promptGenerators: [
    agentFilePrompt(join(__dirname, "prompts", "critic.md")),
  ],
  defaultPermission: {
    bash: "deny",
    edit: "deny",
    skill: "allow",
    todoread: "deny",
    webfetch: "deny",
    websearch: "deny",
    question: "deny",
    task: "deny",
    external_directory: "deny",
    hd_workflow_list: 'deny',
    hd_workflow_select: 'deny',
    hd_workflow_state: "allow",
    hd_handover: "deny",
    hd_force_next_step: "deny",
    hd_record_milestone: "allow",
    call_omo_agent: "deny",
  },
}

export function createHCriticAgent(model?: string) {
  return createSdkAgent(DEFINITION, model)
}

createHCriticAgent.mode = DEFINITION.mode
