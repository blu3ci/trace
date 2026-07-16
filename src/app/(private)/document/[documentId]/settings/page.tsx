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

  const [document, submission] = await Promise.all([
    db.query.documentsTable.findFirst({
      where: { id: documentId, clerkUserId: userId },
      columns: { id: true, title: true },
    }),
    db.query.assignmentSubmissionsTable.findFirst({
      where: { documentId, clerkUserId: userId },
      columns: { submittedAt: true },
    }),
  ]);

  if (!document) notFound();

  return (
    <DocumentSettingsForm
      documentId={document.id}
      title={document.title}
      isSubmitted={submission?.submittedAt != null}
    />
  );
}
