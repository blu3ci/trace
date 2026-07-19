import type { Block } from "@blocknote/core";

export type RevisionChanges = {
  added: string[];
  removed: string[];
};

/**
 * Finds the sentence-level changes between two saved BlockNote document states.
 * This intentionally matches the evidence shown in the revision comparison view.
 */
export function findRevisionChanges(previousContent: Block[], currentContent: Block[]): RevisionChanges {
  const previous = blockTexts(previousContent);
  const current = blockTexts(currentContent);
  const previousOnly = previous.filter((block) => !current.some((currentBlock) => sameText(block, currentBlock)));
  const currentOnly = current.filter((block) => !previous.some((previousBlock) => sameText(block, previousBlock)));
  const removed: string[] = [];
  const added: string[] = [];

  const pairedBlocks = Math.min(previousOnly.length, currentOnly.length);
  for (let index = 0; index < pairedBlocks; index += 1) {
    const sentenceChanges = findSentenceChanges(previousOnly[index], currentOnly[index]);
    removed.push(...sentenceChanges.removed);
    added.push(...sentenceChanges.added);
  }

  return {
    removed: [...removed, ...previousOnly.slice(pairedBlocks).flatMap(splitSentences)],
    added: [...added, ...currentOnly.slice(pairedBlocks).flatMap(splitSentences)],
  };
}

function blockTexts(blocks: Block[]) {
  return blocks.map((block) => extractText((block as unknown as { content: unknown }).content)).filter(Boolean);
}

function extractText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as { content?: unknown; text?: unknown };
  return typeof record.text === "string" ? record.text : extractText(record.content);
}

function findSentenceChanges(previous: string, current: string): RevisionChanges {
  const previousSentences = splitSentences(previous);
  const currentSentences = splitSentences(current);
  return {
    removed: previousSentences.filter((sentence) => !currentSentences.some((currentSentence) => sameText(sentence, currentSentence))),
    added: currentSentences.filter((sentence) => !previousSentences.some((previousSentence) => sameText(sentence, previousSentence))),
  };
}

function splitSentences(value: string) {
  return value.replace(/\s+/g, " ").trim().match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

function sameText(first: string, second: string) {
  return first.replace(/\s+/g, " ").trim().toLocaleLowerCase() === second.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}
