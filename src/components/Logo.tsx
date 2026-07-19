import { Type } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5"
      aria-label="trace home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[#1d2521] text-[#f9f7f1]">
        <Type className="size-4" strokeWidth={2.3} />
      </span>
      <span className="text-lg font-semibold tracking-[-0.04em]">trace</span>
    </Link>
  );
}
