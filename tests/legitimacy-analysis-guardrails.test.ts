import { describe, expect, it } from "vitest";

import {
  applyMilestoneCoverageGuardrail,
  applyPasteCoverageGuardrail,
  applyWritingRateCoverageGuardrail,
} from "../src/lib/legitimacy-analysis-guardrails";
import type { LegitimacyAnalysis } from "../src/lib/legitimacy-analysis";

const strongAnalysis: LegitimacyAnalysis = {
  score: 88,
  scoreRationale: "Five saved milestones provide a connected record of changes.",
  label: "strong",
  confidence: "high",
  summary: "Five milestones document the draft from opening to final saved version.",
  explanations: [
    { title: "Milestones", detail: "Five saved milestones were recorded.", impact: "supports" },
    { title: "Activity", detail: "Three milestones include active writing time.", impact: "supports" },
  ],
  citationAssessment: { status: "citation_evidence_limited", detail: "No citation-like signals were recorded." },
  recommendedNextStep: "No follow-up is needed.",
};

describe("observed record-note guardrails", () => {
  it("caps scores when the saved record has too few milestones", () => {
    const analysis = applyMilestoneCoverageGuardrail(strongAnalysis, {
      savedMilestoneCount: 1,
    });

    expect(analysis).toMatchObject({
      score: 55,
      label: "mixed",
      confidence: "medium",
      scoreRationale: "1 saved milestone limit the documented-process score.",
    });
  });

  it("requires review when no saved milestones are available", () => {
    const analysis = applyMilestoneCoverageGuardrail(strongAnalysis, {
      savedMilestoneCount: 0,
    });

    expect(analysis).toMatchObject({ score: 25, label: "needs_review", confidence: "low" });
  });

  it("adds a factual note when pasted material makes up much of the final draft", () => {
    const analysis = applyPasteCoverageGuardrail(strongAnalysis, {
      finalWordCount: 259,
      totalBulkPasteWordCount: 259,
    });

    expect(analysis.label).toBe("needs_review");
    expect(analysis.score).toBe(strongAnalysis.score);
    expect(analysis.confidence).toBe("low");
    expect(analysis.explanations[0]).toMatchObject({
      title: "Large pasted addition",
      impact: "needs_review",
    });
    expect(analysis.summary).toContain("259-word pasted addition");
    expect(analysis.recommendedNextStep).toContain("Manual review required");
  });

  it("does not add a note for a small pasted addition", () => {
    expect(applyPasteCoverageGuardrail(strongAnalysis, {
      finalWordCount: 500,
      totalBulkPasteWordCount: 40,
    })).toEqual(strongAnalysis);
  });
  it("adds a factual note for a very fast large recorded addition", () => {
    const analysis = applyWritingRateCoverageGuardrail(strongAnalysis, {
      fastestRecordedWordsPerMinute: 360,
      rapidRecordedAdditionCount: 1,
    });

    expect(analysis.label).toBe(strongAnalysis.label);
    expect(analysis.score).toBe(strongAnalysis.score);
    expect(analysis.explanations[0]).toMatchObject({
      title: "Rapid recorded addition",
      impact: "needs_review",
    });
  });

  it("does not add a note when no rapid addition was recorded", () => {
    expect(applyWritingRateCoverageGuardrail(strongAnalysis, {
      fastestRecordedWordsPerMinute: 0,
      rapidRecordedAdditionCount: 0,
    })).toEqual(strongAnalysis);
  });
});
