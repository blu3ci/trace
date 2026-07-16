import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { Block } from "@blocknote/core";
import { CalendarDays, CheckCircle2, ClipboardList, Ellipsis, FilePlusCorner, FileText } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();

  if (userId == null) return redirectToSignIn();

  const [documents, submissions] = await Promise.all([
    db.query.documentsTable.findMany({
      where: {
        clerkUserId: userId,
      },
      orderBy: ({ updatedAt }, { desc }) => desc(updatedAt),
    }),
    db.query.assignmentSubmissionsTable.findMany({
      where: { clerkUserId: userId },
      columns: { documentId: true, submittedAt: true },
      with: {
        assignment: {
          columns: { title: true, dueDate: true },
        },
      },
    }),
  ]);
  const assignmentsByDocumentId = new Map(
    submissions
      .filter((submission) => submission.assignment != null)
      .map((submission) => [
        submission.documentId,
        { ...submission.assignment!, submittedAt: submission.submittedAt },
      ]),
  );

  return (
    <div className="container mx-auto max-w-6xl px-5 pb-12 sm:px-8">
      <div className="flex flex-col gap-2 py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Writing space</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">My Documents</h1>
        <p className="max-w-xl text-[#65716a]">Keep your ideas, drafts, and finished work together in one calm place.</p>
      </div>
      <section aria-label="Documents">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CreateDocument />
          {documents.map(({ id, title, content }) => (
            <Document
              key={id}
              id={id}
              title={title}
              content={content}
              assignment={assignmentsByDocumentId.get(id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CreateDocument() {
  return (
    <Link href={`/document/new`} className="group">
      <Card className="h-full min-h-52 border-dashed border-[#bfd0c2] bg-[#f7faf7] transition-shadow group-hover:shadow-sm">
        <CardContent className="flex h-full min-h-52 flex-col items-center justify-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]">
            <FilePlusCorner className="size-6" />
          </span>
          <div>
            <CardTitle>New document</CardTitle>
            <CardDescription className="mt-1">Start with a blank page.</CardDescription>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Document({
  id,
  title,
  content,
  assignment,
}: {
  id: string;
  title: string;
  content: Block[] | null;
  assignment?: { title: string; dueDate: string | null; submittedAt: Date | null };
}) {
  const preview = getDocumentPreview(content);
  const submissionStatus = assignment?.submittedAt
    ? assignment.dueDate && wasSubmittedLate(assignment.submittedAt, assignment.dueDate)
      ? "Submitted late"
      : assignment.dueDate
        ? "Submitted on time"
        : "Submitted"
    : null;

  return (
    <div className="relative h-full">
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 z-10 text-[#607067]"
        aria-label={`Manage ${title}`}
        nativeButton={false}
        render={<Link href={`/document/${id}/settings`} />}
      >
        <Ellipsis />
      </Button>
      <Link href={`/document/${id}`} className="group block h-full">
        <Card className="h-full min-h-52 border-[#e0e5e0] transition-shadow group-hover:shadow-sm">
          <CardHeader>
            <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]">
              <FileText className="size-5" />
            </span>
          </CardHeader>
          <CardContent className="grow">
            <div className="min-h-20 rounded-lg border border-[#edf0ed] bg-[#fbfcfa] px-3 py-2.5 text-sm leading-5 text-[#607067]">
              {preview ? (
                <p className="line-clamp-3 whitespace-pre-wrap">{preview}</p>
              ) : (
                <p className="text-[#8a968e]">No text yet — open to start writing.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start border-[#e0e5e0] bg-[#f7faf7]">
            <CardTitle className="line-clamp-2">{title}</CardTitle>
            {assignment ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-[#e5f1e8] text-[#315943]">
                  <ClipboardList /> Assignment
                </Badge>
                {submissionStatus ? (
                  <CardDescription className={submissionStatus === "Submitted late" ? "flex items-center gap-1 text-[#9b332a]" : "flex items-center gap-1 text-[#315943]"}>
                    <CheckCircle2 className="size-3.5" /> {submissionStatus}
                  </CardDescription>
                ) : (
                  <CardDescription className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : "No due date"}
                  </CardDescription>
                )}
              </div>
            ) : (
              <CardDescription className="mt-1">Click to edit document</CardDescription>
            )}
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}

function wasSubmittedLate(submittedAt: Date, dueDate: string) {
  return submittedAt.toISOString().slice(0, 10) > dueDate;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function getDocumentPreview(blocks: Block[] | null): string {
  return getBlockText(blocks ?? [])
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function getBlockText(blocks: Block[]): string {
  return blocks
    .flatMap((block) => {
      const inlineText = Array.isArray(block.content)
        ? block.content
          .map((inlineContent) => {
            if (inlineContent.type === "text") return inlineContent.text;
            if (inlineContent.type === "link") {
              return inlineContent.content.map((text) => text.text).join("");
            }

            return "";
          })
          .join("")
        : "";

      return [inlineText, getBlockText(block.children)];
    })
    .join(" ");
}
