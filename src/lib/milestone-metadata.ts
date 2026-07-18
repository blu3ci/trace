export const BULK_PASTE_WORD_THRESHOLD = 50;
const BULK_INSERTION_WINDOW_MS = 1_500;

export function countTextWords(value: string) {
  const normalized = value.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

export function detectBulkPasteWordCount({
  clipboardWordCount,
  currentText,
  elapsedMs,
  previousText,
}: {
  clipboardWordCount: number;
  currentText: string;
  elapsedMs: number;
  previousText: string;
}) {
  if (clipboardWordCount >= BULK_PASTE_WORD_THRESHOLD) return clipboardWordCount;
  if (elapsedMs > BULK_INSERTION_WINDOW_MS && previousText.trim()) return 0;

  const insertedWordCount = countInsertedWords(previousText, currentText);
  return insertedWordCount >= BULK_PASTE_WORD_THRESHOLD ? insertedWordCount : 0;
}

export function calculateTypingWordsPerMinute(typedWordCount: number, activeSeconds: number) {
  if (typedWordCount <= 0 || activeSeconds <= 0) return 0;
  return Math.round((typedWordCount * 60) / activeSeconds);
}

function countInsertedWords(previousText: string, currentText: string) {
  const previousWords = words(previousText);
  const currentWords = words(currentText);
  let start = 0;
  while (start < previousWords.length && start < currentWords.length && previousWords[start] === currentWords[start]) {
    start += 1;
  }

  let previousEnd = previousWords.length;
  let currentEnd = currentWords.length;
  while (
    previousEnd > start
    && currentEnd > start
    && previousWords[previousEnd - 1] === currentWords[currentEnd - 1]
  ) {
    previousEnd -= 1;
    currentEnd -= 1;
  }

  return currentEnd - start;
}

function words(value: string) {
  return value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}
