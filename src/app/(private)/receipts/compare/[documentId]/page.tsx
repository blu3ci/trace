import { auth } from "@clerk/nextjs/server";
import { Block } from "@blocknote/core";
import { ArrowLeft, Columns2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { ReceiptPreview } from "../../[submissionId]/DynamicReceiptPreview";

export const revalidate = 0;

export default async function RevisionComparisonPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const [{ documentId }, { from, to }] = await Promise.all([params, searchParams]);
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) notFound();

  const document = await db.query.documentsTable.findFirst({ where: { id: documentId } });
  const submission = await db.query.assignmentSubmissionsTable.findFirst({
    where: { documentId },
    with: { assignment: true, receipt: { columns: { id: true } } },
  });
  const isDocumentOwner = document?.clerkUserId === userId;
  const isInstructor = submission?.assignment?.clerkUserId === userId;
  if (!document || (!isDocumentOwner && !isInstructor)) notFound();

  const milestones = await db.query.documentMilestonesTable.findMany({
    where: { documentId },
    columns: { content: true, createdAt: true },
  });
  const previous = milestones.find((milestone) => milestone.createdAt.getTime() === fromDate.getTime());
  const current = milestones.find((milestone) => milestone.createdAt.getTime() === toDate.getTime());
  if (!previous?.content || !current?.content) notFound();

  const backHref = submission?.receipt ? `/receipts/${submission.id}` : `/receipts/document/${documentId}`;
  const changes = findChanges(previous.content, current.content);

  return (
    <main className="min-h-screen bg-[#f7f8f7] pb-14 text-[#1d2521]">
      <header className="border-b border-[#dbe3dc] bg-white/95 backdrop-blur">
        <div className="container mx-auto flex max-w-[90rem] items-center gap-4 px-5 py-4 sm:px-8">
          <Button variant="outline" nativeButton={false} render={<Link href={backHref} />}><ArrowLeft /> Back to receipt</Button>
        </div>
      </header>
      <div className="container mx-auto max-w-[90rem] px-5 py-8 sm:px-8 sm:py-10">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase"><Columns2 className="size-4" /> Revision comparison</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{document.title}</h1>
        <p className="mt-2 text-[#65716a]">Compare two consecutive saved versions side by side.</p>
        <section className="mt-8" aria-label="Revision changes">
          <h2 className="text-lg font-semibold">What changed</h2>
          {changes.added.length === 0 && changes.removed.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-[#cfd8d0] bg-[#fbfcfa] p-4 text-sm text-[#607067]">No text changes were detected between these saved revisions.</p>
          ) : (
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <ChangeList icon={Minus} title="Removed" entries={changes.removed} className="border-red-200 bg-red-50 text-red-950" />
              <ChangeList icon={Plus} title="Added" entries={changes.added} className="border-emerald-200 bg-emerald-50 text-emerald-950" />
            </div>
          )}
        </section>
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <ReceiptPreview title={document.title} label={`Previous · ${formatDateTime(previous.createdAt)}`} content={previous.content as Block[]} />
          <ReceiptPreview title={document.title} label={`Current · ${formatDateTime(current.createdAt)}`} content={current.content as Block[]} />
        </div>
      </div>
    </main>
  );
}

function parseDate(value: string | undefined) { if (!value) return undefined; const date = new Date(value); return Number.isNaN(date.getTime()) ? undefined : date; }
function formatDateTime(value: Date) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value); }

function ChangeList({ icon: Icon, title, entries, className }: { icon: typeof Plus; title: string; entries: string[]; className: string }) {
  return <section className={`rounded-lg border p-4 ${className}`}><h3 className="flex items-center gap-1.5 font-medium"><Icon className="size-4" /> {title}</h3>{entries.length === 0 ? <p className="mt-3 text-sm opacity-70">None</p> : <ul className="mt-3 space-y-2 text-sm leading-6">{entries.map((entry, index) => <li key={`${entry}-${index}`} className="rounded bg-white/60 p-2">{entry}</li>)}</ul>}</section>;
}

function findChanges(previousContent: Block[], currentContent: Block[]) {
  const previous = blockTexts(previousContent);
  const current = blockTexts(currentContent);
  const previousOnly = previous.filter((block) => !current.some((currentBlock) => sameBlock(block, currentBlock)));
  const currentOnly = current.filter((block) => !previous.some((previousBlock) => sameBlock(block, previousBlock)));
  const removed: string[] = [];
  const added: string[] = [];

  const pairedBlocks = Math.min(previousOnly.length, currentOnly.length);
  for (let index = 0; index < pairedBlocks; index += 1) {
    const sentenceChanges = findSentenceChanges(previousOnly[index], currentOnly[index]);
    removed.push(...sentenceChanges.removed);
    added.push(...sentenceChanges.added);
  }

  return {
    removed: [...removed, ...previousOnly.slice(pairedBlocks).flatMap(splitSentences)],
    added: [...added, ...currentOnly.slice(pairedBlocks).flatMap(splitSentences)],
  };
}

function blockTexts(blocks: Block[]) { return blocks.map((block) => extractText((block as unknown as { content: unknown }).content)).filter(Boolean); }
function extractText(value: unknown): string { if (Array.isArray(value)) return value.map(extractText).join(" "); if (!value || typeof value !== "object") return ""; const record = value as { content?: unknown; text?: unknown }; return typeof record.text === "string" ? record.text : extractText(record.content); }
function sameBlock(first: string, second: string) { return first.replace(/\s+/g, " ").trim().toLocaleLowerCase() === second.replace(/\s+/g, " ").trim().toLocaleLowerCase(); }

function findSentenceChanges(previous: string, current: string) {
  const previousSentences = splitSentences(previous);
  const currentSentences = splitSentences(current);
  return {
    removed: previousSentences.filter((sentence) => !currentSentences.some((currentSentence) => sameSentence(sentence, currentSentence))),
    added: currentSentences.filter((sentence) => !previousSentences.some((previousSentence) => sameSentence(sentence, previousSentence))),
  };
}

function splitSentences(value: string) {
  return value.replace(/\s+/g, " ").trim().match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

function sameSentence(first: string, second: string) {
  return first.replace(/\s+/g, " ").trim().toLocaleLowerCase() === second.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}
