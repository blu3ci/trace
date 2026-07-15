"use client";

import { Button } from "@/components/ui/button";
import { saveDocument, updateDocumentTitle } from "@/server/actions/documents";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { ArrowLeft, CheckCircle2, Download, FileText } from "lucide-react";
import {
  PDFExporter,
  pdfDefaultSchemaMappings,
} from "@blocknote/xl-pdf-exporter";
import { pdf } from "@react-pdf/renderer";
import { Block, BlockNoteEditor } from "@blocknote/core";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";

const DEBOUNCE_DELAY = 1500;

export default function Editor({
  title,
  documentId,
  content,
  isSubmitted,
}: {
  title: string;
  documentId: string;
  content: Block[] | null;
  isSubmitted: boolean;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const editor = useCreateBlockNote({
    autofocus: true,
    initialContent: content ?? undefined,
  });

  const debouncedChangeHandler = useMemo(
    () => debounce(async () => {
      if (isSubmitted) return;

      setIsSaving(true);
      const document: Block[] = editor.document;
      await saveDocument(documentId, document);
      setIsSaving(false);
    }, DEBOUNCE_DELAY),
    [documentId, editor, isSubmitted]
  );

  useEffect(() => {
    return () => {
      debouncedChangeHandler.cancel();
    };
  }, [debouncedChangeHandler]);

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
      />
      <div className="h-full overflow-y-auto py-2">
        <div className="max-w-250 min-h-full p-8 shadow-sm mx-auto">
          <BlockNoteView
            editor={editor}
            theme="light"
            editable={!isSubmitted}
            // formattingToolbar={false}
            onChange={() => {
              if (!isSubmitted) debouncedChangeHandler();
            }}
            sideMenu={false}
            comments={false}
          />
        </div>
      </div>
    </div>
  );
}

function DocumentHeader({
  editor,
  title,
  documentId,
  isSaving,
  setIsSaving,
  isSubmitted,
}: {
  editor: BlockNoteEditor;
  title: string;
  documentId: string;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitted: boolean;
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
