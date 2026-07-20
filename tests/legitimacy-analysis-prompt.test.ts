import { describe, expect, it } from "vitest";

import { receiptLegitimacyAnalysisInstructions } from "../src/lib/legitimacy-analysis-prompt";

describe("receipt legitimacy analysis instructions", () => {
  it("keeps the summary factual and limited to documented process evidence", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("not an authorship, plagiarism, AI-use, or misconduct decision");
    expect(receiptLegitimacyAnalysisInstructions).toContain("saved writing record");
    expect(receiptLegitimacyAnalysisInstructions).toContain("never infer intent or cause");
  });

  it("requires concise, concrete explanations", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("Summary: one factual sentence, 25 words or fewer");
    expect(receiptLegitimacyAnalysisInstructions).toContain("never expose input keys, arrays, or raw excerpts");
    expect(receiptLegitimacyAnalysisInstructions).toContain("added text");
  });

  it("defines APA 7 and MLA 9 citation-like evidence without treating it as verification", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("APA author–year");
    expect(receiptLegitimacyAnalysisInstructions).toContain("MLA author–page");
    expect(receiptLegitimacyAnalysisInstructions).toContain("not a verified source");
    expect(receiptLegitimacyAnalysisInstructions).toContain("A paste, citation, or attribution never proves its cause");
  });

  it("uses actual saved document changes as the citation evidence", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("Citation assessment: present if any cited pattern appears");
  });

  it("restores evidence-based scoring and confidence", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("strong = 85–100 requires at least 3 connected saved revisions");
    expect(receiptLegitimacyAnalysisInstructions).toContain("Add a score rationale: one brief factual sentence");
    expect(receiptLegitimacyAnalysisInstructions).toContain("Confidence is high only for clear, connected multi-milestone evidence");
  });

  it("limits WPM and timing observations to the saved record", () => {
    expect(receiptLegitimacyAnalysisInstructions).toContain("Report WPM and gaps between saved times only as observed facts");
    expect(receiptLegitimacyAnalysisInstructions).toContain("does not show whether or how long a student thought before writing");
  });
});
