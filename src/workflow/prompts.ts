import { readFileSync } from "fs";
import { join } from "path";
import type { Workflow } from "./state";

const PROMPTS_DIR = join(process.cwd(), "src", "workflow", "prompts");

export function loadPromptForStage(stage: keyof Workflow): string {
  const promptMap: Record<keyof Workflow, string> = {
    dataCollection: "dataCollection.md",
    IRAnalysis: "IRAnalysis.md",
    scenarioAnalysis: "scenarioAnalysis.md",
    useCaseAnalysis: "useCaseAnalysis.md",
    functionalRefinement: "functionalRefinement.md",
    requirementDecomposition: "requirementDecomposition.md",
    systemFunctionalDesign: "systemFunctionalDesign.md",
    moduleFunctionalDesign: "moduleFunctionalDesign.md",
  };

  const promptFile = promptMap[stage];
  if (!promptFile) return "";

  try {
    const promptPath = join(PROMPTS_DIR, promptFile);
    const promptContent = readFileSync(promptPath, "utf-8");
    if (!promptContent.trim()) return "";
    return promptContent;
  } catch (error) {
    return "";
  }
}