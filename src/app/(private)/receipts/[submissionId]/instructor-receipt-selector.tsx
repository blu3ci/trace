"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InstructorReceiptSelector({
  submissionId,
  receipts,
}: {
  submissionId: string;
  receipts: Array<{ submissionId: string; studentName: string }>;
}) {
  const router = useRouter();

  return (
    <div className="mt-5 w-full max-w-sm">
      <label
        className="mb-1.5 block text-sm font-medium"
        htmlFor="student-receipt"
      >
        Viewing student receipt
      </label>
      <Select
        items={receipts.map((receipt) => ({
          label: receipt.studentName,
          value: receipt.submissionId,
        }))}
        value={submissionId}
        onValueChange={(value) => {
          if (value) router.push(`/receipts/${value}`);
        }}
      >
        <SelectTrigger id="student-receipt" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {receipts.map((receipt) => (
            <SelectItem key={receipt.submissionId} value={receipt.submissionId}>
              {receipt.studentName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
