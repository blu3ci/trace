import type { Block } from "@blocknote/core";
import { describe, expect, it } from "vitest";

import { buildLegitimacyAnalysisRecord } from "../src/lib/legitimacy-analysis-record";

function documentWith(...paragraphs: string[]) {
  return paragraphs.map((text, index) => ({
    id: `block-${index}`,
    type: "paragraph",
    props: {},
    content: [{ type: "text", text, styles: {} }],
    children: [],
  })) as unknown as Block[];
}

describe("buildLegitimacyAnalysisRecord", () => {
  it("sends each saved change with only its timestamp and WPM metadata", () => {
    const record = buildLegitimacyAnalysisRecord([
      {
        content: documentWith("The first sentence."),
        createdAt: new Date("2026-07-20T12:00:00.000Z"),
        typingWordsPerMinute: 24,
      },
      {
        content: documentWith("The revised sentence."),
        createdAt: new Date("2026-07-20T12:05:00.000Z"),
        typingWordsPerMinute: 31,
      },
    ], "The revised sentence.");

    expect(record).toEqual({
      m: [
        {
          t: "2026-07-20T12:00:00.000Z",
          w: 24,
          a: ["The first sentence."],
        },
        {
          t: "2026-07-20T12:05:00.000Z",
          w: 31,
          a: ["The revised sentence."],
          r: ["The first sentence."],
        },
      ],
      f: undefined,
    });
  });

  it("provides final document text only when no milestones are available", () => {
    expect(buildLegitimacyAnalysisRecord([], "Untracked text.")).toEqual({
      m: [],
      f: "Untracked text.",
    });
  });
});
