import type { LegitimacyAnalysis } from "@/lib/legitimacy-analysis";

type PasteCoverageFacts = {
  finalWordCount: number;
  totalBulkPasteWordCount: number;
};

type WritingRateFacts = {
  fastestRecordedWordsPerMinute: number;
  rapidRecordedAdditionCount: number;
};

const LARGE_PASTE_MINIMUM_WORDS = 75;
const LARGE_PASTE_FINAL_DRAFT_SHARE = 0.4;

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
    summary: `The saved milestones include a ${pastedWords.toLocaleString()}-word pasted addition in the ${finalWords.toLocaleString()}-word final draft.`,
    explanations: [
      {
        title: "Large pasted addition",
        detail: `A ${pastedWords.toLocaleString()}-word paste was recorded in a ${finalWords.toLocaleString()}-word final draft; the receipt cannot show how that pasted material was composed.`,
        impact: "needs_review",
      },
      ...otherExplanations,
    ],
    recommendedNextStep: "The receipt preserves the recorded milestones and observed events.",
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
