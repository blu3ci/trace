import { auth, clerkClient } from "@clerk/nextjs/server";
import { ClipboardList, KeyRound, Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssignmentForm } from "../assignment-form";
import { DueDate } from "../page";

export const revalidate = 0;

export default async function InstructorAssignmentsPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const assignments = await db.query.assignmentsTable.findMany({
    where: { clerkUserId: userId },
    orderBy: ({ dueDate, createdAt }, { asc, desc }) => [asc(dueDate), desc(createdAt)],
    with: { members: true, submissions: { with: { receipt: { columns: { id: true } } } } },
  });
  const studentIds = [...new Set(assignments.flatMap((assignment) => assignment.members.map((member) => member.clerkUserId)))];
  const students = studentIds.length === 0 ? [] : await getUsers(studentIds);
  const profiles = new Map(students.map((student) => [student.id, {
    name: formatName(student),
    email: student.emailAddresses.find((email) => email.id === student.primaryEmailAddressId)?.emailAddress,
    imageUrl: student.imageUrl,
  }]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container mx-auto flex max-w-6xl flex-col px-5 sm:px-8">
      <div className="shrink-0 flex flex-col gap-3 py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Teaching space</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Instructor Assignments</h1>
        <p className="max-w-xl text-[#65716a]">Create assignments, share their codes, and see the students enrolled in each one.</p>
        <div><Button variant="link" className="h-auto px-0" nativeButton={false} render={<Link href="/dashboard/assignments" />}>Back to my assignments</Button></div>
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
            <div><p className="font-semibold">Your assignments</p><p className="mt-0.5 text-sm text-muted-foreground">{assignments.length === 0 ? "No assignments created" : `${assignments.length} created`}</p></div>
            <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]"><ClipboardList className="size-5" /></span>
          </div>
          <ScrollArea className="-mx-1 h-[min(55dvh,32rem)] lg:min-h-0 lg:h-auto lg:flex-1">
            <div className="flex flex-col gap-4 p-1">
              {assignments.length === 0 ? (
            <Card className="border-dashed border-[#cfd8d0] bg-[#fbfcfa] py-14 text-center"><CardContent className="flex flex-col items-center"><CardTitle>Ready to assign work?</CardTitle><CardDescription className="mt-2 max-w-sm">Create an assignment and share its code with your students.</CardDescription></CardContent></Card>
              ) : assignments.map((assignment) => (
            <Card key={assignment.id} className="border-[#e0e5e0]">
              <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><CardTitle className="text-lg">{assignment.title}</CardTitle><DueDate dueDate={assignment.dueDate} isOverdue={assignment.dueDate ? assignment.dueDate < today : false} /></div></CardHeader>
              <CardContent className="flex flex-col gap-4">
                {assignment.description && <p className="whitespace-pre-wrap leading-6 text-[#607067]">{assignment.description}</p>}
                <div className="rounded-lg border border-[#dbe3dc] bg-[#f7faf7] p-3"><div className="flex items-center gap-2 text-sm font-medium text-[#315943]"><KeyRound className="size-4" /> Assignment code: <span className="font-mono tracking-widest">{assignment.accessCode}</span></div>
                  <div className="mt-3 flex items-start gap-2 text-sm text-[#607067]"><UsersRound className="mt-0.5 size-4 shrink-0" /><div><p className="font-medium text-foreground">Assigned students ({assignment.members.length})</p>{assignment.members.length === 0 ? <p className="mt-1">No students have joined yet.</p> : <ul className="mt-2 flex flex-col gap-2">{assignment.members.map((member) => { const profile = profiles.get(member.clerkUserId); const name = profile?.name ?? "Student"; return <li key={member.clerkUserId} className="flex items-center gap-2"><Avatar size="sm">{profile?.imageUrl && <AvatarImage src={profile.imageUrl} alt="" />}<AvatarFallback>{initials(name)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium text-foreground">{name}</p>{profile?.email && <p className="truncate text-xs text-muted-foreground">{profile.email}</p>}</div></li>; })}</ul>}</div></div>
                  <div className="mt-4 border-t border-[#dbe3dc] pt-3"><p className="text-sm font-medium text-foreground">Submitted receipts ({assignment.submissions.filter((submission) => submission.receipt).length})</p>{assignment.submissions.filter((submission) => submission.receipt).length === 0 ? <p className="mt-1 text-sm text-[#607067]">No submitted receipts yet.</p> : <ul className="mt-2 flex flex-col gap-2">{assignment.submissions.filter((submission) => submission.receipt).map((submission) => { const profile = profiles.get(submission.clerkUserId); const name = profile?.name ?? "Student"; return <li key={submission.id} className="flex items-center justify-between gap-3"><span className="truncate text-sm text-[#405049]">{name}</span><Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/receipts/${submission.id}`} />}>View receipt</Button></li>; })}</ul>}</div>
                </div>
              </CardContent>
            </Card>
              ))}
            </div>
          </ScrollArea>
        </section>
      </div>
    </div>
  );
}

function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function formatName(user: { firstName: string | null; lastName: string | null; username: string | null; emailAddresses: Array<{ emailAddress: string }> }) { return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.emailAddresses[0]?.emailAddress || "Student"; }
async function getUsers(userIds: string[]) { const client = await clerkClient(); const responses = await Promise.all(Array.from({ length: Math.ceil(userIds.length / 100) }, (_, index) => { const ids = userIds.slice(index * 100, (index + 1) * 100); return client.users.getUserList({ userId: ids, limit: ids.length }); })); return responses.flatMap((response) => response.data); }
