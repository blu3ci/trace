import { auth, clerkClient } from "@clerk/nextjs/server";
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2, History, PencilLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Block } from "@blocknote/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { RevisionComparisonLink } from "@/components/receipt/revision-comparison-link";
import { ReceiptPreview } from "./DynamicReceiptPreview";
import { InstructorReceiptSelector } from "./instructor-receipt-selector";

export const revalidate = 0;

export default async function ReceiptPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const { submissionId } = await params;
  const submission = await db.query.assignmentSubmissionsTable.findFirst({
    where: { id: submissionId },
    with: { assignment: true, receipt: true },
  });
  if (!submission?.assignment || !submission.receipt) notFound();

  const isStudent = submission.clerkUserId === userId;
  const isInstructor = submission.assignment.clerkUserId === userId;
  if (!isStudent && !isInstructor) notFound();

  const milestones = await db.query.documentMilestonesTable.findMany({
    where: { documentId: submission.documentId },
    orderBy: ({ createdAt }, { asc }) => asc(createdAt),
    columns: { activeSeconds: true, blockCount: true, content: true, createdAt: true, wordCount: true },
  });
  const receipt = submission.receipt;
  const backHref = isInstructor ? `/dashboard/assignments/instructor/${submission.assignmentId}` : "/dashboard/assignments";
  const assignmentReceipts = isInstructor
    ? await db.query.assignmentSubmissionsTable.findMany({
      where: { assignmentId: submission.assignmentId },
      with: { receipt: { columns: { id: true } } },
      columns: { id: true, clerkUserId: true },
    })
    : [];
  const receiptSubmissions = assignmentReceipts.filter((assignmentSubmission) => assignmentSubmission.receipt);
  const studentIds = [...new Set(receiptSubmissions.map((assignmentSubmission) => assignmentSubmission.clerkUserId))];
  const students = studentIds.length === 0 ? [] : await getUsers(studentIds);
  const studentNames = new Map(students.map((student) => [student.id, formatName(student)]));

  return (
    <main className="min-h-screen bg-[#f7f8f7] pb-14 text-[#1d2521]">
      <header className="border-b border-[#dbe3dc] bg-white/95 backdrop-blur">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Button variant="outline" nativeButton={false} render={<Link href={backHref} />}>
            <ArrowLeft /> Back
          </Button>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#e5f1e8] px-3 py-1.5 text-xs font-medium text-[#315943] sm:flex"><CheckCircle2 className="size-3.5" /> Verified submission receipt</span>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Proof of work</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{submission.assignment.title}</h1>
        <p className="mt-2 text-[#65716a]">Submitted {formatDateTime(receipt.submittedAt)} · Final document preserved at submission.</p>
        {isInstructor && (
          <InstructorReceiptSelector
            submissionId={submission.id}
            receipts={receiptSubmissions.map((assignmentSubmission) => ({
              submissionId: assignmentSubmission.id,
              studentName: studentNames.get(assignmentSubmission.clerkUserId) ?? "Student",
            }))}
          />
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ReceiptStat icon={Clock3} label="Active writing time" value={formatDuration(receipt.activeSeconds)} />
          <ReceiptStat icon={History} label="Revision milestones" value={String(receipt.revisionCount)} />
          <ReceiptStat icon={PencilLine} label="Final word count" value={receipt.finalWordCount.toLocaleString()} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <Card className="h-fit border-[#dbe3dc] bg-[#f9fbf9]">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="size-4 text-[#315943]" /> Writing journey</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[#607067]">Each milestone describes the visible change in the draft since the previous saved moment.</p>
              <ol className="mt-5 space-y-4 border-l border-[#ced9d0] pl-4">
                {milestones.length === 0 ? <li className="text-sm text-[#69756d]">This submission was completed before receipt tracking began.</li> : milestones.map((milestone, index) => { const summary = summarizeMilestone(milestone, milestones[index - 1]); return <li key={`${milestone.createdAt.toISOString()}-${index}`} className="relative text-sm"><span className="absolute -left-[1.28rem] top-1.5 size-2 rounded-full bg-[#78a782]" /><p className="font-medium leading-5">{summary.title}</p><p className="mt-1 leading-5 text-[#607067]">{summary.text}</p><p className="mt-1 text-[#69756d]">{formatDateTime(milestone.createdAt)} · {formatDuration(milestone.activeSeconds)} active writing</p>{index > 0 && <div className="mt-3"><RevisionComparisonLink documentId={submission.documentId} previous={milestones[index - 1]} current={milestone} /></div>}</li>; })}
              </ol>
            </CardContent>
          </Card>
          <ReceiptPreview title={submission.assignment.title} content={receipt.finalContent as Block[]} />
        </div>
      </div>
    </main>
  );
}

function ReceiptStat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <Card className="border-[#dbe3dc] bg-white"><CardContent className="pt-5"><Icon className="size-4 text-[#567160]" /><p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-sm text-[#69756d]">{label}</p></CardContent></Card>;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return seconds ? `${seconds}s` : "< 1 min";
  return `${Math.floor(seconds / 60)}m${seconds % 60 ? ` ${seconds % 60}s` : ""}`;
}

function summarizeMilestone(
  milestone: { blockCount: number; content: Block[] | null; wordCount: number },
  previous: { blockCount: number; content: Block[] | null; wordCount: number } | undefined,
) {
  const currentBlocks = blockTexts(milestone.content);
  const previousBlocks = blockTexts(previous?.content);
  const words = milestone.wordCount.toLocaleString();
  if (!previous) {
    return {
      title: "Set the first direction",
      text: currentBlocks[0]
        ? `The first saved draft establishes its opening in ${words} words.`
        : `The first saved draft took shape at ${words} words.`,
    };
  }

  if (!milestone.content || !previous.content) {
    return legacySummary(milestone, previous);
  }

  const additions = currentBlocks.filter((block) => !previousBlocks.some((previousBlock) => sameBlock(block, previousBlock)));
  const removals = previousBlocks.filter((block) => !currentBlocks.some((currentBlock) => sameBlock(block, currentBlock)));

  if (additions.length > 0 && removals.length > 0) {
    const change = changedWords(removals[0], additions[0]);
    if (change.removed && change.added) {
      return {
        title: "Rework the draft",
        text: `The draft replaces “${excerpt(change.removed)}” with “${excerpt(change.added)}”.`,
      };
    }
    return { title: "Rework the draft", text: `A passage is rewritten, bringing the draft to ${words} words.` };
  }
  if (additions.length > 0) {
    return { title: "Develop the draft", text: `New material adds “${excerpt(additions[0])}”, bringing the draft to ${words} words.` };
  }
  if (removals.length > 0) {
    return { title: "Refine the draft", text: `The draft removes “${excerpt(removals[0])}” and settles at ${words} words.` };
  }
  return { title: "Revise the language", text: `The draft is revised while holding at ${words} words; this saved moment preserves the updated phrasing.` };
}

function legacySummary(
  milestone: { blockCount: number; wordCount: number },
  previous: { blockCount: number; wordCount: number },
) {
  const words = milestone.wordCount.toLocaleString();

  const wordChange = milestone.wordCount - previous.wordCount;
  const blockChange = milestone.blockCount - previous.blockCount;
  if (wordChange > 0) {
    return { title: "Develop the draft", text: `The draft grew by ${wordChange.toLocaleString()} words, reaching ${words} words.` };
  }
  if (wordChange < 0) {
    return { title: "Refine the draft", text: `The draft was refined by ${Math.abs(wordChange).toLocaleString()} words, settling at ${words} words.` };
  }
  if (blockChange > 0) {
    return { title: "Develop the draft", text: `The draft was expanded into ${blockChange} additional writing block${blockChange === 1 ? "" : "s"} while holding at ${words} words.` };
  }
  if (blockChange < 0) {
    return { title: "Refine the draft", text: `The draft was consolidated into fewer writing blocks while holding at ${words} words.` };
  }
  return { title: "Revise the language", text: `A revision was saved while the draft held steady at ${words} words.` };
}

function blockTexts(blocks: Block[] | null | undefined) {
  return (blocks ?? []).map((block) => extractText((block as unknown as { content: unknown }).content)).filter(Boolean);
}

function extractText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as { content?: unknown; text?: unknown };
  if (typeof record.text === "string") return record.text;
  return extractText(record.content);
}

function sameBlock(first: string, second: string) {
  return first.replace(/\s+/g, " ").trim().toLocaleLowerCase() === second.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function changedWords(previous: string, current: string) {
  const previousWords = normalizeWords(previous);
  const currentWords = normalizeWords(current);
  let start = 0;

  while (start < previousWords.length && start < currentWords.length && sameWord(previousWords[start], currentWords[start])) {
    start += 1;
  }

  let previousEnd = previousWords.length;
  let currentEnd = currentWords.length;
  while (previousEnd > start && currentEnd > start && sameWord(previousWords[previousEnd - 1], currentWords[currentEnd - 1])) {
    previousEnd -= 1;
    currentEnd -= 1;
  }

  return {
    removed: previousWords.slice(start, previousEnd).join(" "),
    added: currentWords.slice(start, currentEnd).join(" "),
  };
}

function normalizeWords(value: string) {
  return value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function sameWord(first: string, second: string) {
  return first.toLocaleLowerCase() === second.toLocaleLowerCase();
}

function excerpt(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 64) return normalized;
  return `${normalized.slice(0, 61).replace(/\s+\S*$/, "")}…`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function formatName(user: { firstName: string | null; lastName: string | null; username: string | null; emailAddresses: Array<{ emailAddress: string }> }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.emailAddresses[0]?.emailAddress || "Student";
}

async function getUsers(userIds: string[]) {
  const client = await clerkClient();
  const responses = await Promise.all(Array.from({ length: Math.ceil(userIds.length / 100) }, (_, index) => {
    const ids = userIds.slice(index * 100, (index + 1) * 100);
    return client.users.getUserList({ userId: ids, limit: ids.length });
  }));

  return responses.flatMap((response) => response.data);
}
