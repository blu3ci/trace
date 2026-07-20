import type { LegitimacyAnalysis } from "@/lib/legitimacy-analysis";

type PasteCoverageFacts = {
  finalWordCount: number;
  totalBulkPasteWordCount: number;
};

type WritingRateFacts = {
  fastestRecordedWordsPerMinute: number;
  rapidRecordedAdditionCount: number;
};

type MilestoneCoverageFacts = {
  savedMilestoneCount: number;
};

const LARGE_PASTE_MINIMUM_WORDS = 75;
const LARGE_PASTE_FINAL_DRAFT_SHARE = 0.4;

export function applyMilestoneCoverageGuardrail(
  analysis: LegitimacyAnalysis,
  facts: MilestoneCoverageFacts,
): LegitimacyAnalysis {
  if (facts.savedMilestoneCount >= 3) return analysis;

  const hasNoMilestones = facts.savedMilestoneCount === 0;
  const scoreCap = hasNoMilestones ? 25 : facts.savedMilestoneCount === 1 ? 55 : 74;
  const label = hasNoMilestones || analysis.label === "needs_review"
    ? "needs_review"
    : "mixed";

  return {
    ...analysis,
    score: Math.min(analysis.score, scoreCap),
    scoreRationale: hasNoMilestones
      ? "No saved milestones document how the final text developed."
      : `${facts.savedMilestoneCount} saved ${facts.savedMilestoneCount === 1 ? "milestone" : "milestones"} limit the documented-process score.`,
    label,
    confidence: analysis.confidence === "low" || hasNoMilestones ? "low" : "medium",
    recommendedNextStep: analysis.label === "needs_review"
      ? analysis.recommendedNextStep
      : "Review additional saved revisions before drawing conclusions from this record.",
  };
}

export function applyPasteCoverageGuardrail(
  analysis: LegitimacyAnalysis,
  facts: PasteCoverageFacts,
): LegitimacyAnalysis {
  if (!hasSubstantialPastedAddition(facts)) return analysis;

  const pastedWords = facts.totalBulkPasteWordCount;
  const finalWords = facts.finalWordCount;
  const otherExplanations = analysis.explanations
    .filter((explanation) => explanation.title.toLowerCase() !== "large pasted addition")
    .slice(0, 3);

  return {
    ...analysis,
    label: "needs_review",
    confidence: "low",
    summary: `The saved milestones include a ${pastedWords.toLocaleString()}-word pasted addition in the ${finalWords.toLocaleString()}-word final draft.`,
    explanations: [
      {
        title: "Large pasted addition",
        detail: `A ${pastedWords.toLocaleString()}-word paste was recorded in a ${finalWords.toLocaleString()}-word final draft; the receipt cannot show how that pasted material was composed.`,
        impact: "needs_review",
      },
      ...otherExplanations,
    ],
    recommendedNextStep: "Manual review required: review the saved revisions and any citation or attribution context with the student before drawing conclusions.",
  };
}

function hasSubstantialPastedAddition({
  finalWordCount,
  totalBulkPasteWordCount,
}: PasteCoverageFacts) {
  return totalBulkPasteWordCount >= LARGE_PASTE_MINIMUM_WORDS
    && totalBulkPasteWordCount >= finalWordCount * LARGE_PASTE_FINAL_DRAFT_SHARE;
}

export function applyWritingRateCoverageGuardrail(
  analysis: LegitimacyAnalysis,
  facts: WritingRateFacts,
): LegitimacyAnalysis {
  if (facts.rapidRecordedAdditionCount === 0 || hasPasteExplanation(analysis)) return analysis;

  const rate = facts.fastestRecordedWordsPerMinute;
  const otherExplanations = analysis.explanations
    .filter((explanation) => explanation.title.toLowerCase() !== "rapid recorded addition")
    .slice(0, 3);

  return {
    ...analysis,
    summary: `The record includes an addition saved at about ${rate.toLocaleString()} words per recorded active minute alongside its other milestone changes.`,
    explanations: [
      {
        title: "Rapid recorded addition",
        detail: `At least one saved addition was recorded at about ${rate.toLocaleString()} words per active minute; the receipt does not record how that text was created.`,
        impact: "needs_review",
      },
      ...otherExplanations,
    ],
    recommendedNextStep: "The receipt preserves the recorded milestones and observed events.",
  };
}

function hasPasteExplanation(analysis: LegitimacyAnalysis) {
  return analysis.explanations.some((explanation) => explanation.title.toLowerCase() === "large pasted addition");
}
