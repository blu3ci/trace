"use server";

import { db } from "@/db";
import {
  assignmentReceiptsTable,
  assignmentSubmissionsTable,
  documentMilestonesTable,
  documentsTable,
} from "@/db/schema";
import {
  newDocumentSchema,
  updateDocumentTitleSchema,
} from "@/formSchemas/document";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNotNull, isNull, notExists } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as yup from "yup";
import "server-only";
import { Block } from "@blocknote/core";
import { assignmentSubmissionSchema, attachDocumentToAssignmentSchema } from "@/formSchemas/assignment";
import { randomUUID } from "node:crypto";

function isEditableDocument(documentId: string) {
  return notExists(
    db
      .select({ id: assignmentSubmissionsTable.id })
      .from(assignmentSubmissionsTable)
      .where(
        and(
          eq(assignmentSubmissionsTable.documentId, documentId),
          isNotNull(assignmentSubmissionsTable.submittedAt),
        ),
      ),
  );
}

export async function createAssignmentSubmission(
  unsafeAssignmentId: string,
): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  let assignmentId: string;
  try {
    ({ assignmentId } = await assignmentSubmissionSchema.validate({
      assignmentId: unsafeAssignmentId,
    }));
  } catch {
    return;
  }

  const [membership, existingSubmission, assignment] = await Promise.all([
    db.query.assignmentMembersTable.findFirst({
      where: { assignmentId, clerkUserId: userId },
      columns: { assignmentId: true },
    }),
    db.query.assignmentSubmissionsTable.findFirst({
      where: { assignmentId, clerkUserId: userId },
      columns: { documentId: true },
    }),
    db.query.assignmentsTable.findFirst({
      where: { id: assignmentId },
      columns: { title: true },
    }),
  ]);

  if (!membership || !assignment) return;
  if (existingSubmission) redirect(`/document/${existingSubmission.documentId}`);

  const documentId = randomUUID();

  try {
    await db.batch([
      db.insert(documentsTable).values({
        id: documentId,
        clerkUserId: userId,
        title: `${assignment.title} submission`.slice(0, 255),
      }),
      db.insert(assignmentSubmissionsTable).values({
        assignmentId,
        documentId,
        clerkUserId: userId,
      }),
    ]);
  } catch {
    const concurrentSubmission = await db.query.assignmentSubmissionsTable.findFirst({
      where: { assignmentId, clerkUserId: userId },
      columns: { documentId: true },
    });

    if (concurrentSubmission) redirect(`/document/${concurrentSubmission.documentId}`);
    return;
  }

  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/assignments/instructor");
  redirect(`/document/${documentId}`);
}

export async function attachDocumentToAssignment(
  unsafeDocumentId: string,
  unsafeAssignmentId: string,
): Promise<{ error: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  let documentId: string;
  let assignmentId: string;
  try {
    ({ documentId, assignmentId } = await attachDocumentToAssignmentSchema.validate({
      documentId: unsafeDocumentId,
      assignmentId: unsafeAssignmentId,
    }));
  } catch {
    return { error: true };
  }

  const [document, membership, existingDocumentSubmission, existingAssignmentSubmission] = await Promise.all([
    db.query.documentsTable.findFirst({
      where: { id: documentId, clerkUserId: userId },
      columns: { id: true },
    }),
    db.query.assignmentMembersTable.findFirst({
      where: { assignmentId, clerkUserId: userId },
      columns: { assignmentId: true },
    }),
    db.query.assignmentSubmissionsTable.findFirst({
      where: { documentId },
      columns: { id: true },
    }),
    db.query.assignmentSubmissionsTable.findFirst({
      where: { assignmentId, clerkUserId: userId },
      columns: { id: true },
    }),
  ]);

  if (!document || !membership || existingDocumentSubmission || existingAssignmentSubmission) {
    return { error: true };
  }

  try {
    await db.insert(assignmentSubmissionsTable).values({
      assignmentId,
      documentId,
      clerkUserId: userId,
    });
  } catch {
    return { error: true };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assignments");
  revalidatePath(`/document/${documentId}`);
  revalidatePath(`/document/${documentId}/settings`);
  return { error: false };
}

export async function submitAssignmentSubmission(
  unsafeAssignmentId: string,
): Promise<{ error: boolean; receiptHref?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  let assignmentId: string;
  try {
    ({ assignmentId } = await assignmentSubmissionSchema.validate({
      assignmentId: unsafeAssignmentId,
    }));
  } catch {
    return { error: true };
  }

  const membership = await db.query.assignmentMembersTable.findFirst({
    where: { assignmentId, clerkUserId: userId },
    columns: { assignmentId: true },
  });

  if (!membership) return { error: true };

  const submission = await db.query.assignmentSubmissionsTable.findFirst({
    where: { assignmentId, clerkUserId: userId },
    columns: { id: true, documentId: true, submittedAt: true },
  });
  if (!submission || submission.submittedAt) return { error: true };

  const document = await db.query.documentsTable.findFirst({
    where: { id: submission.documentId, clerkUserId: userId },
    columns: { content: true },
  });
  if (!document?.content) return { error: true };

  const milestones = await db.query.documentMilestonesTable.findMany({
    where: { documentId: submission.documentId },
    columns: { activeSeconds: true },
  });
  const submittedAt = new Date();
  const [updatedSubmission] = await db
    .update(assignmentSubmissionsTable)
    .set({ submittedAt })
    .where(
      and(
        eq(assignmentSubmissionsTable.assignmentId, assignmentId),
        eq(assignmentSubmissionsTable.clerkUserId, userId),
        isNull(assignmentSubmissionsTable.submittedAt),
      ),
    )
    .returning({ id: assignmentSubmissionsTable.id });

  if (!updatedSubmission) return { error: true };

  await db.insert(assignmentReceiptsTable).values({
    submissionId: submission.id,
    documentId: submission.documentId,
    finalContent: document.content,
    finalWordCount: countWords(document.content),
    revisionCount: milestones.length,
    activeSeconds: milestones.reduce((total, milestone) => total + milestone.activeSeconds, 0),
    submittedAt,
  }).onConflictDoNothing();

  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/assignments/instructor");
  revalidatePath(`/document/${submission.documentId}`);
  return { error: false, receiptHref: `/receipts/${submission.id}` };
}

export async function submitAssignmentSubmissionFromForm(
  unsafeAssignmentId: string,
): Promise<void> {
  await submitAssignmentSubmission(unsafeAssignmentId);
}

export async function createDocument(
  unsafeData: yup.InferType<typeof newDocumentSchema>,
): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();

  if (!userId) return { error: true };

  let documentId: string;

  try {
    const { title } = await newDocumentSchema.validate(unsafeData);
    const result = await db
      .insert(documentsTable)
      .values({ title, clerkUserId: userId })
      .returning({ documentId: documentsTable.id });
    documentId = result[0].documentId;
  } catch {
    return { error: true };
  }

  redirect(`/document/${documentId}`);
}

export async function updateDocumentTitle(
  documentId: string,
  unsafeData: yup.InferType<typeof updateDocumentTitleSchema>,
): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();

  if (!userId) return { error: true };

  try {
    const { title } = await updateDocumentTitleSchema.validate(unsafeData);

    const { rowCount } = await db
      .update(documentsTable)
      .set({ title })
      .where(
        and(
          eq(documentsTable.id, documentId),
          eq(documentsTable.clerkUserId, userId),
          isEditableDocument(documentId),
        ),
      );

    if (rowCount === 0) return { error: true };
  } catch {
    return { error: true };
  }

  revalidatePath(`/document/${documentId}`);
  revalidatePath("/dashboard");

  return { error: false };
}

export async function deleteDocument(documentId: string): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();

  if (!userId) return { error: true };

  try {
    const { rowCount } = await db
      .delete(documentsTable)
      .where(
        and(
          eq(documentsTable.id, documentId),
          eq(documentsTable.clerkUserId, userId),
          isEditableDocument(documentId),
        ),
      );

    if (rowCount === 0) return { error: true };
  } catch {
    return { error: true };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function saveDocument(
  documentId: string,
  jsonBlocks: Block[],
  milestone?: { activeSeconds: number; blockCount: number; bulkPasteWordCount: number; wordCount: number },
) {
  const { userId } = await auth();

  if (!userId) return { error: true };

  const { rowCount } = await db
    .update(documentsTable)
    .set({ content: jsonBlocks })
    .where(
      and(
        eq(documentsTable.id, documentId),
        eq(documentsTable.clerkUserId, userId),
        isEditableDocument(documentId),
      ),
    );

  if (rowCount === 0) return {error: true};

  if (milestone && isValidMilestone(milestone)) {
    await db.insert(documentMilestonesTable).values({
      documentId,
      activeSeconds: milestone.activeSeconds,
      blockCount: milestone.blockCount,
      bulkPasteWordCount: milestone.bulkPasteWordCount,
      content: jsonBlocks,
      wordCount: milestone.wordCount,
    });
  }
}

function isValidMilestone(milestone: { activeSeconds: number; blockCount: number; bulkPasteWordCount: number; wordCount: number }) {
  return [milestone.activeSeconds, milestone.blockCount, milestone.bulkPasteWordCount, milestone.wordCount]
    .every((value) => Number.isInteger(value) && value >= 0)
    && milestone.activeSeconds <= 90 * 60
    && milestone.blockCount <= 100_000
    && milestone.bulkPasteWordCount <= 1_000_000
    && milestone.wordCount <= 1_000_000;
}

function countWords(blocks: Block[]) {
  return extractText(blocks)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function extractText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as { content?: unknown; text?: unknown };
  if (typeof record.text === "string") return record.text;
  return extractText(record.content);
}
