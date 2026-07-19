"use client";

import { Button } from "@/components/ui/button";
import {
  saveDocument,
  submitAssignmentSubmission,
  updateDocumentTitle,
} from "@/server/actions/documents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Italic,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { PDFExporter } from "@blocknote/xl-pdf-exporter";
import { pdf } from "@react-pdf/renderer";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import { Input } from "@/components/ui/input";
import { documentPdfSchemaMappings } from "@/lib/document-pdf";
import {
  calculateTypingWordsPerMinute,
  countTextWords,
  detectBulkPasteWordCount,
} from "@/lib/milestone-metadata";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SAVE_DELAY = 1500;
const BULK_PASTE_WORD_THRESHOLD = 50;
const MEANINGFUL_CHANGE_WORD_THRESHOLD = 12;

export default function Editor({
  title,
  documentId,
  content,
  isSubmitted,
  assignmentId,
  receiptHref,
}: {
  title: string;
  documentId: string;
  content: Block[] | null;
  isSubmitted: boolean;
  assignmentId?: string;
  receiptHref: string;
}) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const [saveRequest, setSaveRequest] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const activeMillis = useRef(0);
  const hasCapturedMilestone = useRef(false);
  const lastInteractionAt = useRef<number | null>(null);
  const lastMilestoneAt = useRef<number | null>(null);
  const lastMilestoneText = useRef(normalizeDocumentText(extractText(content ?? [])));
  const lastObservedDocumentText = useRef(normalizeDocumentText(extractText(content ?? [])));
  const lastObservedWordCount = useRef(countDocumentWords(content ?? []));
  const lastDocumentChangeAt = useRef<number | null>(null);
  const pendingClipboardPasteWordCount = useRef(0);
  const pendingBulkPasteWordCount = useRef(0);
  const pendingTypedWordCount = useRef(0);
  const latestSaveRequest = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  const pendingSaveTimer = useRef<number | null>(null);
  const router = useRouter();
  const editor = useCreateBlockNote({
    autofocus: true,
    initialContent: content ?? undefined,
    dictionary: {
      ...en,
      placeholders: {
        ...en.placeholders,
        default: "Enter text or type '/' for commands. Highlight text to show more options.",
      },
    },
    _tiptapOptions: {
      editorProps: {
        handleKeyDown: (view, event) => {
          if (
            event.key !== "Tab"
            || event.shiftKey
            || event.altKey
            || event.ctrlKey
            || event.metaKey
          ) {
            return false;
          }

          view.dispatch(view.state.tr.insertText("\t"));
          return true;
        },
        handlePaste: (_view, event) => {
          recordBulkPaste(event);
          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (!saveRequest || isSubmitted || isSubmitting) return;

    const timeout = window.setTimeout(() => {
      pendingSaveTimer.current = null;
      const document: Block[] = editor.document;
      const now = Date.now();
      const wordCount = countDocumentWords(document);
      const documentText = normalizeDocumentText(extractText(document));
      const activeMillisAtSave = activeMillis.current;
      const bulkPasteWordCountAtSave = pendingBulkPasteWordCount.current;
      const typedWordCountAtSave = pendingTypedWordCount.current;
      const shouldCaptureMilestone = wordCount > 0 && (
        !hasCapturedMilestone.current
        || bulkPasteWordCountAtSave > 0
        || (
          (!lastMilestoneAt.current || now - lastMilestoneAt.current >= 60_000)
          && isMeaningfulDraftChange(lastMilestoneText.current, documentText)
        )
      );
      const milestone = shouldCaptureMilestone
        ? {
          activeSeconds: Math.round(activeMillisAtSave / 1000),
          blockCount: document.length,
          bulkPasteWordCount: bulkPasteWordCountAtSave,
          typedWordCount: typedWordCountAtSave,
          typingWordsPerMinute: calculateTypingWordsPerMinute(
            typedWordCountAtSave,
            Math.round(activeMillisAtSave / 1000),
          ),
          wordCount,
        }
        : undefined;

      saveQueue.current = saveQueue.current.then(async () => {
        if (latestSaveRequest.current === saveRequest) setSaveStatus("saving");

        try {
          const result = await saveDocument(documentId, document, milestone);
          if (result?.error) throw new Error("Unable to save document");

          if (milestone) {
            hasCapturedMilestone.current = true;
            lastMilestoneAt.current = now;
            lastMilestoneText.current = documentText;
            activeMillis.current = Math.max(0, activeMillis.current - activeMillisAtSave);
            pendingBulkPasteWordCount.current = Math.max(
              0,
              pendingBulkPasteWordCount.current - bulkPasteWordCountAtSave,
            );
            pendingTypedWordCount.current = Math.max(0, pendingTypedWordCount.current - typedWordCountAtSave);
          }
          if (latestSaveRequest.current === saveRequest) setSaveStatus("saved");
        } catch {
          if (latestSaveRequest.current === saveRequest) setSaveStatus("error");
        }
      });
    }, SAVE_DELAY);
    pendingSaveTimer.current = timeout;

    return () => {
      window.clearTimeout(timeout);
      if (pendingSaveTimer.current === timeout) pendingSaveTimer.current = null;
    };
  }, [documentId, editor, isSubmitted, isSubmitting, saveRequest]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (saveStatus !== "pending" && saveStatus !== "saving") return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [saveStatus]);

  const requestSave = () => {
    latestSaveRequest.current += 1;
    setSaveRequest(latestSaveRequest.current);
  };

  const recordEditingActivity = (document: Block[]) => {
    const now = Date.now();
    const documentText = normalizeDocumentText(extractText(document));
    const wordCount = countDocumentWords(document);
    const bulkPasteWordCount = detectBulkPasteWordCount({
      clipboardWordCount: pendingClipboardPasteWordCount.current,
      currentText: documentText,
      elapsedMs: lastDocumentChangeAt.current ? now - lastDocumentChangeAt.current : Number.POSITIVE_INFINITY,
      previousText: lastObservedDocumentText.current,
    });
    const addedWordCount = Math.max(0, wordCount - lastObservedWordCount.current);
    if (bulkPasteWordCount > 0) pendingBulkPasteWordCount.current += bulkPasteWordCount;
    pendingTypedWordCount.current += Math.max(0, addedWordCount - bulkPasteWordCount);
    pendingClipboardPasteWordCount.current = 0;
    lastObservedDocumentText.current = documentText;
    lastObservedWordCount.current = wordCount;
    lastDocumentChangeAt.current = now;

    const previousInteraction = lastInteractionAt.current;
    if (previousInteraction && now - previousInteraction < 15_000) {
      activeMillis.current += now - previousInteraction;
    }
    lastInteractionAt.current = now;
    setSaveStatus("pending");
    requestSave();
  };

  const submitFromEditor = async () => {
    if (!assignmentId || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    if (pendingSaveTimer.current) {
      window.clearTimeout(pendingSaveTimer.current);
      pendingSaveTimer.current = null;
    }

    try {
      await saveQueue.current;
      const document: Block[] = editor.document;
      const now = Date.now();
      const wordCount = countDocumentWords(document);
      const documentText = normalizeDocumentText(extractText(document));
      const activeMillisAtSave = activeMillis.current;
      const bulkPasteWordCountAtSave = pendingBulkPasteWordCount.current;
      const typedWordCountAtSave = pendingTypedWordCount.current;
      const milestone = wordCount > 0
        ? {
          activeSeconds: Math.round(activeMillisAtSave / 1000),
          blockCount: document.length,
          bulkPasteWordCount: bulkPasteWordCountAtSave,
          typedWordCount: typedWordCountAtSave,
          typingWordsPerMinute: calculateTypingWordsPerMinute(
            typedWordCountAtSave,
            Math.round(activeMillisAtSave / 1000),
          ),
          wordCount,
        }
        : undefined;
      setSaveStatus("saving");
      const saveResult = await saveDocument(documentId, document, milestone);
      if (saveResult?.error) throw new Error("Unable to save the final draft");

      if (milestone) {
        hasCapturedMilestone.current = true;
        lastMilestoneAt.current = now;
        lastMilestoneText.current = documentText;
        activeMillis.current = Math.max(0, activeMillis.current - activeMillisAtSave);
        pendingBulkPasteWordCount.current = Math.max(
          0,
          pendingBulkPasteWordCount.current - bulkPasteWordCountAtSave,
        );
        pendingTypedWordCount.current = Math.max(0, pendingTypedWordCount.current - typedWordCountAtSave);
      }

      const submissionResult = await submitAssignmentSubmission(assignmentId);
      if (submissionResult.error || !submissionResult.receiptHref) {
        throw new Error("Unable to submit the assignment");
      }

      router.push(submissionResult.receiptHref);
    } catch (error) {
      setSaveStatus("error");
      setSubmissionError(error instanceof Error ? error.message : "Unable to submit the assignment");
      setIsSubmitting(false);
    }
  };

  function recordBulkPaste(event: ClipboardEvent) {
    const pastedWordCount = countTextWords(event.clipboardData?.getData("text/plain") ?? "");
    if (pastedWordCount >= BULK_PASTE_WORD_THRESHOLD) {
      pendingBulkPasteWordCount.current += pastedWordCount;
    }
  }

  // Renders the editor instance using a React component.
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DocumentHeader
        editor={editor}
        title={title}
        documentId={documentId}
        saveStatus={saveStatus}
        onRetrySave={() => {
          setSaveStatus("pending");
          requestSave();
        }}
        isSubmitted={isSubmitted}
        assignmentId={assignmentId}
        isSubmitting={isSubmitting}
        submissionError={submissionError}
        onSubmitAssignment={submitFromEditor}
        receiptHref={receiptHref}
      />
      {!isSubmitted && <DocumentToolbar editor={editor} />}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f7f8f7] px-3 py-3 sm:px-6 sm:py-6">
        <div className="mx-auto min-h-full w-full max-w-4xl bg-white p-4 shadow-sm sm:p-8">
          <BlockNoteView
            editor={editor}
            theme="light"
            editable={!isSubmitted}
            // formattingToolbar={false}
            onChange={() => {
              if (!isSubmitted) recordEditingActivity(editor.document);
            }}
            sideMenu={false}
            comments={false}
          />
        </div>
      </div>
    </div>
  );
}

function countDocumentWords(blocks: Block[]) {
  return countTextWords(extractText(blocks));
}

function extractText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as { content?: unknown; text?: unknown };
  if (typeof record.text === "string") return record.text;
  return extractText(record.content);
}

function normalizeDocumentText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isMeaningfulDraftChange(previous: string, current: string) {
  if (previous === current) return false;

  const previousWords = textWords(previous);
  const currentWords = textWords(current);
  let start = 0;
  while (start < previousWords.length && start < currentWords.length && previousWords[start] === currentWords[start]) {
    start += 1;
  }

  let previousEnd = previousWords.length;
  let currentEnd = currentWords.length;
  while (previousEnd > start && currentEnd > start && previousWords[previousEnd - 1] === currentWords[currentEnd - 1]) {
    previousEnd -= 1;
    currentEnd -= 1;
  }

  const changedWordCount = previousEnd - start + currentEnd - start;
  if (changedWordCount >= MEANINGFUL_CHANGE_WORD_THRESHOLD) return true;

  const previousSentences = textSentences(previous);
  const currentSentences = textSentences(current);
  const changedSentences = [
    ...previousSentences.filter((sentence) => !currentSentences.includes(sentence)),
    ...currentSentences.filter((sentence) => !previousSentences.includes(sentence)),
  ];
  return changedSentences.some((sentence) => textWords(sentence).length >= MEANINGFUL_CHANGE_WORD_THRESHOLD);
}

function textWords(value: string) {
  return value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function textSentences(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}.!?]+/gu, " ")
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function DocumentHeader({
  editor,
  title,
  documentId,
  saveStatus,
  onRetrySave,
  isSubmitted,
  assignmentId,
  isSubmitting,
  submissionError,
  onSubmitAssignment,
  receiptHref,
}: {
  editor: BlockNoteEditor;
  title: string;
  documentId: string;
  saveStatus: "idle" | "pending" | "saving" | "saved" | "error";
  onRetrySave: () => void;
  isSubmitted: boolean;
  assignmentId?: string;
  isSubmitting: boolean;
  submissionError: string | null;
  onSubmitAssignment: () => Promise<void>;
  receiptHref: string;
}) {
  const [draftTitle, setDraftTitle] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  async function exportPDF() {
    const exporter = new PDFExporter(editor.schema, documentPdfSchemaMappings);

    // Convert the blocks to a react-pdf document
    const pdfDocument = await exporter.toReactPDFDocument(editor.document);
    const blob = await pdf(pdfDocument).toBlob();

    // Use react-pdf to write to file:
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    link.remove();
    window.URL.revokeObjectURL(link.href);
  }

  async function handleTitleBlur() {
    if (isSubmitted) return;

    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle || trimmedTitle === title) {
      setDraftTitle(title);
      return;
    }

    setIsSavingTitle(true);
    const result = await updateDocumentTitle(documentId, {
      title: trimmedTitle,
    });
    setIsSavingTitle(false);

    if (result?.error) {
      setDraftTitle(title);
    }
  }

  return (
    <header className="z-20 w-full border-b border-[#dbe3dc] bg-[#fbfcfa]/95 backdrop-blur-xl">
      <div className="container mx-auto flex min-h-18 items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            aria-label="Back to my documents"
            variant="outline"
            size="icon-lg"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#315943] text-white">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="mb-0.5 text-[0.7rem] font-semibold tracking-[0.12em] text-[#567160] uppercase">
              Document
            </p>
            {isSubmitted ? (
              <p className="px-2 text-base font-semibold tracking-[-0.02em]">{title}</p>
            ) : (
              <Input
                aria-label="Document title"
                className="-ml-2 h-8 w-full max-w-xl rounded-lg border-transparent bg-transparent px-2 text-base font-semibold tracking-[-0.02em] shadow-none transition-colors hover:border-[#bfd0c2] hover:bg-white focus-visible:border-[#567160] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#d8e8db]"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
              />
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isSubmitted ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-[#e5f1e8] px-2.5 py-1 text-xs font-medium text-[#315943] sm:flex">
              <CheckCircle2 className="size-3.5" /> Submitted
            </span>
          ) : (
            <SaveStatus status={isSavingTitle ? "saving" : saveStatus} onRetry={onRetrySave} />
          )}
          {assignmentId && !isSubmitted && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button disabled={isSubmitting} />}>
                <FileCheck2 />
                <span className="hidden sm:inline">{isSubmitting ? "Submitting" : "Submit assignment"}</span>
                <span className="sr-only sm:hidden">Submit assignment</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit this assignment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    trace will save your final draft, create a verified receipt, and lock this document from further edits.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { void onSubmitAssignment(); }} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting…" : "Submit and create receipt"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={receiptHref} />}
          >
            <FileCheck2 />
            <span className="hidden sm:inline">View receipt</span>
            <span className="sr-only sm:hidden">View receipt</span>
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <Download />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sr-only sm:hidden">Export PDF</span>
          </Button>
        </div>
      </div>
      {submissionError && <p role="alert" className="container mx-auto px-5 pb-3 text-sm text-[#9b332a] sm:px-8">{submissionError}</p>}
    </header>
  );
}

type ToolbarBlockType = "paragraph" | "heading-1" | "heading-2" | "heading-3" | "bulletListItem" | "numberedListItem";

function DocumentToolbar({ editor }: { editor: BlockNoteEditor }) {
  const [state, setState] = useState(() => getToolbarState(editor));

  useEffect(() => {
    const updateToolbarState = () => setState(getToolbarState(editor));

    updateToolbarState();
    const unsubscribeSelection = editor.onSelectionChange(updateToolbarState);
    const unsubscribeChange = editor.onChange(updateToolbarState);

    return () => {
      unsubscribeSelection();
      unsubscribeChange();
    };
  }, [editor]);

  const focusEditor = () => editor.focus();
  const updateBlockType = (value: ToolbarBlockType | null) => {
    if (!value) return;

    focusEditor();
    const block = editor.getTextCursorPosition().block;
    if (value.startsWith("heading-")) {
      editor.updateBlock(block, { type: "heading", props: { level: Number(value.at(-1)) } });
      return;
    }
    if (value === "paragraph") {
      editor.updateBlock(block, { type: "paragraph" });
      return;
    }
    if (value === "bulletListItem") {
      editor.updateBlock(block, { type: "bulletListItem" });
      return;
    }
    editor.updateBlock(block, { type: "numberedListItem" });
  };

  return (
    <div className="border-b border-[#dbe3dc] bg-white">
      <div className="container mx-auto overflow-x-auto px-5 sm:px-8">
        <div className="flex h-13 min-w-max items-center gap-1" role="toolbar" aria-label="Document formatting">
          <ToolbarButton label="Undo" onClick={() => { focusEditor(); editor.undo(); }}>
            <Undo2 />
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => { focusEditor(); editor.redo(); }}>
            <Redo2 />
          </ToolbarButton>
          <ToolbarDivider />
          <Select
            items={toolbarBlockTypeItems}
            value={state.blockType}
            onValueChange={updateBlockType}
          >
            <SelectTrigger size="sm" className="w-35 border-transparent bg-transparent hover:bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {toolbarBlockTypeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToolbarDivider />
          <ToolbarButton label="Bold" pressed={state.bold} onClick={() => { focusEditor(); editor.toggleStyles({ bold: true }); }}>
            <Bold />
          </ToolbarButton>
          <ToolbarButton label="Italic" pressed={state.italic} onClick={() => { focusEditor(); editor.toggleStyles({ italic: true }); }}>
            <Italic />
          </ToolbarButton>
          <ToolbarButton label="Underline" pressed={state.underline} onClick={() => { focusEditor(); editor.toggleStyles({ underline: true }); }}>
            <Underline />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" pressed={state.strike} onClick={() => { focusEditor(); editor.toggleStyles({ strike: true }); }}>
            <Strikethrough />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Bulleted list" pressed={state.blockType === "bulletListItem"} onClick={() => updateBlockType("bulletListItem")}>
            <List />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" pressed={state.blockType === "numberedListItem"} onClick={() => updateBlockType("numberedListItem")}>
            <ListOrdered />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Align left" pressed={state.textAlignment === "left"} onClick={() => updateTextAlignment(editor, "left")}>
            <AlignLeft />
          </ToolbarButton>
          <ToolbarButton label="Center align" pressed={state.textAlignment === "center"} onClick={() => updateTextAlignment(editor, "center")}>
            <AlignCenter />
          </ToolbarButton>
          <ToolbarButton label="Align right" pressed={state.textAlignment === "right"} onClick={() => updateTextAlignment(editor, "right")}>
            <AlignRight />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Decrease indentation (Shift+Tab)" disabled={!state.canOutdent} onClick={() => { focusEditor(); editor.unnestBlock(); }}>
            <ListIndentDecrease />
          </ToolbarButton>
          <ToolbarButton label="Increase indentation" disabled={!state.canIndent} onClick={() => { focusEditor(); editor.nestBlock(); }}>
            <ListIndentIncrease />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  pressed = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      variant="ghost"
      size="icon-sm"
      className={pressed ? "bg-[#d8e8db] text-[#315943] hover:bg-[#cfe2d3]" : ""}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#dbe3dc]" />;
}

const toolbarBlockTypeItems: Array<{ label: string; value: ToolbarBlockType }> = [
  { label: "Normal text", value: "paragraph" },
  { label: "Heading 1", value: "heading-1" },
  { label: "Heading 2", value: "heading-2" },
  { label: "Heading 3", value: "heading-3" },
  { label: "Bulleted list", value: "bulletListItem" },
  { label: "Numbered list", value: "numberedListItem" },
];

function getToolbarState(editor: BlockNoteEditor) {
  const block = editor.getTextCursorPosition().block;
  const styles = editor.getActiveStyles();
  const blockProps = block.props as { level?: number; textAlignment?: "left" | "center" | "right" | "justify" };
  const blockType: ToolbarBlockType = block.type === "heading"
    ? `heading-${Math.min(blockProps.level ?? 1, 3)}` as ToolbarBlockType
    : block.type === "bulletListItem" || block.type === "numberedListItem"
      ? block.type
      : "paragraph";

  return {
    blockType,
    bold: styles.bold === true,
    italic: styles.italic === true,
    underline: styles.underline === true,
    strike: styles.strike === true,
    textAlignment: blockProps.textAlignment ?? "left",
    canIndent: editor.canNestBlock(),
    canOutdent: editor.canUnnestBlock(),
  };
}

function updateTextAlignment(editor: BlockNoteEditor, textAlignment: "left" | "center" | "right") {
  editor.focus();
  editor.updateBlock(editor.getTextCursorPosition().block, { props: { textAlignment } });
}

function SaveStatus({ status, onRetry }: { status: "idle" | "pending" | "saving" | "saved" | "error"; onRetry: () => void }) {
  if (status === "idle") return null;
  if (status === "error") {
    return <Button variant="outline" size="sm" onClick={onRetry}>Retry save</Button>;
  }

  const isSaving = status === "pending" || status === "saving";
  return (
    <span aria-live="polite" className="hidden items-center gap-1.5 rounded-full bg-[#e5f1e8] px-2.5 py-1 text-xs font-medium text-[#315943] sm:flex">
      {isSaving ? <span className="size-1.5 animate-pulse rounded-full bg-[#567160]" /> : <CheckCircle2 className="size-3.5" />}
      {isSaving ? "Saving" : "Saved"}
    </span>
  );
}
