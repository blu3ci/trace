import Link from "next/link";
import { Eye } from "lucide-react";
import { Block } from "@blocknote/core";

import { Button } from "@/components/ui/button";

export function RevisionComparisonLink({
  documentId,
  previous,
  current,
}: {
  documentId: string;
  previous: { content: Block[] | null; createdAt: Date };
  current: { content: Block[] | null; createdAt: Date };
}) {
  const isAvailable = previous.content != null && current.content != null;
  const href = `/receipts/compare/${documentId}?from=${encodeURIComponent(previous.createdAt.toISOString())}&to=${encodeURIComponent(current.createdAt.toISOString())}`;

  return (
    <Button size="sm" variant="outline" nativeButton={false} disabled={!isAvailable} render={isAvailable ? <Link href={href} /> : undefined}>
      <Eye /> Preview changes
    </Button>
  );
}
