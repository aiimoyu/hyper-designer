import type { AgentConfig, AgentDefinition, AgentPromptMetadata } from '../../../types'
import { createAgent as createSdkAgent, stringPrompt as agentStringPrompt } from '../../../agents/factory'

const BASE_PROMPT = `You are HAnalysis, the Hyper Designer project-analysis specialist.

Operate as a lean, stage-driven primary agent for the projectAnalysis workflow.
Focus on the current workflow stage only:
- projectOverview: 建立项目的基础认知，生成项目概览和目录结构
- functionTreeAndModule: 建立功能树，分析模块关系
- interfaceAndDataFlow: 分析接口契约和数据流
- defectCheckAndPatch: 检查分析完整性，修补输出，生成最终报告

核心工作原则：
1. 以AI开发为中心：分析结果要便于AI后续开发使用
2. 注重可扩展性：分析格式要支持后续扩展
3. 注重可维护性：分析结果要便于维护和更新
4. 注重一致性：不同阶段的分析结果要保持一致

多Agent协作原则：
1. 你是规划者和协调者，不是唯一的执行者
2. 独立的探索任务应委派给 subagent（如 explore、librarian）
3. 多个独立任务应并行委派，不要串行等待
4. 你的核心职责是：规划、委派、综合、验证

Keep this base prompt lightweight. Do not embed full analysis methodology here.
Use the workflow-provided stage context and load the stage skill as the primary source of detailed process, checks, and output contracts.`

export const HANALYSIS_PROMPT_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'EXPENSIVE',
  promptAlias: 'HAnalysis',
  keyTrigger:
    'Project-analysis workflow specialist for projectOverview, functionTreeAndModule, interfaceAndDataFlow, and defectCheckAndPatch. Keeps the base prompt lean and relies on stage-specific skills for detailed methodology.',
  triggers: [
    {
      domain: 'Project Overview',
      trigger: 'Need project-level analysis including tech stack, directory structure, and entry points',
    },
    {
      domain: 'Function Tree',
      trigger: 'Need to build function hierarchy and analyze function dependencies',
    },
    {
      domain: 'Module Analysis',
      trigger: 'Need to analyze module relationships, dependencies, and interfaces',
    },
    {
      domain: 'Interface Contracts',
      trigger: 'Need to analyze API catalog, function signatures, and error contracts',
    },
    {
      domain: 'Data Flow',
      trigger: 'Need to analyze data models, flow diagrams, and data transformations',
    },
    {
      domain: 'Defect Check',
      trigger: 'Need to check analysis completeness and patch previous outputs',
    },
  ],
  useWhen: [
    'Working inside the projectAnalysis workflow',
    'Current stage is projectOverview, functionTreeAndModule, interfaceAndDataFlow, or defectCheckAndPatch',
    'Need lean base identity plus workflow-injected stage instructions',
    'Need to generate analysis artifacts for AI-driven development',
  ],
  avoidWhen: [
    'Classic requirements workflow stages handled by HArchitect or HEngineer',
    'General implementation or coding work outside project-analysis workflow',
    'Embedding full stage methodology directly into the base prompt',
  ],
}

const DEFINITION: AgentDefinition = {
  name: 'HAnalysis',
  description:
    'Project Analysis Specialist - Executes the projectAnalysis workflow across projectOverview, functionTreeAndModule, interfaceAndDataFlow, and defectCheckAndPatch. Stays lean at the base prompt layer and relies on workflow stage context plus stage-specific skills for detailed analysis methodology and artifact contracts. Designed to support AI-driven development by generating comprehensive project analysis artifacts.',
  mode: 'primary',
  color: '#7C3AED',
  defaultTemperature: 0.4,
  defaultMaxTokens: 200000,
  promptGenerators: [
    agentStringPrompt(BASE_PROMPT),
    agentStringPrompt('{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}'),
    agentStringPrompt('{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}'),
  ],
  defaultPermission: {
    bash: 'allow',
    edit: 'allow',
    skill: 'allow',
    todoread: 'allow',
    webfetch: 'deny',
    websearch: 'deny',
    question: 'allow',
    task: 'allow',
    external_directory: 'allow',
    hd_workflow_list: 'deny',
    hd_workflow_select: 'deny',
    hd_workflow_state: "allow",
    hd_handover: "allow",
    hd_force_next_step: "ask",
    hd_record_milestone: "deny",
    call_omo_agent: "deny",
  },
}

export function createHAnalysisAgent(model?: string): AgentConfig {
  return createSdkAgent(DEFINITION, model)
}

createHAnalysisAgent.mode = DEFINITION.mode
