"use client";

import { Button } from "@/components/ui/button";
import { saveDocument, updateDocumentTitle } from "@/server/actions/documents";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { Download, FileText } from "lucide-react";
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
}: {
  title: string;
  documentId: string;
  content: Block[] | null;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const editor = useCreateBlockNote({
    autofocus: true,
    initialContent: content ?? undefined,
  });

  const debouncedChangeHandler = useMemo(
    () => debounce(async () => {
      setIsSaving(true);
      const document: Block[] = editor.document;
      await saveDocument(documentId, document);
      setIsSaving(false);
    }, DEBOUNCE_DELAY),
    [documentId]
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
      />
      <div className="h-full overflow-y-auto py-2">
        <div className="max-w-250 min-h-full p-8 shadow-sm mx-auto">
          <BlockNoteView
            editor={editor}
            theme="light"
            // formattingToolbar={false}
            onChange={() => {
              debouncedChangeHandler();
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
}: {
  editor: BlockNoteEditor;
  title: string;
  documentId: string;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
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
    <div className="z-1 w-full bg-muted py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <div className="p-3 rounded-lg bg-[#315943] text-white">
              <FileText className="size-4" />
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Input
              aria-label="Document title"
              className="w-full max-w-xl rounded-lg border-transparent hover:border-input"
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
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="text-xs text-muted-foreground">Saving…</span>
          )}
          <Button onClick={exportPDF}>
            <Download /> Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
