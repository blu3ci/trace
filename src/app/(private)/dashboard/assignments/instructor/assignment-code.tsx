"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";

export function AssignmentCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#315943]">
      <KeyRound className="size-4" />
      <span>Assignment code:</span>
      <div className="flex items-center border-input border rounded">
        <code className="font-mono tracking-wider px-1">{code}</code>
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
    </div>
  );
}
