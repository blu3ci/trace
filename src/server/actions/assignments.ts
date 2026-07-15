"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { assignmentsTable } from "@/db/schema";
import { newAssignmentSchema } from "@/formSchemas/assignment";
import * as yup from "yup";

export async function createAssignment(
  unsafeData: yup.InferType<typeof newAssignmentSchema>,
): Promise<{ error: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: true };

  try {
    const { title, course, description, dueDate } = await newAssignmentSchema.validate(unsafeData);

    await db.insert(assignmentsTable).values({
      clerkUserId: userId,
      title,
      course: course || null,
      description: description || null,
      dueDate: dueDate || null,
    });
  } catch {
    return { error: true };
  }

  revalidatePath("/dashboard/assignments");
  return { error: false };
}
