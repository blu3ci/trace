import { describe, expect, it } from "vitest";

import {
  getLegitimacyAnalysisRefreshState,
  LEGITIMACY_ANALYSIS_COOLDOWN_MS,
} from "../src/lib/legitimacy-analysis";

const now = new Date("2026-07-17T12:00:00.000Z");

describe("document legitimacy analysis refreshes", () => {
  it("allows the first analysis for a document", () => {
    expect(getLegitimacyAnalysisRefreshState({
      contentHash: "first-draft",
      now,
    })).toEqual({ canRefresh: true });
  });

  it("requires the document body to change before an existing score can refresh", () => {
    const contentHash = "first-draft";

    expect(getLegitimacyAnalysisRefreshState({
      analysis: { contentHash, updatedAt: new Date(now.getTime() - LEGITIMACY_ANALYSIS_COOLDOWN_MS) },
      contentHash,
      now,
    })).toEqual({
      canRefresh: false,
      message: "Edit and save the document body before refreshing this analysis.",
    });
  });

  it("applies the ten-minute cooldown after the body changes", () => {
    const previousHash = "first-draft";
    const changedHash = "revised-draft";

    expect(getLegitimacyAnalysisRefreshState({
      analysis: { contentHash: previousHash, updatedAt: now },
      contentHash: changedHash,
      now: new Date(now.getTime() + 2 * 60 * 1000),
    })).toEqual({ canRefresh: false, message: "Refresh available in 8m." });
  });

  it("allows a changed document body once the cooldown expires", () => {
    const previousHash = "first-draft";
    const changedHash = "revised-draft";

    expect(getLegitimacyAnalysisRefreshState({
      analysis: { contentHash: previousHash, updatedAt: now },
      contentHash: changedHash,
      now: new Date(now.getTime() + LEGITIMACY_ANALYSIS_COOLDOWN_MS),
    })).toEqual({ canRefresh: true });
  });
});
