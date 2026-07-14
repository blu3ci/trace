"use server";

import { db } from "@/db";
import { documentsTable } from "@/db/schema";
import {
  newDocumentSchema,
  updateDocumentTitleSchema,
} from "@/formSchemas/document";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as yup from "yup";
import "server-only";
import { Block } from "@blocknote/core";

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

    await db
      .update(documentsTable)
      .set({ title })
      .where(
        and(
          eq(documentsTable.id, documentId),
          eq(documentsTable.clerkUserId, userId),
        ),
      );
  } catch {
    return { error: true };
  }

  revalidatePath(`/document/${documentId}`);
  revalidatePath("/dashboard");

  return { error: false };
}

export async function saveDocument(documentId: string, jsonBlocks: Block[]) {
  const { userId } = await auth();

  if (!userId) return { error: true };

  const { rowCount } = await db
    .update(documentsTable)
    .set({ content: jsonBlocks })
    .where(
      and(
        eq(documentsTable.id, documentId),
        eq(documentsTable.clerkUserId, userId),
      ),
    );

  if (rowCount === 0) return {error: true};
}
