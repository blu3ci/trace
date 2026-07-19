import { describe, expect, it } from "vitest";

import { receiptLegitimacyAnalysisInstructions } from "../src/lib/legitimacy-analysis-prompt";

describe("receipt legitimacy analysis instructions", () => {
  it("keeps the summary factual and limited to documented process evidence", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("not a plagiarism detector");
    expect(receiptLegitimacyAnalysisInstructions).toContain("factual writing-process summarizer");
    expect(receiptLegitimacyAnalysisInstructions).toContain("A large paste or very fast recorded addition is neutral by itself");
    expect(receiptLegitimacyAnalysisInstructions).not.toContain("INTERNAL SCORING");
    expect(receiptLegitimacyAnalysisInstructions).not.toContain("Strong requires");
  });

  it("requires concise, concrete explanations", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("includes at least one concrete number, milestone, or recorded event");
    expect(receiptLegitimacyAnalysisInstructions).toContain("Do not expose raw excerpts in the response");
    expect(receiptLegitimacyAnalysisInstructions).toContain("Never expose input field names");
  });
});
