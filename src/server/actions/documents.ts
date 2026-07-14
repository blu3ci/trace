"use server";

import { db } from "@/db";
import { documentsTable } from "@/db/schema";
import { newDocumentSchema } from "@/formSchemas/newDocument";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import * as yup from "yup";
import "server-only";

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
