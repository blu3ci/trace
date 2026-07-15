"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { Block, BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { PDFExporter, pdfDefaultSchemaMappings } from "@blocknote/xl-pdf-exporter";
import { pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReceiptPreview({ content, title }: { content: Block[]; title: string }) {
  const editor = useCreateBlockNote({ initialContent: content });

  return (
    <section className="overflow-hidden rounded-xl border border-[#dbe3dc] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e5e9e5] bg-[#f8faf8] px-5 py-3">
        <p className="text-sm font-medium text-[#405049]">Final submitted document</p>
        <Button variant="outline" size="sm" onClick={() => exportPdf(editor, title)}>
          <Download /> Export PDF
        </Button>
      </div>
      <div className="p-6 sm:p-10">
        <BlockNoteView editor={editor} theme="light" editable={false} sideMenu={false} formattingToolbar={false} comments={false} />
      </div>
    </section>
  );
}

async function exportPdf(editor: BlockNoteEditor, title: string) {
  const exporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);
  const pdfDocument = await exporter.toReactPDFDocument(editor.document);
  const blob = await pdf(pdfDocument).toBlob();
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `${safeFilename(title)}-receipt.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(link.href);
}

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "trace-receipt";
}
