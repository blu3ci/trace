import { ArrowRight, CheckCircle2, FileText, History, ReceiptText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  { icon: FileText, title: "Write", text: "Create a document or attach one to an assignment. trace records saved drafts, not every keystroke." },
  { icon: History, title: "Develop", text: "As your ideas take shape, meaningful revisions and large pasted additions become part of the document’s history." },
  { icon: ReceiptText, title: "Reflect", text: "Open the receipt to revisit the final draft, active writing time, and a concise timeline of what changed." },
];

export default function HowTraceWorksPage() {
  return (
    <div className="container mx-auto max-w-6xl px-5 pb-12 sm:px-8">
      <header className="max-w-2xl py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Getting started</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">How trace works</h1>
        <p className="mt-3 text-lg leading-7 text-[#65716a]">trace makes the development of a draft easier to revisit. It is a record of writing, not a judgment about a writer.</p>
      </header>

      <section aria-label="The trace writing process" className="grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <Card key={title} className="h-full border-[#dbe3dc] bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]"><Icon className="size-5" /></span>
                <span className="text-sm font-semibold text-[#8a968e]">0{index + 1}</span>
              </div>
              <CardTitle className="mt-5 text-xl tracking-[-0.025em]">{title}</CardTitle>
            </CardHeader>
            <CardContent><p className="leading-6 text-[#607067]">{text}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 flex flex-col gap-5 rounded-xl border border-[#dbe3dc] bg-[#f7faf7] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="flex max-w-2xl gap-2 text-sm leading-6 text-[#405049]"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#315943]" />You can view your writing receipt before submitting. For assignment work, instructors can review the submitted receipt alongside the final document.</p>
        <Button className="shrink-0 bg-[#315943] hover:bg-[#254735]" nativeButton={false} render={<Link href="/document/new" />}>Create a document <ArrowRight data-icon="inline-end" /></Button>
      </section>
    </div>
  );
}
