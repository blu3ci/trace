"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { LegitimacyAnalysis } from "@/lib/legitimacy-analysis";

type ReceiptMilestone = {
  changes?: {
    added: string[];
    removed: string[];
  };
  dateTime: string;
  duration: string;
  text: string;
  title: string;
};

type ReceiptPdfDownloadButtonProps = {
  activeWritingTime: string;
  analysis?: Omit<LegitimacyAnalysis, "score">;
  assignmentTitle: string;
  bulkPasteWordCount: number;
  finalWordCount: number;
  milestones: ReceiptMilestone[];
  submittedAt: string;
};

const page = { height: 792, width: 612, margin: 42, footerY: 770 };
const contentWidth = page.width - page.margin * 2;
const colors = {
  border: [219, 227, 220] as const,
  ink: [29, 37, 33] as const,
  muted: [96, 112, 103] as const,
  soft: [247, 250, 247] as const,
  white: [255, 255, 255] as const,
  green: [78, 138, 90] as const,
  greenDark: [49, 89, 67] as const,
  added: [33, 112, 73] as const,
  removed: [153, 51, 42] as const,
};

export function ReceiptPdfDownloadButton(props: ReceiptPdfDownloadButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function downloadReceipt() {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const document = new jsPDF({ format: "letter", unit: "pt" });
      renderReceiptPdf(document, props);
      document.save(`${safeFilename(props.assignmentTitle)}-trace-receipt.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={downloadReceipt} disabled={isExporting}>
      <Download /> {isExporting ? "Preparing PDF" : "Download receipt PDF"}
    </Button>
  );
}

type PdfDocument = {
  addPage: () => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  roundedRect: (x: number, y: number, width: number, height: number, rx: number, ry: number, style?: "S" | "F" | "FD" | "DF") => void;
  save: (filename: string) => void;
  setDrawColor: (...color: number[]) => PdfDocument;
  setFillColor: (...color: number[]) => PdfDocument;
  setFont: (fontName: string, fontStyle?: string) => PdfDocument;
  setFontSize: (size: number) => PdfDocument;
  setTextColor: (...color: number[]) => PdfDocument;
  splitTextToSize: (text: string, size: number) => string[];
  text: (text: string | string[], x: number, y: number, options?: { lineHeightFactor?: number }) => PdfDocument;
};

export function renderReceiptPdf(document: PdfDocument, receipt: ReceiptPdfDownloadButtonProps) {
  let cursor = drawReceiptHeader(document, receipt);
  cursor = drawMetrics(document, cursor, receipt);

  if (receipt.analysis) {
    const analysisHeight = getAnalysisHeight(document, receipt.analysis);
    if (cursor + analysisHeight > page.footerY - 18) {
      document.addPage();
      cursor = drawSummaryPageHeading(document);
    }
    cursor = drawAnalysis(document, cursor, receipt.analysis);
  }

  document.addPage();
  cursor = drawJourneyHeading(document, false);

  receipt.milestones.forEach((milestone) => {
    const height = getMilestoneHeight(document, milestone);
    if (cursor + height > page.footerY - 12) {
      document.addPage();
      cursor = drawJourneyHeading(document, true);
    }
    cursor = drawMilestone(document, cursor, milestone);
  });

  if (receipt.milestones.length === 0) {
    setTextStyle(document, 10, colors.muted);
    document.text("No writing milestones were recorded before submission.", page.margin, cursor + 20);
  }

  addFooter(document);
}

function drawReceiptHeader(document: PdfDocument, receipt: ReceiptPdfDownloadButtonProps) {
  let cursor = page.margin;
  setTextStyle(document, 8, colors.greenDark, "bold");
  document.text("TRACE - WRITING PROCESS RECEIPT", page.margin, cursor);
  cursor += 28;

  setTextStyle(document, 24, colors.ink, "bold");
  const title = document.splitTextToSize(receipt.assignmentTitle, contentWidth);
  document.text(title, page.margin, cursor, { lineHeightFactor: 1.15 });
  cursor += title.length * 28 + 4;

  setTextStyle(document, 10, colors.muted);
  document.text(`Submitted ${receipt.submittedAt}`, page.margin, cursor);
  cursor += 22;
  document.setDrawColor(...colors.border);
  document.line(page.margin, cursor, page.width - page.margin, cursor);
  return cursor + 24;
}

function drawMetrics(document: PdfDocument, cursor: number, receipt: ReceiptPdfDownloadButtonProps) {
  const gap = 8;
  const width = (contentWidth - gap) / 2;
  const height = 58;
  const metrics = [
    ["Active writing time", receipt.activeWritingTime],
    ["Revision milestones", String(receipt.milestones.length)],
    ["Final word count", receipt.finalWordCount.toLocaleString()],
    ["Large pasted additions", receipt.bulkPasteWordCount ? `${receipt.bulkPasteWordCount.toLocaleString()} words` : "None"],
  ];

  metrics.forEach(([label, value], index) => {
    const x = page.margin + (index % 2) * (width + gap);
    const y = cursor + Math.floor(index / 2) * (height + gap);
    drawBox(document, x, y, width, height);
    setTextStyle(document, 15, colors.ink, "bold");
    document.text(value, x + 10, y + 25);
    setTextStyle(document, 8, colors.muted);
    document.text(label, x + 10, y + 43);
  });

  return cursor + height * 2 + gap + 24;
}

function drawSummaryPageHeading(document: PdfDocument) {
  setTextStyle(document, 8, colors.greenDark, "bold");
  document.text("TRACE - WRITING PROCESS RECEIPT", page.margin, page.margin);
  setTextStyle(document, 18, colors.ink, "bold");
  document.text("Writing-process summary", page.margin, page.margin + 30);
  return page.margin + 54;
}

function getAnalysisHeight(document: PdfDocument, analysis: Omit<LegitimacyAnalysis, "score">) {
  let height = 82;
  height += textHeight(document, analysis.summary, contentWidth - 24, 11, 14) + 8;
  analysis.explanations.forEach((explanation) => {
    height += 18 + textHeight(document, explanation.detail, contentWidth - 42, 9, 12);
  });
  height += 54 + textHeight(document, analysis.citationAssessment.detail, contentWidth - 42, 9, 12);
  return height + 14 + textHeight(document, analysis.recommendedNextStep, contentWidth - 24, 9, 12);
}

function drawAnalysis(document: PdfDocument, cursor: number, analysis: Omit<LegitimacyAnalysis, "score">) {
  const height = getAnalysisHeight(document, analysis);
  drawBox(document, page.margin, cursor, contentWidth, height, colors.soft);
  let y = cursor + 22;
  const coverage = { strong: "Strong documented record", mixed: "Partial documented record", needs_review: "Limited documented record" } as const;

  setTextStyle(document, 14, colors.ink, "bold");
  document.text("Writing-process summary", page.margin + 12, y);
  y += 18;
  y = drawWrappedText(document, analysis.summary, page.margin + 12, y, contentWidth - 24, 11, 14, colors.ink, "bold") + 7;
  setTextStyle(document, 8, colors.muted);
  document.text(`Record coverage: ${coverage[analysis.label]}. Confidence: ${analysis.confidence}.`, page.margin + 12, y);
  y += 18;

  analysis.explanations.forEach((explanation) => {
    document.setDrawColor(...colors.green);
    document.line(page.margin + 13, y - 2, page.margin + 13, y + 17 + textHeight(document, explanation.detail, contentWidth - 42, 9, 12));
    setTextStyle(document, 9, colors.greenDark, "bold");
    document.text(explanation.title, page.margin + 22, y + 7);
    y = drawWrappedText(document, explanation.detail, page.margin + 22, y + 20, contentWidth - 42, 9, 12, colors.muted) + 8;
  });

  const citationHeight = 26 + textHeight(document, analysis.citationAssessment.detail, contentWidth - 42, 9, 12);
  drawBox(document, page.margin + 12, y, contentWidth - 24, citationHeight, colors.white);
  setTextStyle(document, 8, colors.greenDark, "bold");
  document.text("CITATION-LIKE SIGNALS OBSERVED", page.margin + 21, y + 14);
  y = drawWrappedText(document, analysis.citationAssessment.detail, page.margin + 21, y + 27, contentWidth - 42, 9, 12, colors.muted) + 8;
  setTextStyle(document, 7, colors.muted);
  document.text("Pattern matches in saved text, not verified citations or sources.", page.margin + 21, y);
  y += 18;

  setTextStyle(document, 9, colors.greenDark, "bold");
  document.text("Suggested next step:", page.margin + 12, y);
  return drawWrappedText(document, analysis.recommendedNextStep, page.margin + 12, y + 14, contentWidth - 24, 9, 12, colors.muted) + 12;
}

function drawJourneyHeading(document: PdfDocument, continued: boolean) {
  drawBox(document, page.margin, page.margin, contentWidth, 64);
  setTextStyle(document, 14, colors.ink, "bold");
  document.text(`Writing journey${continued ? " (continued)" : ""}`, page.margin + 12, page.margin + 25);
  setTextStyle(document, 10, colors.muted);
  document.text("Each milestone records a visible revision in the saved draft.", page.margin + 12, page.margin + 44);
  return page.margin + 80;
}

function getMilestoneHeight(document: PdfDocument, milestone: ReceiptMilestone) {
  return 47
    + textHeight(document, milestone.title, contentWidth - 24, 11, 14)
    + textHeight(document, milestone.text, contentWidth - 24, 10, 14)
    + getChangeEvidenceHeight(document, milestone);
}

function drawMilestone(document: PdfDocument, cursor: number, milestone: ReceiptMilestone) {
  const height = getMilestoneHeight(document, milestone);
  drawBox(document, page.margin, cursor, contentWidth, height);
  document.setDrawColor(...colors.green);
  document.line(page.margin, cursor + 5, page.margin, cursor + height - 5);
  let y = cursor + 19;
  y = drawWrappedText(document, milestone.title, page.margin + 12, y, contentWidth - 24, 11, 14, colors.ink, "bold") + 5;
  y = drawWrappedText(document, milestone.text, page.margin + 12, y, contentWidth - 24, 10, 14, [64, 80, 73]) + 12;
  y = drawChangeEvidence(document, milestone, y);
  setTextStyle(document, 8, colors.muted);
  document.text(`${milestone.dateTime} - ${milestone.duration} active writing`, page.margin + 12, y);
  return cursor + height + 12;
}

function getChangeEvidenceHeight(document: PdfDocument, milestone: ReceiptMilestone) {
  const changes = milestone.changes;
  if (!changes || (changes.added.length === 0 && changes.removed.length === 0)) return 0;

  let height = 17;
  if (changes.removed.length > 0) {
    height += 13 + changes.removed.reduce((total, entry) => total + textHeight(document, entry, contentWidth - 44, 8, 11) + 4, 0);
  }
  if (changes.added.length > 0) {
    height += 13 + changes.added.reduce((total, entry) => total + textHeight(document, entry, contentWidth - 44, 8, 11) + 4, 0);
  }
  return height + 4;
}

function drawChangeEvidence(document: PdfDocument, milestone: ReceiptMilestone, y: number) {
  const changes = milestone.changes;
  if (!changes || (changes.added.length === 0 && changes.removed.length === 0)) return y;

  setTextStyle(document, 7, colors.muted, "bold");
  document.text("CHANGED TEXT", page.margin + 12, y);
  y += 13;
  y = drawChangeEntries(document, "- REMOVED", changes.removed, y, colors.removed);
  y = drawChangeEntries(document, "+ ADDED", changes.added, y, colors.added);
  return y + 4;
}

function drawChangeEntries(document: PdfDocument, label: string, entries: string[], y: number, color: readonly number[]) {
  if (entries.length === 0) return y;
  setTextStyle(document, 8, color, "bold");
  document.text(label, page.margin + 18, y);
  y += 12;
  entries.forEach((entry) => {
    y = drawWrappedText(document, entry, page.margin + 24, y, contentWidth - 44, 8, 11, colors.ink) + 4;
  });
  return y;
}

function drawBox(document: PdfDocument, x: number, y: number, width: number, height: number, fill: readonly number[] = colors.white) {
  document.setDrawColor(...colors.border);
  document.setFillColor(...fill);
  document.roundedRect(x, y, width, height, 6, 6, "FD");
}

function drawWrappedText(document: PdfDocument, value: string, x: number, y: number, width: number, size: number, lineHeight: number, color: readonly number[], style = "normal") {
  setTextStyle(document, size, color, style);
  const lines = document.splitTextToSize(value, width);
  document.text(lines, x, y, { lineHeightFactor: lineHeight / size });
  return y + lines.length * lineHeight;
}

function textHeight(document: PdfDocument, value: string, width: number, size: number, lineHeight: number) {
  setTextStyle(document, size, colors.ink);
  return document.splitTextToSize(value, width).length * lineHeight;
}

function setTextStyle(document: PdfDocument, size: number, color: readonly number[], style = "normal") {
  document.setFont("helvetica", style);
  document.setFontSize(size);
  document.setTextColor(...color);
}

function addFooter(document: PdfDocument) {
  const pageCount = (document as unknown as { internal?: { getNumberOfPages?: () => number } }).internal?.getNumberOfPages?.() ?? 1;
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    (document as unknown as { setPage: (page: number) => void }).setPage(pageNumber);
    setTextStyle(document, 8, colors.muted);
    document.text(`Generated by Trace - saved writing-process record - ${pageNumber} of ${pageCount}`, page.width / 2 - 108, page.footerY);
  }
}

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "trace-receipt";
}
