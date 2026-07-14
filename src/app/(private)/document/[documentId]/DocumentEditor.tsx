"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type EditorState,
} from "lexical";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, REMOVE_LIST_COMMAND } from "@lexical/list";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Download,
  FileText,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Underline,
} from "lucide-react";

type DocumentEditorProps = { documentId: string };
type BlockType = "paragraph" | "h1" | "h2" | "quote";

const editorTheme = {
  heading: {
    h1: "trace-editor-heading-h1",
    h2: "trace-editor-heading-h2",
  },
  list: {
    ul: "trace-editor-list-ul",
    ol: "trace-editor-list-ol",
    listitem: "trace-editor-list-item",
  },
  quote: "trace-editor-quote",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
  },
};

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const storageKey = `trace-document:${documentId}`;
  const subscribeToDraft = useCallback(() => () => {}, []);
  const serializedDraft = useSyncExternalStore(
    subscribeToDraft,
    () => window.localStorage.getItem(storageKey),
    () => null,
  );
  const storedDraft = useMemo(() => parseDraft(serializedDraft), [serializedDraft]);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [savedAtOverride, setSavedAtOverride] = useState<string | null>(null);
  const title = titleOverride ?? storedDraft?.title ?? "Untitled document";
  const savedAt = savedAtOverride ?? storedDraft?.savedAt ?? null;

  const saveDraft = useCallback(
    (editorState: EditorState) => {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ title, content: editorState.toJSON(), savedAt }),
      );
      setSavedAtOverride(savedAt);
    },
    [storageKey, title],
  );

  const saveTitle = () => {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(storageKey, JSON.stringify({ ...readDraft(storageKey), title, savedAt }));
    setSavedAtOverride(savedAt);
  };

  const initialConfig = {
    namespace: `trace-document-${documentId}`,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    theme: editorTheme,
    onError(error: Error) {
      throw error;
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="min-h-screen bg-[#f7f8f7] text-[#202124]">
        <header className="sticky top-0 z-20 border-b border-[#e3e6e3] bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#315943] text-white">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <input
                aria-label="Document title"
                className="w-full max-w-xl rounded px-2 py-1 text-base font-medium outline-none transition hover:bg-[#f1f3f1] focus:bg-[#f1f3f1]"
                value={title}
                onChange={(event) => setTitleOverride(event.target.value)}
                onBlur={saveTitle}
              />
              <p className="px-2 text-xs text-[#6b746e]">
                {savedAt ? `Saved locally ${formatSavedAt(savedAt)}` : "Saved locally"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-[#e5f1e8] px-3 py-1.5 text-xs font-medium text-[#315943] sm:flex">
                <Check className="size-3.5" /> Draft
              </span>
              <ExportPdfButton title={title} />
            </div>
          </div>
          <Toolbar />
        </header>

        <main className="px-3 py-6 sm:px-6 sm:py-10">
          <div className="trace-document-page relative mx-auto min-h-[calc(100vh-12rem)] max-w-[8.5in] bg-white px-8 py-12 shadow-[0_1px_4px_rgba(32,37,33,0.16)] sm:px-[0.85in] sm:py-[0.9in]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder="Start writing…"
                  className="trace-content-editable min-h-[calc(100vh-18rem)] outline-none"
                  placeholder={<div className="pointer-events-none absolute top-[3.6rem] text-lg text-[#9aa39d]">Start writing…</div>}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <RestoreDraftPlugin storageKey={storageKey} />
            <OnChangePlugin onChange={saveDraft} ignoreSelectionChange />
            <HistoryPlugin />
            <ListPlugin />
            <AutoFocusPlugin />
          </div>
        </main>
      </div>
    </LexicalComposer>
  );
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    blockType: "paragraph" as BlockType,
    canUndo: false,
    canRedo: false,
  });

  useEffect(() => {
    const updateToolbar = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();
        const type = element.getType();
        const selectionState = {
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strike: selection.hasFormat("strikethrough"),
          blockType: $isHeadingNode(element) ? (`h${element.getTag().slice(1)}` as BlockType) : type === "quote" ? "quote" : "paragraph",
        };
        setState((current) => ({
          ...current,
          ...selectionState,
        }));
      });
    };

    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const selectionState = {
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strike: selection.hasFormat("strikethrough"),
        };
        setState((current) => ({
          ...current,
          ...selectionState,
        }));
      });
    });
  }, [editor]);

  useEffect(() => {
    const unregisterUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (canUndo) => {
        setState((current) => ({ ...current, canUndo }));
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
    const unregisterRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (canRedo) => {
        setState((current) => ({ ...current, canRedo }));
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
    return () => {
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor]);

  const setBlockType = (blockType: BlockType) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const block = selection.anchor.getNode().getTopLevelElementOrThrow();
      const replacement = blockType === "paragraph"
        ? $createParagraphNode()
        : blockType === "h1"
          ? $createHeadingNode("h1")
          : blockType === "h2"
            ? $createHeadingNode("h2")
            : $createQuoteNode();
      replacement.append(...block.getChildren());
      block.replace(replacement);
    });
  };

  return (
    <div className="border-t border-[#eef0ee] bg-white px-3 py-2 sm:px-6">
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto rounded-xl bg-[#f1f4f1] p-1.5">
        <ToolbarButton label="Undo" disabled={!state.canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}><Undo2 /></ToolbarButton>
        <ToolbarButton label="Redo" disabled={!state.canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}><Redo2 /></ToolbarButton>
        <span className="mx-1 h-6 w-px bg-[#d8ddd8]" />
        <label className="flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-sm hover:bg-white">
          <span className="sr-only">Text style</span>
          <select className="max-w-30 bg-transparent outline-none" value={state.blockType} onChange={(event) => setBlockType(event.target.value as BlockType)}>
            <option value="paragraph">Normal text</option>
            <option value="h1">Title</option>
            <option value="h2">Heading</option>
            <option value="quote">Quote</option>
          </select>
        </label>
        <span className="mx-1 h-6 w-px bg-[#d8ddd8]" />
        <ToolbarButton label="Bold" active={state.bold} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}><Bold /></ToolbarButton>
        <ToolbarButton label="Italic" active={state.italic} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}><Italic /></ToolbarButton>
        <ToolbarButton label="Underline" active={state.underline} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}><Underline /></ToolbarButton>
        <ToolbarButton label="Strikethrough" active={state.strike} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}><Strikethrough /></ToolbarButton>
        <span className="mx-1 h-6 w-px bg-[#d8ddd8]" />
        <ToolbarButton label="Bulleted list" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}><List /></ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}><ListOrdered /></ToolbarButton>
        <ToolbarButton label="Remove list" onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}><Quote className="rotate-180" /></ToolbarButton>
        <span className="mx-1 h-6 w-px bg-[#d8ddd8]" />
        <ToolbarButton label="Align left" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}><AlignLeft /></ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}><AlignCenter /></ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}><AlignRight /></ToolbarButton>
      </div>
    </div>
  );
}

function ExportPdfButton({ title }: { title: string }) {
  const [editor] = useLexicalComposerContext();
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = async () => {
    setIsExporting(true);
    try {
      const content = editor.getEditorState().read(() => $getRoot().getTextContent());
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ format: "letter", orientation: "portrait", unit: "mm" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 6;
      const maxLineWidth = pageWidth - margin * 2;
      const heading = title.trim() || "Untitled document";

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(heading, margin, margin);
      pdf.setFont("times", "normal");
      pdf.setFontSize(12);

      const lines = pdf.splitTextToSize(content || " ", maxLineWidth) as string[];
      let cursorY = margin + 13;
      for (const line of lines) {
        if (cursorY > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.text(line, margin, cursorY);
        cursorY += lineHeight;
      }

      const pageCount = pdf.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        pdf.setPage(pageNumber);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(96, 112, 103);
        pdf.text(`Trace - ${pageNumber} of ${pageCount}`, margin, pageHeight - 10);
        pdf.setTextColor(0, 0, 0);
      }

      const safeTitle = title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "trace-document";
      pdf.save(`${safeTitle}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={exportPdf}
      disabled={isExporting}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#315943] px-3 text-xs font-medium text-white transition-colors hover:bg-[#254735] disabled:cursor-wait disabled:opacity-70"
    >
      <Download className="size-3.5" />
      {isExporting ? "Exporting…" : "Export PDF"}
    </button>
  );
}

function ToolbarButton({ active = false, children, disabled = false, label, onClick }: { active?: boolean; children: React.ReactNode; disabled?: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`grid size-8 shrink-0 place-items-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-[#dcebdd] text-[#23492f]" : "hover:bg-white"}`}>{children}</button>;
}

function RestoreDraftPlugin({ storageKey }: { storageKey: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const draft = readDraft(storageKey);
    if (draft?.content) editor.setEditorState(editor.parseEditorState(draft.content));
  }, [editor, storageKey]);

  return null;
}

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function readDraft(storageKey: string): { title?: string; savedAt?: string; content?: string } | null {
  if (typeof window === "undefined") return null;
  const serializedDraft = window.localStorage.getItem(storageKey);
  const draft = parseDraft(serializedDraft);
  if (!draft && serializedDraft) window.localStorage.removeItem(storageKey);
  return draft;
}

function parseDraft(draft: string | null): { title?: string; savedAt?: string; content?: string } | null {
  if (!draft) return null;
  try {
    return JSON.parse(draft) as { title?: string; savedAt?: string; content?: string };
  } catch {
    return null;
  }
}
