import { auth } from "@clerk/nextjs/server";
import {DocumentEditor} from "./DocumentEditor";
import { db } from "@/db";
import { notFound } from "next/navigation";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const {userId, redirectToSignIn} = await auth();
  const { documentId } = await params;

  if (userId == null) return redirectToSignIn();

  const document = await db.query.documentsTable.findFirst({
    where:  {
      clerkUserId: userId,
      id: documentId
    },
  })

  if (!document) return notFound();

  return <DocumentEditor documentId={documentId} />;
}
