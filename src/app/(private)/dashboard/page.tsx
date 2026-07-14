import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { FilePlusCorner } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();

  if (userId == null) return redirectToSignIn();

  const documents = await db.query.documentsTable.findMany({
    where: {
      clerkUserId: userId,
    },
    orderBy: ({ updatedAt }, { desc }) => desc(updatedAt),
  });

  return (
    <div>
      <h1 className="container mx-auto mb-5 text-2xl font-semibold">
        My Documents
      </h1>
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-5 container">
          <CreateDocument />
          {documents.map(({ id, title }) => (
            <Document key={id} id={id} title={title} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateDocument() {
  return (
    <Link href={`/document/new`}>
      <Card className="h-70 aspect-9/11">
        <CardContent className="flex flex-col gap-2 items-center justify-center h-full">
          <FilePlusCorner className="size-14" />
          New Document
        </CardContent>
      </Card>
    </Link>
  );
}

function Document({ id, title }: { id: string; title: string }) {
  return (
    <Link href={`/document/${id}`}>
      <Card className="h-70 aspect-9/11">
        <CardContent className="grow truncate text-wrap">
          Lorem ipsum, dol
        </CardContent>
        <CardFooter className="flex flex-col">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Click to edit document</CardDescription>
        </CardFooter>
      </Card>
    </Link>
  );
}
