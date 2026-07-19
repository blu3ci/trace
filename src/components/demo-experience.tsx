"use client";

import { useState } from "react";
import { BrainCircuit, CheckCircle2, Clock3, Download, FileCheck2, FileText, History, Minus, Plus, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stages = ["Assignment", "Student draft", "Instructor receipt"] as const;
type Stage = (typeof stages)[number];

const milestones = [
  { time: "09:08 AM · 18 min active writing", title: "Set the first direction", text: "The opening establishes a claim about how city planning affects access to green space." },
  { time: "09:34 AM · 21 min active writing", title: "Develop the draft", text: "New material brings neighborhood survey evidence into the second section." },
  { time: "10:02 AM · 16 min active writing", title: "Rework the draft", text: "A broad claim is replaced with a more specific position before submission." },
];

const revisionEvidence = {
  removed: "Parks make cities better for everyone.",
  added: [
    "Parks are public infrastructure because they shape whether residents can move, gather, and recover close to home.",
    "City survey data shows that access is uneven across neighborhoods.",
  ],
};

export function DemoExperience() {
  const [stage, setStage] = useState<Stage>("Assignment");

  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-2" aria-label="Demo stages">
        {stages.map((item, index) => <Button key={item} type="button" size="sm" variant={stage === item ? "default" : "outline"} className={stage === item ? "bg-[#315943] hover:bg-[#254735]" : ""} onClick={() => setStage(item)}>{index + 1}. {item}</Button>)}
      </div>

      <div className="mt-5 rounded-2xl border border-[#dbe3dc] bg-[#f7f8f7] p-4 sm:p-6">
        {stage === "Assignment" && <AssignmentStage />}
        {stage === "Student draft" && <StudentStage />}
        {stage === "Instructor receipt" && <ReceiptStage />}
      </div>
    </section>
  );
}

function AssignmentStage() {
  return <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
    <Card className="border-[#dbe3dc] bg-white"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-xl">Green space and city life</CardTitle><CardDescription className="mt-1">Civics · Due Friday, Oct 18</CardDescription></div><Badge className="bg-[#e5f1e8] text-[#315943]"><CheckCircle2 /> Joined</Badge></div></CardHeader><CardContent><p className="leading-7 text-[#607067]">Use local evidence to argue how public green spaces influence a city&apos;s health, access, or community life. Aim for 600–800 words.</p><div className="mt-5 rounded-lg border border-[#dbe3dc] bg-[#f7faf7] p-3"><p className="text-xs font-semibold tracking-[0.1em] text-[#567160] uppercase">Shared assignment code</p><code className="mt-1 block font-mono text-lg font-semibold tracking-[0.18em] text-[#315943]">8f3a2c1d</code></div></CardContent></Card>
    <Card className="border-[#dbe3dc] bg-white"><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="size-4 text-[#315943]" /> Instructor view</CardTitle><CardDescription>Track progress without interrupting the writing.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><p className="flex items-center justify-between"><span className="text-[#69756d]">Students joined</span><strong>24</strong></p><p className="flex items-center justify-between"><span className="text-[#69756d]">Submitted</span><strong>17</strong></p><p className="flex items-center justify-between"><span className="text-[#69756d]">Due in</span><strong>2 days</strong></p></CardContent></Card>
  </div>;
}

function StudentStage() {
  return <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
    <Card className="h-fit border-[#dbe3dc] bg-white"><CardHeader><CardTitle className="flex items-center gap-2"><History className="size-4 text-[#315943]" /> Writing journey</CardTitle><CardDescription>Visible to the student before submission.</CardDescription></CardHeader><CardContent><ol className="space-y-4 border-l border-[#ced9d0] pl-4">{milestones.map((milestone) => <li key={milestone.title} className="relative"><span className="absolute -left-[1.28rem] top-1.5 size-2 rounded-full bg-[#78a782]" /><p className="font-medium">{milestone.title}</p><p className="mt-1 text-sm leading-5 text-[#607067]">{milestone.text}</p><p className="mt-1 text-xs text-[#69756d]">{milestone.time}</p></li>)}</ol></CardContent></Card>
    <Card className="border-[#dbe3dc] bg-white"><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-xl">Parks are public infrastructure</CardTitle><CardDescription className="mt-1">Autosaved just now</CardDescription></div><FileText className="size-5 text-[#567160]" /></div></CardHeader><CardContent><article className="prose prose-sm max-w-none leading-7 text-[#405049]"><p>Public green space is often treated as decoration, but it is a form of infrastructure. A neighborhood park can make a place safer to walk, give children somewhere to gather, and reduce the distance residents must travel for recreation.</p><p>City survey data shows that access is uneven. The strongest planning decisions do not simply add more green space; they place it where residents can actually reach it.</p><p>For that reason, cities should treat parks as an access issue rather than an optional amenity.</p></article></CardContent></Card>
  </div>;
}

function ReceiptStage() {
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[#607067]">Instructor view · the final draft is preserved alongside the saved writing record.</p>
      <Button size="sm" variant="outline" disabled><Download /> Download receipt PDF</Button>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric icon={Clock3} label="Active writing time" value="55 min" /><Metric icon={History} label="Revision milestones" value="3" /><Metric icon={FileCheck2} label="Final word count" value="684" /></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      <Card className="border-[#dbe3dc] bg-white"><CardHeader><CardTitle>Writing journey</CardTitle><CardDescription>A readable timeline of saved milestones.</CardDescription></CardHeader><CardContent><ol className="space-y-4 border-l border-[#ced9d0] pl-4">{milestones.map((milestone) => <li key={milestone.title} className="relative text-sm"><span className="absolute -left-[1.28rem] top-1.5 size-2 rounded-full bg-[#78a782]" /><p className="font-medium">{milestone.title}</p><p className="mt-1 leading-5 text-[#607067]">{milestone.text}</p></li>)}</ol></CardContent></Card>
      <div className="space-y-5">
        <Card className="border-[#dbe3dc] bg-white"><CardHeader><CardTitle>What changed</CardTitle><CardDescription>Sentence-level evidence from the latest saved revision.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2"><ChangeList icon={Minus} title="Removed" entries={[revisionEvidence.removed]} tone="border-red-200 bg-red-50 text-red-950" /><ChangeList icon={Plus} title="Added" entries={revisionEvidence.added} tone="border-emerald-200 bg-emerald-50 text-emerald-950" /></div></CardContent></Card>
        <Card className="border-[#dbe3dc] bg-[#f7faf7]"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-[#315943]" /> AI writing-process summary</CardTitle><CardDescription>Instructor-only context about the saved record.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-6 text-[#405049]">Three saved milestones and 55 minutes of active writing provide a clear record of the submitted draft&apos;s development.</p><div className="w-36 rounded-md border border-[#dbe7de] bg-white px-3 py-2"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold tracking-[0.08em] text-[#567160] uppercase">Coverage</p><p className="text-xs font-medium text-[#3d5143]">Strong</p></div><div className="mt-1.5 flex gap-1"><span className="h-1.5 flex-1 rounded-full bg-[#4f8a5a]" /><span className="h-1.5 flex-1 rounded-full bg-[#4f8a5a]" /><span className="h-1.5 flex-1 rounded-full bg-[#4f8a5a]" /></div></div></div></CardContent></Card>
      </div>
    </div>
  </div>;
}

function ChangeList({ icon: Icon, title, entries, tone }: { icon: typeof Plus; title: string; entries: string[]; tone: string }) {
  return <section className={`rounded-lg border p-3 ${tone}`}><p className="flex items-center gap-1.5 text-sm font-medium"><Icon className="size-4" /> {title}</p><ul className="mt-2 space-y-2 text-sm leading-5">{entries.map((entry) => <li key={entry} className="rounded bg-white/65 p-2">{entry}</li>)}</ul></section>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <Card className="border-[#dbe3dc] bg-white"><CardContent className="pt-5"><Icon className="size-4 text-[#567160]" /><p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-sm text-[#69756d]">{label}</p></CardContent></Card>;
}
