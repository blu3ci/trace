import { auth } from "@clerk/nextjs/server";
import { Archive, ClipboardList, Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssignmentForm } from "../assignment-form";
import { DueDate } from "../page";
import { AssignmentCode } from "./assignment-code";
import { hasUserRole } from "@/lib/user-role";

export const revalidate = 0;

export default async function InstructorAssignmentsPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  if (!(await hasUserRole(userId, "instructor"))) redirect("/dashboard");

  const assignments = await db.query.assignmentsTable.findMany({
    where: { clerkUserId: userId },
    orderBy: ({ dueDate, createdAt }, { asc, desc }) => [asc(dueDate), desc(createdAt)],
    with: { members: true },
  });
  const today = new Date().toISOString().slice(0, 10);
  const activeAssignments = assignments.filter((assignment) => !assignment.archivedAt);
  const archivedAssignments = assignments.filter((assignment) => assignment.archivedAt);

  return (
    <div className="container mx-auto flex max-w-6xl flex-col px-5 sm:px-8">
      <div className="shrink-0 flex flex-col gap-3 py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Teaching space</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Instructor Assignments</h1>
        <p className="max-w-2xl text-[#65716a]">Create assignments, share their codes, and see the students enrolled in each one.</p>
      </div>

      <div className="grid gap-6 pb-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[0.76fr_1.24fr] lg:grid-rows-1">
        <div className="h-fit">
          <Card className="border-[#dbe3dc] bg-[#f7faf7]">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#315943]"><Plus className="size-4" /><CardTitle>New assignment</CardTitle></div>
              <CardDescription>Add an assignment for students to join with a shared code.</CardDescription>
            </CardHeader>
            <CardContent><AssignmentForm /></CardContent>
          </Card>
        </div>

        <section aria-label="Instructor assignments" className="flex flex-col gap-4 lg:min-h-0">
          <div className="flex items-center justify-between rounded-xl border border-[#e3e7e3] bg-white px-5 py-4">
            <div><p className="font-semibold">Your assignments</p><p className="mt-0.5 text-sm text-muted-foreground">{activeAssignments.length === 0 ? "No active assignments" : `${activeAssignments.length} active`}</p></div>
            <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]"><ClipboardList className="size-5" /></span>
          </div>
          <ScrollArea className="-mx-1 h-[min(55dvh,32rem)] lg:min-h-0 lg:h-auto lg:flex-1">
            <div className="flex flex-col gap-4 p-1">
              {activeAssignments.length === 0 ? (
            <Card className="border-dashed border-[#cfd8d0] bg-[#fbfcfa] py-14 text-center"><CardContent className="flex flex-col items-center"><CardTitle>Ready to assign work?</CardTitle><CardDescription className="mt-2 max-w-sm">Create an assignment and share its code with your students.</CardDescription></CardContent></Card>
              ) : activeAssignments.map((assignment) => (
            <Card key={assignment.id} className="border-[#e0e5e0]">
              <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><CardTitle className="text-lg">{assignment.title}</CardTitle><DueDate dueDate={assignment.dueDate} isOverdue={assignment.dueDate ? assignment.dueDate < today : false} /></div></CardHeader>
              <CardContent className="flex flex-col gap-4">
                {assignment.description && <p className="whitespace-pre-wrap leading-6 text-[#607067]">{assignment.description}</p>}
                <div className="rounded-lg border border-[#dbe3dc] bg-[#f7faf7] p-3"><AssignmentCode code={assignment.accessCode} assignmentId={assignment.id} />
                  <div className="mt-3 flex items-center gap-2 text-sm text-[#607067]"><UsersRound className="size-4 shrink-0" /><p className="font-medium text-foreground">{assignment.members.length} {assignment.members.length === 1 ? "student" : "students"}</p></div>
                  <Button className="mt-4 w-full" variant="outline" nativeButton={false} render={<Link href={`/dashboard/assignments/instructor/${assignment.id}`} />}>View submissions</Button>
                </div>
              </CardContent>
            </Card>
              ))}
            </div>
          </ScrollArea>
          {archivedAssignments.length > 0 && <details className="rounded-xl border border-[#dbe3dc] bg-white">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium"><Archive className="mr-2 inline size-4 text-[#69756d]" />Archived assignments ({archivedAssignments.length})</summary>
            <div className="border-t border-[#e7ebe7] p-3">
              {archivedAssignments.map((assignment) => <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-2 py-2"><span className="font-medium">{assignment.title}</span><Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/dashboard/assignments/instructor/${assignment.id}`} />}>View submissions</Button></div>)}
            </div>
          </details>}
        </section>
      </div>
    </div>
  );
}
