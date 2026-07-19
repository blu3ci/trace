import { describe, expect, it } from "vitest";

import {
  getLegitimacyAnalysisRefreshState,
  LEGITIMACY_ANALYSIS_COOLDOWN_MS,
} from "../src/lib/legitimacy-analysis";

const now = new Date("2026-07-17T12:00:00.000Z");

describe("document legitimacy analysis refreshes", () => {
  it("allows the first analysis for a document", () => {
    expect(getLegitimacyAnalysisRefreshState({
      now,
    })).toEqual({ canRefresh: true });
  });

  it("allows a refresh after the cooldown even when the document body is unchanged", () => {
    expect(getLegitimacyAnalysisRefreshState({
      analysis: { contentHash: "first-draft", updatedAt: new Date(now.getTime() - LEGITIMACY_ANALYSIS_COOLDOWN_MS) },
      now,
    })).toEqual({ canRefresh: true });
  });

  it("applies the ten-minute cooldown after an analysis", () => {
    expect(getLegitimacyAnalysisRefreshState({
      analysis: { contentHash: "first-draft", updatedAt: now },
      now: new Date(now.getTime() + 2 * 60 * 1000),
    })).toEqual({ canRefresh: false, message: "Refresh available in 8m." });
  });

  it("allows another analysis once the cooldown expires", () => {
    expect(getLegitimacyAnalysisRefreshState({
      analysis: { contentHash: "first-draft", updatedAt: now },
      now: new Date(now.getTime() + LEGITIMACY_ANALYSIS_COOLDOWN_MS),
    })).toEqual({ canRefresh: true });
  });
});
