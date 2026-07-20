"use client";

import { CheckCircle2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { submitAssignmentSubmission } from "@/server/actions/documents";

export function MarkAssignmentSubmittedButton({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submitAssignment() {
    startTransition(async () => {
      const result = await submitAssignmentSubmission(assignmentId);

      if (!result.error) {
        startTransition(() => {
          router.refresh();
        });
      }
    });
  }

  return (
    <Button type="button" disabled={isPending} onClick={submitAssignment}>
      <CheckCircle2 className="size-4" /> {isPending ? "Submitting…" : "Mark as submitted"}
    </Button>
  );
}
