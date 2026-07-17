"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { assignmentMembersTable, assignmentsTable } from "@/db/schema";
import { canJoinAssignment } from "@/lib/access-control";
import {
  assignmentSubmissionSchema,
  joinAssignmentSchema,
  newAssignmentSchema,
  updateAssignmentSchema,
} from "@/formSchemas/assignment";
import * as yup from "yup";

export async function createAssignment(
  unsafeData: yup.InferType<typeof newAssignmentSchema>,
): Promise<{ error: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  try {
    const { title, course, description, dueDate } = await newAssignmentSchema.validate(unsafeData);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const accessCode = randomUUID().slice(0, 8);
      const created = await db
        .insert(assignmentsTable)
        .values({
          clerkUserId: userId,
          title,
          course: course || null,
          description: description || null,
          dueDate: dueDate || null,
          accessCode,
        })
        .onConflictDoNothing({ target: assignmentsTable.accessCode })
        .returning({ id: assignmentsTable.id });

      if (created.length > 0) {
        revalidatePath("/dashboard/assignments");
        revalidatePath("/dashboard/assignments/instructor");
        return { error: false };
      }
    }
  } catch {
    return { error: true };
  }

  return { error: true };
}

export async function joinAssignment(
  unsafeData: yup.InferType<typeof joinAssignmentSchema>,
): Promise<{ error: boolean; message?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: true, message: "Sign in again before joining an assignment." };

  try {
    const { accessCode } = await joinAssignmentSchema.validate(unsafeData);
    if (!accessCode) return { error: true, message: "Enter an assignment code." };

    const assignment = await db.query.assignmentsTable.findFirst({
      where: { accessCode },
      columns: { archivedAt: true, id: true, clerkUserId: true },
    });

    if (!assignment) return { error: true, message: "We couldn’t find an assignment with that code." };
    if (!canJoinAssignment({ assignmentArchivedAt: assignment.archivedAt, assignmentOwnerId: assignment.clerkUserId, viewerId: userId })) {
      if (assignment.archivedAt) return { error: true, message: "This assignment is no longer accepting students." };
      return { error: true, message: "You created this assignment. Open it from Instructor Assignments." };
    }

    await db
      .insert(assignmentMembersTable)
      .values({ assignmentId: assignment.id, clerkUserId: userId })
      .onConflictDoNothing();
  } catch {
    return { error: true, message: "We couldn’t join that assignment. Please try again." };
  }

  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/assignments/instructor");
  return { error: false };
}

export async function updateAssignment(
  unsafeAssignmentId: string,
  unsafeData: yup.InferType<typeof newAssignmentSchema>,
): Promise<{ error: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  try {
    const { assignmentId, course, description, dueDate, title } = await updateAssignmentSchema.validate({
      assignmentId: unsafeAssignmentId,
      ...unsafeData,
    });
    const { rowCount } = await db
      .update(assignmentsTable)
      .set({
        title,
        course: course || null,
        description: description || null,
        dueDate: dueDate || null,
      })
      .where(and(
        eq(assignmentsTable.id, assignmentId),
        eq(assignmentsTable.clerkUserId, userId),
        isNull(assignmentsTable.archivedAt),
      ));

    if (rowCount === 0) return { error: true };
  } catch {
    return { error: true };
  }

  revalidateAssignmentPaths(unsafeAssignmentId);
  return { error: false };
}

export async function archiveAssignment(unsafeAssignmentId: string): Promise<{ error: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  try {
    const { assignmentId } = await assignmentSubmissionSchema.validate({ assignmentId: unsafeAssignmentId });
    const { rowCount } = await db
      .update(assignmentsTable)
      .set({ archivedAt: new Date() })
      .where(and(
        eq(assignmentsTable.id, assignmentId),
        eq(assignmentsTable.clerkUserId, userId),
        isNull(assignmentsTable.archivedAt),
      ));

    if (rowCount === 0) return { error: true };
  } catch {
    return { error: true };
  }

  revalidateAssignmentPaths(unsafeAssignmentId);
  return { error: false };
}

export async function regenerateAssignmentAccessCode(
  unsafeAssignmentId: string,
): Promise<{ code?: string; error: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  let assignmentId: string;
  try {
    ({ assignmentId } = await assignmentSubmissionSchema.validate({ assignmentId: unsafeAssignmentId }));
  } catch {
    return { error: true };
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const accessCode = randomUUID().slice(0, 8);
      const updated = await db
        .update(assignmentsTable)
        .set({ accessCode })
        .where(and(
          eq(assignmentsTable.id, assignmentId),
          eq(assignmentsTable.clerkUserId, userId),
          isNull(assignmentsTable.archivedAt),
        ))
        .returning({ accessCode: assignmentsTable.accessCode });
      if (updated[0]) {
        revalidateAssignmentPaths(assignmentId);
        return { code: updated[0].accessCode, error: false };
      }
      return { error: true };
    } catch {
      // A rare access-code collision is safe to retry.
    }
  }

  return { error: true };
}

export async function deleteAssignment(unsafeAssignmentId: string): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  try {
    const { assignmentId } = await assignmentSubmissionSchema.validate({ assignmentId: unsafeAssignmentId });
    const [member, submission] = await Promise.all([
      db.query.assignmentMembersTable.findFirst({ where: { assignmentId }, columns: { assignmentId: true } }),
      db.query.assignmentSubmissionsTable.findFirst({ where: { assignmentId }, columns: { id: true } }),
    ]);
    if (member || submission) return { error: true };
    const { rowCount } = await db
      .delete(assignmentsTable)
      .where(and(eq(assignmentsTable.id, assignmentId), eq(assignmentsTable.clerkUserId, userId), isNull(assignmentsTable.archivedAt)));

    if (rowCount === 0) return { error: true };
  } catch {
    return { error: true };
  }

  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/assignments/instructor");
  redirect("/dashboard/assignments/instructor");
}

function revalidateAssignmentPaths(assignmentId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/assignments/instructor");
  revalidatePath(`/dashboard/assignments/instructor/${assignmentId}`);
}
