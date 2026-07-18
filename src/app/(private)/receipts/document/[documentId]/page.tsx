import { auth } from "@clerk/nextjs/server";
import { Block } from "@blocknote/core";
import { ArrowLeft, Clock3, FileCheck2, History, PencilLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { RevisionComparisonLink } from "@/components/receipt/revision-comparison-link";
import { ReceiptPreview } from "../../[submissionId]/DynamicReceiptPreview";
import { LegitimacyAnalysisCard } from "@/components/receipt/legitimacy-analysis-card";
import {
  getLegitimacyAnalysisRefreshState,
} from "@/lib/legitimacy-analysis";
import { hashDocumentBody } from "@/lib/legitimacy-analysis.server";

export const revalidate = 0;

export default async function DocumentReceiptPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const { documentId } = await params;
  const document = await db.query.documentsTable.findFirst({
    where: { id: documentId, clerkUserId: userId },
    with: { legitimacyAnalysis: true },
  });
  if (!document) notFound();

  const milestones = await db.query.documentMilestonesTable.findMany({
    where: { documentId },
    orderBy: ({ createdAt }, { asc }) => asc(createdAt),
    columns: {
      activeSeconds: true,
      bulkPasteWordCount: true,
      content: true,
      createdAt: true,
      typedWordCount: true,
      typingWordsPerMinute: true,
      wordCount: true,
    },
  });
  const activeSeconds = milestones.reduce((total, milestone) => total + milestone.activeSeconds, 0);

  return (
    <main className="min-h-screen bg-[#f7f8f7] pb-14 text-[#1d2521]">
      <header className="border-b border-[#dbe3dc] bg-white/95 backdrop-blur">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Button variant="outline" nativeButton={false} render={<Link href={`/document/${document.id}`} />}><ArrowLeft /> Back to document</Button>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#e5f1e8] px-3 py-1.5 text-xs font-medium text-[#315943] sm:flex"><FileCheck2 className="size-3.5" /> Writing receipt</span>
        </div>
      </header>
      <div className="container mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Proof of work</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{document.title}</h1>
        <p className="mt-2 text-[#65716a]">A live record of this document’s saved writing progress.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ReceiptStat icon={Clock3} label="Active writing time" value={formatDuration(activeSeconds)} />
          <ReceiptStat icon={History} label="Revision milestones" value={String(milestones.length)} />
          <ReceiptStat icon={PencilLine} label="Current word count" value={countWords(document.content).toLocaleString()} />
        </div>

        <div className="mt-8">
          <LegitimacyAnalysisCard
            documentId={document.id}
            initialAnalysis={document.legitimacyAnalysis
              ? { ...document.legitimacyAnalysis.analysis, generatedAt: document.legitimacyAnalysis.updatedAt.toISOString() }
              : undefined}
            initialRefreshState={getLegitimacyAnalysisRefreshState({
              analysis: document.legitimacyAnalysis,
              contentHash: hashDocumentBody(document.content),
            })}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <Card className="h-fit border-[#dbe3dc] bg-[#f9fbf9]">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="size-4 text-[#315943]" /> Writing journey</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[#607067]">Milestones are captured as you save changes to this document.</p>
              {milestones.length === 0 ? <p className="mt-5 text-sm text-[#69756d]">No writing milestones have been saved yet.</p> : <ol className="mt-5 space-y-4 border-l border-[#ced9d0] pl-4">{milestones.map((milestone, index) => <li key={`${milestone.createdAt.toISOString()}-${index}`} className="relative text-sm"><span className="absolute -left-[1.28rem] top-1.5 size-2 rounded-full bg-[#78a782]" /><p className="font-medium leading-5">{milestone.bulkPasteWordCount > 0 ? `Saved after a ${milestone.bulkPasteWordCount.toLocaleString()}-word paste` : `Saved at ${milestone.wordCount.toLocaleString()} words`}</p><p className="mt-1 text-[#69756d]">{formatDateTime(milestone.createdAt)} · {formatDuration(milestone.activeSeconds)} active writing</p><MilestoneTags milestone={milestone} />{index > 0 && <div className="mt-3"><RevisionComparisonLink documentId={document.id} previous={milestones[index - 1]} current={milestone} /></div>}</li>)}</ol>}
            </CardContent>
          </Card>
          <ReceiptPreview title={document.title} content={document.content ?? []} />
        </div>
      </div>
    </main>
  );
}

function MilestoneTags({ milestone }: { milestone: { bulkPasteWordCount: number; typedWordCount: number; typingWordsPerMinute: number } }) {
  if (!milestone.bulkPasteWordCount && !milestone.typedWordCount && !milestone.typingWordsPerMinute) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {milestone.bulkPasteWordCount > 0 && <Badge className="bg-[#fbf1df] text-[#7b5725]">Bulk paste · {milestone.bulkPasteWordCount.toLocaleString()} words</Badge>}
      {milestone.typedWordCount > 0 && <Badge variant="outline" className="border-[#cfe0d2] bg-white text-[#42614a]">Typed · {milestone.typedWordCount.toLocaleString()} words</Badge>}
      {milestone.typingWordsPerMinute > 0 && <Badge variant="outline" className="border-[#cfe0d2] bg-white text-[#42614a]">Est. {milestone.typingWordsPerMinute} WPM</Badge>}
    </div>
  );
}

function ReceiptStat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <Card className="border-[#dbe3dc] bg-white"><CardContent className="pt-5"><Icon className="size-4 text-[#567160]" /><p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-sm text-[#69756d]">{label}</p></CardContent></Card>;
}

function countWords(blocks: Block[] | null) { return extractText(blocks).replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean).length; }
function extractText(value: unknown): string { if (Array.isArray(value)) return value.map(extractText).join(" "); if (!value || typeof value !== "object") return ""; const record = value as { content?: unknown; text?: unknown }; return typeof record.text === "string" ? record.text : extractText(record.content); }
function formatDuration(seconds: number) { return seconds < 60 ? seconds ? `${seconds}s` : "< 1 min" : `${Math.floor(seconds / 60)}m${seconds % 60 ? ` ${seconds % 60}s` : ""}`; }
function formatDateTime(value: Date) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value); }
