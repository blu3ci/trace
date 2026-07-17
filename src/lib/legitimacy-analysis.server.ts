import "server-only";

import { createHash } from "node:crypto";

import type { LegitimacyAnalysisRefreshState } from "@/lib/legitimacy-analysis";

export const LEGITIMACY_ANALYSIS_COOLDOWN_MS = 10 * 60 * 1000;

export function hashDocumentBody(content: unknown): string {
  return createHash("sha256").update(JSON.stringify(content ?? [])).digest("hex");
}

export function getLegitimacyAnalysisRefreshState({
  analysis,
  contentHash,
  now = new Date(),
}: {
  analysis?: { contentHash: string; updatedAt: Date } | null;
  contentHash: string;
  now?: Date;
}): LegitimacyAnalysisRefreshState {
  if (!analysis) return { canRefresh: true };

  if (analysis.contentHash === contentHash) {
    return {
      canRefresh: false,
      message: "Edit and save the document body before refreshing this analysis.",
    };
  }

  const availableAt = analysis.updatedAt.getTime() + LEGITIMACY_ANALYSIS_COOLDOWN_MS;
  if (availableAt > now.getTime()) {
    return {
      canRefresh: false,
      message: `Refresh available in ${formatRemainingTime(availableAt - now.getTime())}.`,
    };
  }

  return { canRefresh: true };
}

function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}
