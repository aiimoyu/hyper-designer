import type { ToolSyntaxRegistry } from "./index";

export const OPENCODE_TOOL_SYNTAX: ToolSyntaxRegistry = {
  ask_user: {
    uniName: "ask_user",
    description: "Ask the user clarifying questions when you need more information to proceed. Use this tool to present multiple-choice options to the user and get their selection. Each question can have multiple options with labels and descriptions. Supports both single-select and multi-select modes.",
    syntax: "question({questions: [{header, question, multiple?, options: [{label, description}]}]})",
    example: `question({
  questions: [{
    header: "Confirmation",
    question: "Please confirm the following:",
    multiple: false,
    options: [
      { label: "Confirm", description: "Agree to proceed" },
      { label: "Cancel", description: "Do not agree" }
    ]
  }]
})`,
  },

  skill: {
    uniName: "skill",
    description: "Load a specialized skill that provides domain-specific instructions and workflows. When you recognize that a task matches one of the available skills, use this tool to load the full skill instructions. The skill will inject detailed instructions, workflows, and access to bundled resources into the conversation context.",
    syntax: `skill({
  name: string                   // The name of the skill from available_skills
})`,
    example: `skill({
  name: "git-master"
})`,
  },

  websearch: {
    uniName: "websearch",
    description: "Search the web for any topic and get clean, ready-to-use content. Best for: Finding current information, news, facts, or answering questions about any topic. Returns: Clean text content from top search results, ready for LLM use.",
    syntax: `websearch({
  query: string,                 // Websearch query
  numResults?: number,           // Number of search results to return (default: 8)
  livecrawl?: "fallback" | "preferred",  // Live crawl mode (default: "fallback")
  type?: "auto" | "fast" | "deep",       // Search type (default: "auto")
  contextMaxCharacters?: number  // Maximum characters for context (default: 10000)
})`,
    example: `websearch({
  query: "latest React features 2025",
  numResults: 5,
  type: "fast"
})`,
  },

  webfetch: {
    uniName: "webfetch",
    description: "Fetch content from a specific URL. Use this when you need to retrieve and analyze web content, documentation, or articles. Supports converting HTML to markdown or plain text. Can also fetch images and return them as attachments.",
    syntax: `webfetch({
  url: string,                   // The URL to fetch content from
  format?: "text" | "markdown" | "html",  // Format to return (default: "markdown")
  timeout?: number               // Timeout in seconds (max 120)
})`,
    example: `webfetch({
  url: "https://example.com/docs",
  format: "markdown"
})`,
  },

  task: {
    uniName: "task",
    description: "Spawn a specialized sub-agent to complete a specific task. Use this to delegate work to domain-specific agents like 'explore' (for searching your codebase), 'librarian' (for finding documentation and examples), 'oracle' (for complex problem analysis), or 'metis' (for pre-planning). Supports session continuation via task_id.",
    syntax: `task({
  description: string,           // Short (3-5 words) description of the task
  prompt: string,                // The complete task instructions for the agent
  subagent_type?: string,        // Agent type: "explore", "librarian", "oracle", "metis", "momus", etc.
  category?: string,             // Task category: "visual-engineering", "ultrabrain", "deep", "quick", "writing"
  load_skills?: string[],        // Skills to load for the agent
  run_in_background?: boolean,   // Run asynchronously (default: false)
  task_id?: string,              // Resume a previous task (optional)
  command?: string               // The command that triggered this task (optional)
})`,
    example: `task({
  subagent_type: "explore",
  category: "quick",
  load_skills: [],
  run_in_background: false,
  description: "Find auth patterns",
  prompt: "Search the codebase for authentication implementations in src/api/..."
})`,
  },

  todowrite: {
    uniName: "todowrite",
    description: "Create and manage a todo list to track progress on multi-step tasks. Use this tool at the start of complex work to plan your approach, mark items as in_progress when working on them, and mark as completed when done. The entire todo list is replaced with each call.",
    syntax: `todowrite({
  todos: [{
    id: string,                  // Unique identifier for the todo item
    content: string,             // Description of the task
    status: "pending" | "in_progress" | "completed",
    priority: "high" | "medium" | "low"
  }]
})`,
    example: `todowrite({
  todos: [{
    id: "1",
    content: "Analyze requirements and create plan",
    status: "in_progress",
    priority: "high"
  }, {
    id: "2",
    content: "Implement feature X",
    status: "pending",
    priority: "high"
  }]
})`,
  },

  todoread: {
    uniName: "todoread",
    description: "Read your current todo list to see what tasks are pending or in progress. Use this to check your progress before starting work.",
    syntax: "todoread({})",
    example: "todoread({})",
  },

  hd_workflow_state: {
    uniName: "hd_workflow_state",
    description: "Get the current workflow state of the Hyper Designer project. Returns information about which stages are completed, current step, gate result (score + comment), and handover state. Returns null if workflow has not been initialized.",
    syntax: "hd_workflow_state()",
    example: "hd_workflow_state()",
  },

  hd_handover: {
    uniName: "hd_handover",
    description: "Set the handover workflow step to transfer control to the next stage. Requires gate score > 75. After calling this, STOP immediately — do NOT continue with any tasks or tools.",
    syntax: `hd_handover({\n  step_name: "dataCollection" | "IRAnalysis" | "scenarioAnalysis" | "useCaseAnalysis" | "functionalRefinement" | "requirementDecomposition" | "systemFunctionalDesign" | "moduleFunctionalDesign"\n})`,
    example: `hd_handover({\n  step_name: "functionalRefinement"\n})`,
  },

  hd_submit_evaluation: {
    uniName: "hd_submit_evaluation",
    description: "[HCritic only] Submit quality evaluation for the current workflow stage. Call this after completing a quality review to record the score and summary. Only HCritic has permission to call this tool.",
    syntax: `hd_submit_evaluation({\n  score: number,                 // Quality gate score from 0 to 100\n  comment?: string               // Review summary or comment (optional)\n})`,
    example: `hd_submit_evaluation({\n  score: 85,\n  comment: "文档结构完整，覆盖了主要需求，建议补充边界场景"\n})`,
  },

};

