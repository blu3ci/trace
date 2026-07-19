import { describe, expect, it } from "vitest";

import { receiptLegitimacyAnalysisInstructions } from "../src/lib/legitimacy-analysis-prompt";

describe("receipt legitimacy analysis instructions", () => {
  it("keeps the score limited to documented process evidence", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("not a plagiarism detector");
    expect(receiptLegitimacyAnalysisInstructions).toContain("score evidence coverage rather than suspicion");
    expect(receiptLegitimacyAnalysisInstructions).toContain("numeric score is an internal calibration value");
    expect(receiptLegitimacyAnalysisInstructions).toContain("A large paste is neutral by itself");
  });

  it("requires concise, concrete explanations", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("includes at least one concrete number, milestone, or recorded event");
    expect(receiptLegitimacyAnalysisInstructions).toContain("Do not expose raw excerpts in the response");
    expect(receiptLegitimacyAnalysisInstructions).toContain("Never expose input field names, camelCase identifiers");
  });
});
