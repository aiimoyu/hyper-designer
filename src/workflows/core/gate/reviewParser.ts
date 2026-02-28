/**
 * 评审结果解析模块
 *
 * 提供纯函数用于解析 HCritic 评审结果：
 * - 从文本推断通过状态
 * - 解析结构化评审输出
 * - 提取评审块信息
 */

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const inferPassFromText = (text: string): boolean => {
  const lower = text.toLowerCase();
  if (lower.includes("fail") || text.includes("未通过") || text.includes("不通过")) {
    return false;
  }
  return lower.includes("pass") || text.includes("通过") || lower.includes("approved");
};

export const parseReviewResult = (structuredOutput: unknown, reviewText: string): {
  passed: boolean;
  summary: string;
  issues: string[];
  score?: number;
} => {
  if (!isRecord(structuredOutput)) {
    return {
      passed: inferPassFromText(reviewText),
      summary: reviewText || "HCritic 未返回结构化结论。",
      issues: [],
    };
  }

  const issues = Array.isArray(structuredOutput.issues)
    ? structuredOutput.issues.filter((item): item is string => typeof item === "string")
    : [];
  const passed = typeof structuredOutput.passed === "boolean"
    ? structuredOutput.passed
    : inferPassFromText(reviewText);
  const summary = typeof structuredOutput.summary === "string"
    ? structuredOutput.summary
    : reviewText || (passed ? "评审通过" : "评审未通过");
  const score = typeof structuredOutput.score === "number" ? structuredOutput.score : undefined;

  return {
    passed,
    summary,
    issues,
    ...(score !== undefined ? { score } : {}),
  };
};