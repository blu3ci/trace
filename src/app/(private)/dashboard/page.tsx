import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { Block } from "@blocknote/core";
import { FilePlusCorner, FileText } from "lucide-react";
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
    <div className="container mx-auto max-w-6xl px-5 pb-12 sm:px-8">
      <div className="flex flex-col gap-2 py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Writing space</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">My Documents</h1>
        <p className="max-w-xl text-[#65716a]">Keep your ideas, drafts, and finished work together in one calm place.</p>
      </div>
      <section aria-label="Documents">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CreateDocument />
          {documents.map(({ id, title, content }) => (
            <Document key={id} id={id} title={title} content={content} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CreateDocument() {
  return (
    <Link href={`/document/new`} className="group">
      <Card className="h-full min-h-52 border-dashed border-[#bfd0c2] bg-[#f7faf7] transition-shadow group-hover:shadow-sm">
        <CardContent className="flex h-full min-h-52 flex-col items-center justify-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]">
            <FilePlusCorner className="size-6" />
          </span>
          <div>
            <CardTitle>New document</CardTitle>
            <CardDescription className="mt-1">Start with a blank page.</CardDescription>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Document({ id, title, content }: { id: string; title: string; content: Block[] | null }) {
  const preview = getDocumentPreview(content);

  return (
    <Link href={`/document/${id}`} className="group">
      <Card className="h-full min-h-52 border-[#e0e5e0] transition-shadow group-hover:shadow-sm">
        <CardHeader>
          <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]">
            <FileText className="size-5" />
          </span>
        </CardHeader>
        <CardContent className="grow">
          <div className="min-h-20 rounded-lg border border-[#edf0ed] bg-[#fbfcfa] px-3 py-2.5 text-sm leading-5 text-[#607067]">
            {preview ? (
              <p className="line-clamp-3 whitespace-pre-wrap">{preview}</p>
            ) : (
              <p className="text-[#8a968e]">No text yet — open to start writing.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start border-[#e0e5e0] bg-[#f7faf7]">
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          <CardDescription className="mt-1">Click to edit document</CardDescription>
        </CardFooter>
      </Card>
    </Link>
  );
}

function getDocumentPreview(blocks: Block[] | null): string {
  return getBlockText(blocks ?? [])
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function getBlockText(blocks: Block[]): string {
  return blocks
    .flatMap((block) => {
      const inlineText = Array.isArray(block.content)
        ? block.content
          .map((inlineContent) => {
            if (inlineContent.type === "text") return inlineContent.text;
            if (inlineContent.type === "link") {
              return inlineContent.content.map((text) => text.text).join("");
            }

            return "";
          })
          .join("")
        : "";

      return [inlineText, getBlockText(block.children)];
    })
    .join(" ");
}
