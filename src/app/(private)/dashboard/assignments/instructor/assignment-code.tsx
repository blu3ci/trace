"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { regenerateAssignmentAccessCode } from "@/server/actions/assignments";

export function AssignmentCode({ code, assignmentId }: { code: string; assignmentId?: string }) {
  const [copied, setCopied] = useState(false);
  const [currentCode, setCurrentCode] = useState(code);
  const [isPending, startTransition] = useTransition();

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  }

  function regenerateCode() {
    if (!assignmentId) return;
    startTransition(async () => {
      const result = await regenerateAssignmentAccessCode(assignmentId);
      if (!result.error && result.code) setCurrentCode(result.code);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#315943]">
      <KeyRound className="size-4" />
      <span>Assignment code:</span>
      <div className="flex items-center border-input border rounded">
        <code className="font-mono tracking-wider px-1">{currentCode}</code>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={copyCode}
          aria-label="Copy assignment code"
          className="border-l-input rounded-none"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      {assignmentId && <AlertDialog>
        <AlertDialogTrigger render={<Button type="button" size="sm" variant="outline" disabled={isPending} />}>
          <RefreshCw className={isPending ? "animate-spin" : ""} /> Regenerate
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Regenerate assignment code?</AlertDialogTitle><AlertDialogDescription>Students will need the new code to join. Students who already joined will keep their access.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={regenerateCode}>Regenerate code</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </div>
  );
}
