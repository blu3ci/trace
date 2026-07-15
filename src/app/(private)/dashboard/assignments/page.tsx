import { auth } from "@clerk/nextjs/server";
import { CalendarDays, ClipboardList, KeyRound, Plus, Tag, UsersRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { AssignmentForm } from "./assignment-form";
import { JoinAssignmentForm } from "./join-assignment-form";

export const revalidate = 0;

export default async function AssignmentsPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const [ownedAssignments, memberships] = await Promise.all([
    db.query.assignmentsTable.findMany({
      where: { clerkUserId: userId },
      orderBy: ({ dueDate, createdAt }, { asc, desc }) => [asc(dueDate), desc(createdAt)],
    }),
    db.query.assignmentMembersTable.findMany({ where: { clerkUserId: userId } }),
  ]);
  const enrolledAssignmentIds = memberships.map((membership) => membership.assignmentId);
  const enrolledAssignments = enrolledAssignmentIds.length === 0
    ? []
    : await db.query.assignmentsTable.findMany({
      where: { id: { in: enrolledAssignmentIds } },
    });
  const ownedAssignmentIds = ownedAssignments.map((assignment) => assignment.id);
  const assignmentMembers = ownedAssignmentIds.length === 0
    ? []
    : await db.query.assignmentMembersTable.findMany({
      where: { assignmentId: { in: ownedAssignmentIds } },
    });
  const assignments = [...new Map(
    [...ownedAssignments, ...enrolledAssignments].map((assignment) => [assignment.id, assignment]),
  ).values()].sort((first, second) => {
    const dueDateOrder = (first.dueDate ?? "9999-12-31").localeCompare(second.dueDate ?? "9999-12-31");
    return dueDateOrder || second.createdAt.getTime() - first.createdAt.getTime();
  });
  const membersByAssignment = new Map<string, typeof assignmentMembers>();
  for (const member of assignmentMembers) {
    const members = membersByAssignment.get(member.assignmentId) ?? [];
    members.push(member);
    membersByAssignment.set(member.assignmentId, members);
  }
  const today = new Date().toISOString().slice(0, 10);
  const upcomingCount = assignments.filter((assignment) => assignment.dueDate && assignment.dueDate >= today).length;

  return (
    <div className="container mx-auto max-w-6xl px-5 pb-12 sm:px-8">
      <div className="flex flex-col gap-2 py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Planning space</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">My Assignments</h1>
        <p className="max-w-xl text-[#65716a]">Keep the work you need to do alongside the documents where you do it.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.76fr_1.24fr]">
        <div className="flex h-fit flex-col gap-6">
          <Card className="border-[#dbe3dc] bg-[#f7faf7]">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#315943]">
                <Plus className="size-4" />
                <CardTitle>New assignment</CardTitle>
              </div>
              <CardDescription>Add the work you want to keep visible in Trace.</CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentForm />
            </CardContent>
          </Card>
          <Card className="border-[#dbe3dc]">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#315943]">
                <KeyRound className="size-4" />
                <CardTitle>Join an assignment</CardTitle>
              </div>
              <CardDescription>Enter the six-digit code shared by your instructor.</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinAssignmentForm />
            </CardContent>
          </Card>
        </div>

        <section aria-label="Assignments" className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-[#e3e7e3] bg-white px-5 py-4">
            <div>
              <p className="font-semibold">Your workload</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {assignments.length === 0 ? "No assignments yet" : `${assignments.length} tracked · ${upcomingCount} upcoming`}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]"><ClipboardList className="size-5" /></span>
          </div>

          {assignments.length === 0 ? (
            <Card className="border-dashed border-[#cfd8d0] bg-[#fbfcfa] py-14 text-center">
              <CardContent className="flex flex-col items-center">
                <span className="grid size-12 place-items-center rounded-full bg-[#e9f0e9] text-[#567160]"><ClipboardList className="size-6" /></span>
                <CardTitle className="mt-4">Nothing due yet</CardTitle>
                <CardDescription className="mt-2 max-w-sm">Add an assignment to create a simple, personal view of the work ahead.</CardDescription>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const isOverdue = assignment.dueDate ? assignment.dueDate < today : false;
              const isOwner = assignment.clerkUserId === userId;
              const members = membersByAssignment.get(assignment.id) ?? [];
              return (
                <Card key={assignment.id} className="border-[#e0e5e0] transition-shadow hover:shadow-sm">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        {assignment.course && <CardDescription className="mt-1 flex items-center gap-1.5"><Tag className="size-3" /> {assignment.course}</CardDescription>}
                      </div>
                      {assignment.dueDate ? (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isOverdue ? "bg-[#fbe9e7] text-[#9b332a]" : "bg-[#e5f1e8] text-[#315943]"}`}>
                          <CalendarDays className="size-3.5" /> {isOverdue ? "Overdue" : `Due ${formatDate(assignment.dueDate)}`}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f0f1ef] px-2.5 py-1 text-xs font-medium text-[#69756d]">No due date</span>
                      )}
                    </div>
                  </CardHeader>
                  {(assignment.description || isOwner) && (
                    <CardContent className="flex flex-col gap-4">
                      {assignment.description && <p className="whitespace-pre-wrap leading-6 text-[#607067]">{assignment.description}</p>}
                      {isOwner && (
                        <div className="rounded-lg border border-[#dbe3dc] bg-[#f7faf7] p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#315943]">
                            <KeyRound className="size-4" /> Assignment code: <span className="font-mono tracking-widest">{assignment.accessCode}</span>
                          </div>
                          <div className="mt-3 flex items-start gap-2 text-sm text-[#607067]">
                            <UsersRound className="mt-0.5 size-4 shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">Assigned students ({members.length})</p>
                              {members.length === 0 ? (
                                <p className="mt-1">No students have joined yet.</p>
                              ) : (
                                <ul className="mt-1 break-all">
                                  {members.map((member) => <li key={member.clerkUserId}>{member.clerkUserId}</li>)}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}
