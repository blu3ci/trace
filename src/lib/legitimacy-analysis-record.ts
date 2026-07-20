import type { Block } from "@blocknote/core";

import { findRevisionChanges } from "./revision-diff";

type Milestone = {
  content: Block[] | null;
  createdAt: Date;
  typingWordsPerMinute: number;
};

export function buildLegitimacyAnalysisRecord(
  milestones: Milestone[],
  finalDocumentText: string,
) {
  return {
    m: milestones.map((milestone, index) => {
      const changes = findRevisionChanges(
        (milestones[index - 1]?.content ?? []) as Block[],
        (milestone.content ?? []) as Block[],
      );

      return {
        t: milestone.createdAt.toISOString(),
        w: milestone.typingWordsPerMinute,
        ...(changes.added.length > 0 ? { a: changes.added } : {}),
        ...(changes.removed.length > 0 ? { r: changes.removed } : {}),
      };
    }),
    f: milestones.length === 0 && finalDocumentText
      ? finalDocumentText
      : undefined,
  };
}
