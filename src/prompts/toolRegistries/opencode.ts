import type { ToolRegistry } from "../types";

export const OPENCODE_TOOL_REGISTRY: ToolRegistry = {
  ask_user: `question({
  questions: [{
    header: "确认",
    question: "请确认以下内容：",
    multiple: false,
    options: [
      { label: "确认", description: "同意继续" },
      { label: "取消", description: "不同意" }
    ]
  }]
})`,
  create_todos: `todowrite([{
  id: "task-1",
  content: "完成任务",
  status: "pending",
  priority: "high"
}])`,
  delegate_review: `task({
  category: "quick",
  load_skills: [],
  run_in_background: false,
  description: "HCritic审查文档",
  prompt: \`请审查设计文档：
- 文档路径：{路径列表}
- 审查重点：完整性、一致性、可实现性、规范性

请输出明确的审查结果：
1. 结论：通过 / 不通过
2. 具体反馈意见
3. 如果不通过，明确指出需要改进的地方\`
})`,
  delegate_explore: `task({
  subagent_type: "explore",
  load_skills: [],
  run_in_background: false,
  description: "探索分析",
  prompt: "请进行探索分析"
})`,
  delegate_librarian: `task({
  subagent_type: "librarian",
  load_skills: [],
  run_in_background: false,
  description: "资料收集",
  prompt: "请收集相关资料"
})`,
  workflow_handover: `set_hd_workflow_handover("阶段名")`,
  workflow_get_state: `get_hd_workflow_state()`,
  delegate_critic_review: `delegate_task(subagent_type="HCritic", load_skills=[], run_in_background=false, description="审查", prompt="请审查")`
};