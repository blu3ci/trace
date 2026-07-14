"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
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
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { $generateHtmlFromNodes } from "@lexical/html";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

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
  const [isClientReady, setIsClientReady] = useState(false);
  const subscribeToDraft = useCallback(() => () => {}, []);
  const serializedDraft = useSyncExternalStore(
    subscribeToDraft,
    () => window.localStorage.getItem(storageKey),
    () => null,
  );
  const storedDraft = useMemo(
    () => parseDraft(serializedDraft),
    [serializedDraft],
  );
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const title = titleOverride ?? storedDraft?.title ?? "Untitled document";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsClientReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const initialConfig = {
    namespace: `trace-document-${documentId}`,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    theme: editorTheme,
    onError(error: Error) {
      throw error;
    },
  };

  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="mx-auto flex min-h-16 max-w-360 items-center gap-3 px-4 sm:px-6">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#315943] text-white">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="h-8 w-full max-w-xl rounded-lg bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="min-h-screen bg-muted">
        <header className="sticky top-0 z-20 border-b border-[#e3e6e3] bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-360 items-center gap-3 px-4 sm:px-6">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#315943] text-white">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <Input
                aria-label="Document title"
                className="w-full max-w-xl rounded-lg border-0 bg-transparent px-2 py-1 text-base font-medium shadow-none transition hover:bg-[#f1f3f1] focus:bg-[#f1f3f1]"
                value={title}
                onChange={(event) => setTitleOverride(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="hidden items-center gap-1.5 bg-[#e5f1e8] px-3 py-1.5 text-xs font-medium text-[#315943] sm:flex"
              >
                <Check className="size-3.5" /> Draft
              </Badge>
              <ExportPdfButton title={title} />
            </div>
          </div>
          <Toolbar />
        </header>

        <main className="px-3 py-6 sm:px-6 sm:py-10">
          <div className="trace-document-page relative mx-auto min-h-[calc(100vh-12rem)] max-w-204 bg-white px-8 py-12 shadow-[0_1px_4px_rgba(32,37,33,0.16)] sm:px-[0.85in] sm:py-[0.9in]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder="Start writing…"
                  className="trace-content-editable min-h-[calc(100vh-18rem)] outline-none"
                  placeholder={
                    <div className="pointer-events-none absolute top-[3.6rem] text-lg text-[#9aa39d]">
                      Start writing…
                    </div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            {/* <RestoreDraftPlugin storageKey={storageKey} /> */}
            {/* <OnChangePlugin ignoreSelectionChange /> */}
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
        const element =
          anchorNode.getKey() === "root"
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
        const type = element.getType();
        const selectionState = {
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strike: selection.hasFormat("strikethrough"),
          blockType: $isHeadingNode(element)
            ? (`h${element.getTag().slice(1)}` as BlockType)
            : type === "quote"
              ? "quote"
              : "paragraph",
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
      const replacement =
        blockType === "paragraph"
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
      <div className="mx-auto flex max-w-360 items-center gap-1 overflow-x-auto rounded-xl bg-[#f1f4f1] p-1.5">
        <ToolbarButton
          label="Undo"
          disabled={!state.canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!state.canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        >
          <Redo2 />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <label className="flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-sm hover:bg-white">
          <span className="sr-only">Text style</span>
          <Select
            value={state.blockType}
            onValueChange={(value) => setBlockType(value as BlockType)}
          >
            <SelectTrigger className="w-35 border-0 bg-transparent px-0 shadow-none hover:bg-white">
              <SelectValue placeholder="Normal text" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Normal text</SelectItem>
              <SelectItem value="h1">Title</SelectItem>
              <SelectItem value="h2">Heading</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton
          label="Bold"
          active={state.bold}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={state.italic}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={state.underline}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
        >
          <Underline />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={state.strike}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
        >
          <Strikethrough />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton
          label="Bulleted list"
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          label="Remove list"
          onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
        >
          <Quote className="rotate-180" />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton
          label="Align left"
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        >
          <AlignLeft />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
          }
        >
          <AlignCenter />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
          }
        >
          <AlignRight />
        </ToolbarButton>
      </div>
    </div>
  );
}

function ExportPdfButton({ title }: { title: string }) {
  const [editor] = useLexicalComposerContext();

  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = async () => {
    setIsExporting(true);
    let html = "";
    editor.read(() => {
      html = $generateHtmlFromNodes(editor);
    });

    // 2. Insert text into a clean off-screen element
    const box = document.createElement("div");
    box.style.cssText =
      "position:absolute; left:-9999px; width:800px; padding:40px; background:#fff; font-family:sans-serif;";
    box.innerHTML = html;
    document.body.appendChild(box);

    // 3. Take screenshot
    const canvas = await html2canvas(box, { scale: 2 });
    document.body.removeChild(box); // clean up immediately

    // 4. Create and download Multi-page PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image height proportional to the PDF page width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL("image/png");
    let heightLeft = imgHeight;
    let position = 0;

    // Render the first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Loop to add subsequent pages if the content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // Move the image viewport up
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("document.pdf");
    setIsExporting(false);
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

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      variant={active ? "default" : "ghost"}
    >
      {children}
    </Button>
  );
}

function parseDraft(
  draft: string | null,
): { title?: string; savedAt?: string; content?: string } | null {
  if (!draft) return null;
  try {
    return JSON.parse(draft) as {
      title?: string;
      savedAt?: string;
      content?: string;
    };
  } catch {
    return null;
  }
}
