import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { DocumentSettingsForm } from "./document-settings-form";

export default async function DocumentSettingsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { userId, redirectToSignIn } = await auth();
  const { documentId } = await params;

  if (!userId) return redirectToSignIn();

  const [document, submission, memberships, submissions] = await Promise.all([
    db.query.documentsTable.findFirst({
      where: { id: documentId, clerkUserId: userId },
      columns: { id: true, title: true },
    }),
    db.query.assignmentSubmissionsTable.findFirst({
      where: { documentId, clerkUserId: userId },
      columns: { submittedAt: true },
      with: { assignment: { columns: { title: true } } },
    }),
    db.query.assignmentMembersTable.findMany({
      where: { clerkUserId: userId },
      columns: { assignmentId: true },
    }),
    db.query.assignmentSubmissionsTable.findMany({
      where: { clerkUserId: userId },
      columns: { assignmentId: true },
    }),
  ]);

  if (!document) notFound();
  const joinedAssignmentIds = memberships.map((membership) => membership.assignmentId);
  const submittedAssignmentIds = new Set(submissions.map((assignmentSubmission) => assignmentSubmission.assignmentId));
  const assignments = joinedAssignmentIds.length === 0 || submission
    ? []
    : await db.query.assignmentsTable.findMany({
      where: { id: { in: joinedAssignmentIds } },
      columns: { archivedAt: true, course: true, id: true, title: true },
    });
  const availableAssignments = assignments
    .filter((assignment) => !assignment.archivedAt && !submittedAssignmentIds.has(assignment.id))
    .map((assignment) => ({
      id: assignment.id,
      label: assignment.course ? `${assignment.title} · ${assignment.course}` : assignment.title,
    }));

  return (
    <DocumentSettingsForm
      documentId={document.id}
      title={document.title}
      isSubmitted={submission?.submittedAt != null}
      isAttachedToAssignment={submission != null}
      attachedAssignmentTitle={submission?.assignment?.title}
      availableAssignments={availableAssignments}
    />
  );
}
