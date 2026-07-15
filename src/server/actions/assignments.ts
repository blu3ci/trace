"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { assignmentsTable } from "@/db/schema";

export async function createAssignment(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return;

  const title = String(formData.get("title") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!title || title.length > 255) {
    return;
  }
  if (course.length > 120) {
    return;
  }
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return;
  }

  await db.insert(assignmentsTable).values({
    clerkUserId: userId,
    title,
    course: course || null,
    description: description || null,
    dueDate: dueDate || null,
  });

  revalidatePath("/dashboard/assignments");
}
