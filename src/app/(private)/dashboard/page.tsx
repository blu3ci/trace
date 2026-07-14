import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { FilePlusCorner } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default function DashboardPage() {
  return (
    <div>
      <h1 className="container mx-auto mb-5 text-2xl font-semibold">
        My Documents
      </h1>
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-5 container">
          <CreateDocument />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
          <Document />
        </div>
      </div>
    </div>
  );
}

function CreateDocument() {
  return (
    <Link href="/document/new">
      <Card className="h-70 aspect-9/11">
        <CardContent className="flex flex-col gap-2 items-center justify-center h-full">
          <FilePlusCorner className="size-14" />
          New Document
        </CardContent>
      </Card>
    </Link>
  );
}

function Document() {
  return (
    <Link href="/document/blahblah">
      <Card className="h-70 aspect-9/11">
        <CardContent className="grow truncate text-wrap">
          Lorem ipsum, dol
        </CardContent>
        <CardFooter className="flex flex-col">
          <CardTitle>Document Title</CardTitle>
          <CardDescription>Click to edit document</CardDescription>
        </CardFooter>
      </Card>
    </Link>
  );
}
