"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveAssignment } from "@/server/actions/assignments";

export function ArchiveAssignmentButton({ assignmentId, title }: { assignmentId: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function archive() {
    startTransition(async () => {
      const result = await archiveAssignment(assignmentId);
      if (!result.error) router.push("/dashboard/assignments/instructor");
    });
  }

  return <AlertDialog>
    <AlertDialogTrigger render={<Button variant="outline" className="border-[#e8c8c4] text-[#9b332a] hover:bg-[#fbe9e7] hover:text-[#9b332a]" disabled={isPending} />}><Archive /> Archive</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>Archive “{title}”?</AlertDialogTitle><AlertDialogDescription>It will disappear from active assignment lists and can no longer be joined. Existing submissions and receipts will remain available.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={archive} className="bg-[#9b332a] hover:bg-[#7f2821]">Archive assignment</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
