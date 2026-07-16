"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignmentMembersTable, assignmentsTable } from "@/db/schema";
import { assignmentSubmissionSchema, joinAssignmentSchema, newAssignmentSchema } from "@/formSchemas/assignment";
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
): Promise<{ error: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  try {
    const { accessCode } = await joinAssignmentSchema.validate(unsafeData);
    if (!accessCode) return { error: true };

    const assignment = await db.query.assignmentsTable.findFirst({
      where: { accessCode },
      columns: { id: true, clerkUserId: true },
    });

    if (!assignment || assignment.clerkUserId === userId) return { error: true };

    await db
      .insert(assignmentMembersTable)
      .values({ assignmentId: assignment.id, clerkUserId: userId })
      .onConflictDoNothing();
  } catch {
    return { error: true };
  }

  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/assignments/instructor");
  return { error: false };
}

export async function deleteAssignment(unsafeAssignmentId: string): Promise<{ error: boolean } | undefined> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  try {
    const { assignmentId } = await assignmentSubmissionSchema.validate({ assignmentId: unsafeAssignmentId });
    const { rowCount } = await db
      .delete(assignmentsTable)
      .where(and(eq(assignmentsTable.id, assignmentId), eq(assignmentsTable.clerkUserId, userId)));

    if (rowCount === 0) return { error: true };
  } catch {
    return { error: true };
  }

  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/assignments/instructor");
  redirect("/dashboard/assignments/instructor");
}
