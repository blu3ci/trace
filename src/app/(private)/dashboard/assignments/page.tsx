import { auth } from "@clerk/nextjs/server";
import { CalendarDays, CheckCircle2, ClipboardList, FilePenLine, FilePlus, KeyRound, Tag } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createAssignmentSubmission,
  submitAssignmentSubmissionFromForm,
} from "@/server/actions/documents";
import { JoinAssignmentForm } from "./join-assignment-form";

export const revalidate = 0;

export default async function AssignmentsPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const memberships = await db.query.assignmentMembersTable.findMany({ where: { clerkUserId: userId } });
  const assignmentIds = memberships.map((membership) => membership.assignmentId);
  const assignments = assignmentIds.length === 0
    ? []
    : await db.query.assignmentsTable.findMany({
      where: { id: { in: assignmentIds } },
      orderBy: ({ dueDate, createdAt }, { asc, desc }) => [asc(dueDate), desc(createdAt)],
    });
  const submissions = assignmentIds.length === 0
    ? []
    : await db.query.assignmentSubmissionsTable.findMany({
      where: { assignmentId: { in: assignmentIds }, clerkUserId: userId },
      columns: { id: true, assignmentId: true, documentId: true, submittedAt: true },
      with: { receipt: { columns: { id: true } } },
    });
  const submissionsByAssignment = new Map(
    submissions.map((submission) => [submission.assignmentId, submission]),
  );
  const today = new Date().toISOString().slice(0, 10);
  const activeAssignments = assignments.filter((assignment) => !assignment.archivedAt);
  const upcomingCount = activeAssignments.filter((assignment) => assignment.dueDate && assignment.dueDate >= today).length;

  return (
    <div className="container mx-auto flex max-w-6xl flex-col px-5 sm:px-8 lg:h-[calc(100dvh-5rem)] lg:overflow-hidden">
      <div className="shrink-0 flex flex-col gap-2 py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Learning space</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">My Assignments</h1>
        <p className="max-w-xl text-[#65716a]">See the assignments you’ve joined and keep track of what’s due next.</p>
      </div>

      <div className="grid gap-6 pb-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[0.76fr_1.24fr] lg:grid-rows-1">
        <div className="flex h-fit flex-col gap-6">
            <Card className="border-[#dbe3dc] bg-[#f7faf7]">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#315943]">
                <KeyRound className="size-4" />
                <CardTitle>Join an assignment</CardTitle>
              </div>
              <CardDescription>Enter the code shared by your instructor.</CardDescription>
            </CardHeader>
            <CardContent><JoinAssignmentForm /></CardContent>
            </Card>
            <Card className="border-[#dbe3dc]">
            <CardHeader>
              <CardTitle>Teaching a class?</CardTitle>
              <CardDescription>Create assignments and see which students have joined them in your instructor space.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/assignments/instructor" />}>
                Instructor assignments
              </Button>
            </CardContent>
            </Card>
        </div>

        <section aria-label="My assignments" className="flex flex-col gap-4 lg:min-h-0">
          <div className="flex items-center justify-between rounded-xl border border-[#e3e7e3] bg-white px-5 py-4">
            <div>
              <p className="font-semibold">Your workload</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {activeAssignments.length === 0 ? "No assignments yet" : `${activeAssignments.length} joined · ${upcomingCount} upcoming`}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]"><ClipboardList className="size-5" /></span>
          </div>

          <ScrollArea className="-mx-1 h-[min(55dvh,32rem)] lg:min-h-0 lg:h-auto lg:flex-1">
            <div className="flex flex-col gap-4 p-1">
              {activeAssignments.length === 0 ? (
                <Card className="border-dashed border-[#cfd8d0] bg-[#fbfcfa] py-14 text-center">
                  <CardContent className="flex flex-col items-center">
                    <span className="grid size-12 place-items-center rounded-full bg-[#e9f0e9] text-[#567160]"><ClipboardList className="size-6" /></span>
                    <CardTitle className="mt-4">Nothing due yet</CardTitle>
                    <CardDescription className="mt-2 max-w-sm">Join an assignment with an instructor’s code to see it here.</CardDescription>
                  </CardContent>
                </Card>
              ) : activeAssignments.map((assignment) => {
                const isOverdue = assignment.dueDate ? assignment.dueDate < today : false;
                const submission = submissionsByAssignment.get(assignment.id);
                return (
                  <Card key={assignment.id} className="border-[#e0e5e0] transition-shadow hover:shadow-sm">
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          {assignment.course && <CardDescription className="mt-1 flex items-center gap-1.5"><Tag className="size-3" /> {assignment.course}</CardDescription>}
                        </div>
                        <DueDate dueDate={assignment.dueDate} isOverdue={isOverdue} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {assignment.description && <p className="whitespace-pre-wrap leading-6 text-[#607067]">{assignment.description}</p>}
                      {submission ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" nativeButton={false} render={<Link href={`/document/${submission.documentId}`} />}>
                            <FilePenLine className="size-4" /> {submission.submittedAt ? "View submission" : "Continue submission"}
                          </Button>
                          {submission.submittedAt ? (
                            <>
                              <Badge className={isLateSubmission(submission.submittedAt, assignment.dueDate) ? "bg-[#fbe9e7] text-[#9b332a]" : "bg-[#e5f1e8] text-[#315943]"}>
                                <CheckCircle2 /> {isLateSubmission(submission.submittedAt, assignment.dueDate) ? "Submitted late" : "Submitted"}
                              </Badge>
                              {submission.receipt && <Button variant="outline" nativeButton={false} render={<Link href={`/receipts/${submission.id}`} />}>View receipt</Button>}
                            </>
                          ) : (
                            <form action={submitAssignmentSubmissionFromForm.bind(null, assignment.id)}>
                              <Button type="submit">
                                <CheckCircle2 className="size-4" /> Mark as submitted
                              </Button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <form action={createAssignmentSubmission.bind(null, assignment.id)}>
                          <Button type="submit">
                            <FilePlus className="size-4" /> Start submission
                          </Button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </section>
      </div>
    </div>
  );
}

export function DueDate({ dueDate, isOverdue }: { dueDate: string | null; isOverdue: boolean }) {
  if (!dueDate) return <span className="rounded-full bg-[#f0f1ef] px-2.5 py-1 text-xs font-medium text-[#69756d]">No due date</span>;

  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isOverdue ? "bg-[#fbe9e7] text-[#9b332a]" : "bg-[#e5f1e8] text-[#315943]"}`}>
    <CalendarDays className="size-3.5" /> {isOverdue ? "Overdue" : dueDate === new Date().toISOString().slice(0, 10) ? "Due today" : `Due ${formatDate(dueDate)}`}
  </span>;
}

function isLateSubmission(submittedAt: Date | null, dueDate: string | null) {
  return Boolean(submittedAt && dueDate && submittedAt.toISOString().slice(0, 10) > dueDate);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}
