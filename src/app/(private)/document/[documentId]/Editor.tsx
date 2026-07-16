"use client";

import { Button } from "@/components/ui/button";
import { saveDocument, updateDocumentTitle } from "@/server/actions/documents";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { ArrowLeft, CheckCircle2, Download, FileCheck2, FileText } from "lucide-react";
import {
  PDFExporter,
  pdfDefaultSchemaMappings,
} from "@blocknote/xl-pdf-exporter";
import { pdf } from "@react-pdf/renderer";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SAVE_DELAY = 1500;

export default function Editor({
  title,
  documentId,
  content,
  isSubmitted,
  isAssignmentDocument,
  receiptHref,
}: {
  title: string;
  documentId: string;
  content: Block[] | null;
  isSubmitted: boolean;
  isAssignmentDocument: boolean;
  receiptHref?: string;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveRequest, setSaveRequest] = useState(0);
  const activeMillis = useRef(0);
  const hasCapturedMilestone = useRef(false);
  const lastInteractionAt = useRef<number | null>(null);
  const lastMilestoneAt = useRef<number | null>(null);
  const editor = useCreateBlockNote({
    autofocus: true,
    initialContent: content ?? undefined,
  });

  useEffect(() => {
    if (!saveRequest || isSubmitted) return;

    const timeout = window.setTimeout(async () => {
      setIsSaving(true);
      const document: Block[] = editor.document;
      const now = Date.now();
      const wordCount = countDocumentWords(document);
      const shouldCaptureMilestone = wordCount > 0 && (
        !hasCapturedMilestone.current
        || !lastMilestoneAt.current
        || now - lastMilestoneAt.current >= 60_000
      );
      const milestone = shouldCaptureMilestone
        ? {
          activeSeconds: Math.round(activeMillis.current / 1000),
          blockCount: document.length,
          wordCount,
        }
        : undefined;
      await saveDocument(documentId, document, milestone);
      if (milestone) {
        hasCapturedMilestone.current = true;
        lastMilestoneAt.current = now;
        activeMillis.current = 0;
      }
      setIsSaving(false);
    }, SAVE_DELAY);

    return () => window.clearTimeout(timeout);
  }, [documentId, editor, isSubmitted, saveRequest]);

  const recordEditingActivity = () => {
    const now = Date.now();
    const previousInteraction = lastInteractionAt.current;
    if (previousInteraction && now - previousInteraction < 15_000) {
      activeMillis.current += now - previousInteraction;
    }
    lastInteractionAt.current = now;
    setSaveRequest((request) => request + 1);
  };

  // Renders the editor instance using a React component.
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DocumentHeader
        editor={editor}
        title={title}
        documentId={documentId}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        isSubmitted={isSubmitted}
        isAssignmentDocument={isAssignmentDocument}
        receiptHref={receiptHref}
      />
      <div className="h-full overflow-y-auto py-2">
        <div className="max-w-250 min-h-full p-8 shadow-sm mx-auto">
          <BlockNoteView
            editor={editor}
            theme="light"
            editable={!isSubmitted}
            // formattingToolbar={false}
            onChange={() => {
              if (!isSubmitted) recordEditingActivity();
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
  return extractText(blocks)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function extractText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as { content?: unknown; text?: unknown };
  if (typeof record.text === "string") return record.text;
  return extractText(record.content);
}

function DocumentHeader({
  editor,
  title,
  documentId,
  isSaving,
  setIsSaving,
  isSubmitted,
  isAssignmentDocument,
  receiptHref,
}: {
  editor: BlockNoteEditor;
  title: string;
  documentId: string;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitted: boolean;
  isAssignmentDocument: boolean;
  receiptHref?: string;
}) {
  const [draftTitle, setDraftTitle] = useState(title);

  async function exportPDF() {
    const exporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);

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

    setIsSaving(true);
    const result = await updateDocumentTitle(documentId, {
      title: trimmedTitle,
    });
    setIsSaving(false);

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
          ) : isSaving && (
            <span className="hidden items-center gap-1.5 rounded-full bg-[#e5f1e8] px-2.5 py-1 text-xs font-medium text-[#315943] sm:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-[#567160]" />
              Saving
            </span>
          )}
          <Button
            variant="outline"
            nativeButton={false}
            disabled={isAssignmentDocument && !isSubmitted}
            render={receiptHref ? <Link href={receiptHref} /> : undefined}
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
    </header>
  );
}
