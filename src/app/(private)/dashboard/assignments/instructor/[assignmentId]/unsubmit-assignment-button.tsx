"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { unsubmitAssignmentSubmission } from "@/server/actions/assignments";

export function UnsubmitAssignmentButton({
  assignmentId,
  studentName,
  submissionId,
}: {
  assignmentId: string;
  studentName: string;
  submissionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function unsubmit() {
    startTransition(async () => {
      const result = await unsubmitAssignmentSubmission(assignmentId, submissionId);
      if (!result.error) {
        startTransition(() => {
          router.refresh();
        });
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger disabled={isPending} render={<Button size="sm" variant="outline" />}>
        <RotateCcw /> Unsubmit
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsubmit {studentName}’s work?</AlertDialogTitle>
          <AlertDialogDescription>
            This returns the assignment to the student for editing. Its current submission receipt will be removed and a new receipt will be created when they submit again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={unsubmit} disabled={isPending}>
            {isPending ? "Unsubmitting…" : "Unsubmit assignment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
