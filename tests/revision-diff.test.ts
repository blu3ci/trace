import type { Block } from "@blocknote/core";
import { describe, expect, it } from "vitest";

import { findRevisionChanges } from "../src/lib/revision-diff";

function documentWith(...paragraphs: string[]) {
  return paragraphs.map((text, index) => ({
    id: `block-${index}`,
    type: "paragraph",
    props: {},
    content: [{ type: "text", text, styles: {} }],
    children: [],
  })) as unknown as Block[];
}

describe("findRevisionChanges", () => {
  it("reports sentence-level evidence for a rewritten paragraph", () => {
    const changes = findRevisionChanges(
      documentWith("For one, they lay eggs."),
      documentWith("For one, they lay eggs, but you probably knew that. A lesser known fact is that they can be venomous."),
    );

    expect(changes).toEqual({
      removed: ["For one, they lay eggs."],
      added: [
        "For one, they lay eggs, but you probably knew that.",
        "A lesser known fact is that they can be venomous.",
      ],
    });
  });

  it("keeps unchanged sentences out of the evidence", () => {
    const changes = findRevisionChanges(
      documentWith("The opening stays. The conclusion is brief."),
      documentWith("The opening stays. The conclusion now connects the evidence."),
    );

    expect(changes).toEqual({
      removed: ["The conclusion is brief."],
      added: ["The conclusion now connects the evidence."],
    });
  });
});
