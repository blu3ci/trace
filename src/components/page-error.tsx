"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-xl items-center px-5 py-10 sm:px-8">
      <section className="w-full rounded-2xl border border-[#dbe3dc] bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#fbe9e7] text-[#9b332a]"><AlertCircle className="size-6" /></span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">We couldn’t load this page</h1>
        <p className="mt-2 text-sm leading-6 text-[#65716a]">Your writing is still saved. Try again, or return to your documents.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={retry}><RefreshCw /> Try again</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>My documents</Button>
        </div>
      </section>
    </div>
  );
}
