import { describe, expect, it } from "vitest";

import {
  calculateTypingWordsPerMinute,
  detectBulkPasteWordCount,
} from "../src/lib/milestone-metadata";

describe("milestone metadata", () => {
  it("records a large clipboard paste even when the document update is not immediate", () => {
    expect(detectBulkPasteWordCount({
      clipboardWordCount: 73,
      currentText: "A changed document",
      elapsedMs: 5_000,
      previousText: "A document",
    })).toBe(73);
  });

  it("detects a large quick insertion when clipboard events are missed", () => {
    const pastedText = Array.from({ length: 60 }, (_, index) => `word${index}`).join(" ");

    expect(detectBulkPasteWordCount({
      clipboardWordCount: 0,
      currentText: `Opening paragraph ${pastedText} closing paragraph`,
      elapsedMs: 400,
      previousText: "Opening paragraph closing paragraph",
    })).toBe(60);
  });

  it("detects a first large insertion even when no earlier change established a timing window", () => {
    const pastedText = Array.from({ length: 55 }, (_, index) => `word${index}`).join(" ");

    expect(detectBulkPasteWordCount({
      clipboardWordCount: 0,
      currentText: pastedText,
      elapsedMs: 10_000,
      previousText: "",
    })).toBe(55);
  });

  it("does not label ordinary typing as a bulk paste", () => {
    expect(detectBulkPasteWordCount({
      clipboardWordCount: 0,
      currentText: "A short edited sentence",
      elapsedMs: 400,
      previousText: "A short sentence",
    })).toBe(0);
  });

  it("calculates rounded typing velocity from active writing time", () => {
    expect(calculateTypingWordsPerMinute(35, 42)).toBe(50);
    expect(calculateTypingWordsPerMinute(35, 0)).toBe(0);
  });
});
