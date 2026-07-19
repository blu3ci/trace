import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { DemoExperience } from "@/components/demo-experience";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  return <main className="min-h-screen bg-[#fbfaf7] text-[#1d2521]"><header className="border-b border-[#e5e5df] bg-[#fbfaf7]/95 backdrop-blur"><nav className="container mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"><Logo /><Button variant="outline" nativeButton={false} render={<Link href="/" />}><ArrowLeft /> Home</Button></nav></header><div className="container mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12"><Badge variant="outline" className="border-[#c8d4cb] bg-[#f4f7f2] text-[#42614e]"><Sparkles /> Demo · sample data</Badge><div className="mt-5 flex flex-wrap items-end justify-between gap-5"><div className="max-w-2xl"><h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Follow one draft from assignment to receipt.</h1><p className="mt-4 text-lg leading-8 text-[#65716a]">This guided, no-account demo shows the current trace flow: an instructor creates an assignment, a student writes and saves milestones, then the instructor reviews the submitted receipt.</p></div><Button className="bg-[#315943] hover:bg-[#254735]" nativeButton={false} render={<Link href="/sign-in" />}>Try the live workspace <ArrowRight data-icon="inline-end" /></Button></div><DemoExperience /><p className="mt-5 text-sm text-[#69756d]">This page uses sample data. In the live workspace, students write and submit documents; instructors create assignments and can review the instructor-only writing-process summary.</p></div></main>;
}
