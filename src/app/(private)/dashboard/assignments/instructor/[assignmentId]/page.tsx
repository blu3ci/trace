import { auth, clerkClient } from "@clerk/nextjs/server";
import { Archive, ArrowLeft, CheckCircle2, Clock3, FileCheck2, UserRoundX, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { DueDate, formatDate } from "../../page";
import { AssignmentCode } from "../assignment-code";
import { AssignmentForm } from "../../assignment-form";
import { ArchiveAssignmentButton } from "./archive-assignment-button";
import { UnsubmitAssignmentButton } from "./unsubmit-assignment-button";
import { hasUserRole } from "@/lib/user-role";

export const revalidate = 0;

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  if (!(await hasUserRole(userId, "instructor"))) notFound();

  const { assignmentId } = await params;
  const assignment = await db.query.assignmentsTable.findFirst({
    where: { id: assignmentId, clerkUserId: userId },
    with: {
      members: true,
      submissions: {
        with: { receipt: { columns: { id: true } } },
      },
    },
  });

  if (!assignment) notFound();

  const submissions = assignment.submissions.filter((submission) => submission.submittedAt != null);
  const studentIds = [...new Set(assignment.members.map((member) => member.clerkUserId))];
  const students = studentIds.length === 0 ? [] : await getUsers(studentIds);
  const profiles = new Map(students.map((student) => [student.id, {
    name: formatName(student),
    email: student.emailAddresses.find((email) => email.id === student.primaryEmailAddressId)?.emailAddress,
    imageUrl: student.imageUrl,
  }]));
  const onTimeSubmissions = submissions.filter((submission) => !isLate(submission.submittedAt!, assignment.dueDate));
  const lateSubmissions = submissions.filter((submission) => isLate(submission.submittedAt!, assignment.dueDate));
  const submittedStudentIds = new Set(submissions.map((submission) => submission.clerkUserId));
  const studentsWithoutSubmissions = assignment.members.filter((member) => !submittedStudentIds.has(member.clerkUserId));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f7f8f7] pb-14 text-[#1d2521]">
      <header className="border-b border-[#dbe3dc] bg-white/95 backdrop-blur">
        <div className="container mx-auto flex max-w-6xl items-center px-5 py-4 sm:px-8">
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/assignments/instructor" />}>
            <ArrowLeft /> Back to instructor assignments
          </Button>
        </div>
      </header>
      <div className="container mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Assignment submissions</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{assignment.title}</h1>
            <p className="mt-2 text-[#65716a]">Review submitted work and open each student’s verified receipt.</p>
            {assignment.archivedAt ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#e8c8c4] bg-[#fbe9e7] px-3 py-2 text-sm font-medium text-[#9b332a]"><Archive className="size-4" /> Archived</div>
            ) : <div className="mt-4 rounded-lg border border-[#dbe3dc] bg-white px-3 py-2.5 w-fit"><AssignmentCode code={assignment.accessCode} assignmentId={assignment.id} /></div>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DueDate dueDate={assignment.dueDate} isOverdue={assignment.dueDate ? assignment.dueDate < today : false} />
            {!assignment.archivedAt && <ArchiveAssignmentButton assignmentId={assignment.id} title={assignment.title} />}
          </div>
        </div>

        {!assignment.archivedAt && <details className="mt-8 rounded-xl border border-[#dbe3dc] bg-white">
          <summary className="cursor-pointer px-5 py-4 font-medium marker:text-[#315943]">Edit assignment details</summary>
          <div className="border-t border-[#e7ebe7] p-5"><AssignmentForm assignment={assignment} /></div>
        </details>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SubmissionSummary icon={UsersRound} label="Students" count={assignment.members.length} tone="neutral" />
          <SubmissionSummary icon={CheckCircle2} label="On-time submissions" count={onTimeSubmissions.length} tone="success" />
          <SubmissionSummary icon={Clock3} label="Late submissions" count={lateSubmissions.length} tone="late" />
          <SubmissionSummary icon={UserRoundX} label="Not submitted" count={studentsWithoutSubmissions.length} tone="missing" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <SubmissionGroup
            title="On-time submissions"
            description={assignment.dueDate ? `Submitted by ${formatDate(assignment.dueDate)}.` : "This assignment has no due date."}
            submissions={onTimeSubmissions}
            profiles={profiles}
            status="on-time"
          />
          <SubmissionGroup
            title="Late submissions"
            description={assignment.dueDate ? `Submitted after ${formatDate(assignment.dueDate)}.` : "No submissions can be late without a due date."}
            submissions={lateSubmissions}
            profiles={profiles}
            status="late"
          />
          <MissingSubmissionGroup students={studentsWithoutSubmissions} profiles={profiles} />
        </div>
      </div>
    </main>
  );
}

function SubmissionSummary({
  icon: Icon,
  label,
  count,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  count: number;
  tone: "success" | "late" | "neutral" | "missing";
}) {
  const color = tone === "success" ? "text-[#315943] bg-[#e5f1e8]" : tone === "late" ? "text-[#9b332a] bg-[#fbe9e7]" : tone === "missing" ? "text-[#8a5a11] bg-[#fff4dc]" : "text-[#315943] bg-[#edf3ee]";

  return (
    <Card className="border-[#dbe3dc] bg-white">
      <CardContent className="flex items-center gap-4 pt-5">
        <span className={`grid size-10 place-items-center rounded-full ${color}`}><Icon className="size-5" /></span>
        <div><p className="text-2xl font-semibold tracking-[-0.04em]">{count}</p><p className="text-sm text-[#69756d]">{label}</p></div>
      </CardContent>
    </Card>
  );
}

function MissingSubmissionGroup({
  students,
  profiles,
}: {
  students: Array<{ clerkUserId: string }>;
  profiles: Map<string, { name: string; email: string | undefined; imageUrl: string }>;
}) {
  return (
    <section aria-label="Students who have not submitted">
      <Card className="h-full border-[#dbe3dc] bg-white">
        <CardHeader>
          <div className="flex items-center gap-2"><UserRoundX className="size-4 text-[#8a5a11]" /><CardTitle>Not submitted</CardTitle></div>
          <CardDescription>Students who joined this assignment but have not submitted.</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8d0] bg-[#fbfcfa] px-4 text-center">
              <CheckCircle2 className="size-5 text-[#315943]" />
              <p className="mt-2 text-sm text-[#607067]">Everyone who joined has submitted.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-[#e7ebe7]">
              {students.map((student) => {
                const profile = profiles.get(student.clerkUserId);
                const name = profile?.name ?? "Student";

                return (
                  <li key={student.clerkUserId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar>{profile?.imageUrl && <AvatarImage src={profile.imageUrl} alt="" />}<AvatarFallback>{initials(name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="truncate font-medium">{name}</p>{profile?.email && <p className="truncate text-sm text-[#69756d]">{profile.email}</p>}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function SubmissionGroup({
  title,
  description,
  submissions,
  profiles,
  status,
}: {
  title: string;
  description: string;
  submissions: Array<{ assignmentId: string; id: string; clerkUserId: string; submittedAt: Date | null; receipt: { id: string } | null }>;
  profiles: Map<string, { name: string; email: string | undefined; imageUrl: string }>;
  status: "on-time" | "late";
}) {
  return (
    <section aria-label={title}>
      <Card className="h-full border-[#dbe3dc] bg-white">
        <CardHeader>
          <div className="flex items-center gap-2"><FileCheck2 className={status === "on-time" ? "size-4 text-[#315943]" : "size-4 text-[#9b332a]"} /><CardTitle>{title}</CardTitle></div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8d0] bg-[#fbfcfa] px-4 text-center">
              <UsersRound className="size-5 text-[#69756d]" />
              <p className="mt-2 text-sm text-[#607067]">No {status === "on-time" ? "on-time" : "late"} submissions yet.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-[#e7ebe7]">
              {submissions.map((submission) => {
                const profile = profiles.get(submission.clerkUserId);
                const name = profile?.name ?? "Student";

                return (
                  <li key={submission.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>{profile?.imageUrl && <AvatarImage src={profile.imageUrl} alt="" />}<AvatarFallback>{initials(name)}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{name}</p>
                        <p className="truncate text-sm text-[#69756d]">{profile?.email ?? formatDateTime(submission.submittedAt!)}</p>
                        {profile?.email && <p className="text-xs text-[#69756d]">Submitted {formatDateTime(submission.submittedAt!)}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status === "on-time" ? "bg-[#e5f1e8] text-[#315943]" : "bg-[#fbe9e7] text-[#9b332a]"}>{status === "on-time" ? "On time" : "Late"}</Badge>
                      {submission.receipt ? (
                        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/receipts/${submission.id}`} />}>View receipt</Button>
                      ) : (
                        <span className="text-xs text-[#69756d]">Receipt unavailable</span>
                      )}
                      <UnsubmitAssignmentButton assignmentId={submission.assignmentId} studentName={name} submissionId={submission.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function isLate(submittedAt: Date, dueDate: string | null) {
  return dueDate != null && submittedAt.toISOString().slice(0, 10) > dueDate;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
