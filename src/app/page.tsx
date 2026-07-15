import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  FileText,
  Layers3,
  LockKeyhole,
  Quote,
  Sparkles,
  Stamp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";

const phases = [
  {
    time: "00—25 min",
    title: "Find the argument",
    text: "A broad opening becomes three possible claims. The student settles on a question worth pursuing.",
    color: "bg-[#e7dbc0]",
    animation: "delay-500",
  },
  {
    time: "25—60 min",
    title: "Follow the evidence",
    text: "A weaker point is removed as primary-source evidence reshapes the second section.",
    color: "bg-[#cddfd4]",
    animation: "delay-700",
  },
  {
    time: "60—80 min",
    title: "Refine the thesis",
    text: "The introduction returns with a more specific, evidence-led position.",
    color: "bg-[#d9d4e7]",
    animation: "delay-1000",
  },
];

const principles = [
  "Works inside the Google Docs workflow students already know",
  "Captures meaningful drafts, never keystrokes outside the document",
  "Makes rapid bulk pastes visible without making accusations",
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf7] text-[#1d2521] selection:bg-[#cddfd4]">
      <header className="fixed w-full z-1 backdrop-blur-xl">
        <nav
          className="flex items-center justify-between container mx-auto p-5"
          aria-label="Primary navigation"
        >
          <Logo />
          <div className="hidden md:flex gap-8">
            <Button variant={"link"} nativeButton={false} render={<a href="#how-it-works" />}>
              How it works
            </Button>
            <Button variant={"link"} nativeButton={false} render={<a href="#for-educators" />}>
              For educators
            </Button>
          </div>
          {userId == null ? (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/sign-in" />}
            >
              Sign in <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <UserButton />
          )}
        </nav>
      </header>

      <section className="relative mx-auto max-w-7xl mt-10 px-5 pt-14 pb-24 sm:px-8 sm:pt-20 lg:px-10 lg:pt-28 lg:pb-32">
        <div className="absolute top-6 right-[-6rem] -z-0 size-72 rounded-full bg-[#e8f0e8] blur-3xl motion-safe:animate-float sm:right-[8%]" />
        <div className="absolute bottom-12 left-[-7rem] -z-0 size-56 rounded-full bg-[#eee8d8] blur-3xl motion-safe:animate-float-delayed" />
        <div className="relative grid items-center gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="animate-in fade-in slide-in-from-bottom-2 border-[#c8d4cb] bg-[#f4f7f2] px-2.5 text-[#42614e] duration-500 fill-mode-both motion-reduce:animate-none"
            >
              <Sparkles data-icon="inline-start" /> The academic memory layer
            </Badge>
            <h1 className="animate-in fade-in slide-in-from-bottom-4 mt-6 text-5xl leading-[0.98] font-semibold tracking-[-0.065em] text-[#1d2521] duration-700 delay-150 fill-mode-both motion-reduce:animate-none sm:text-6xl lg:text-7xl">
              The work behind the work deserves to be seen.
            </h1>
            <p className="animate-in fade-in slide-in-from-bottom-4 mt-6 max-w-xl text-lg leading-8 text-[#607067] duration-700 delay-300 fill-mode-both motion-reduce:animate-none sm:text-xl">
              Trace turns a student&apos;s writing process into a clear, human
              proof of learning—without turning the classroom into a
              surveillance system.
            </p>
            <div className="animate-in fade-in slide-in-from-bottom-4 mt-9 flex flex-wrap items-center gap-3 duration-700 delay-500 fill-mode-both motion-reduce:animate-none">
              <Button
                size="lg"
                className="h-11 rounded-xl bg-[#315943] px-5 text-sm hover:bg-[#254735]"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                Start a writing session <ArrowRight data-icon="inline-end" />
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-[#405049] transition-colors hover:bg-[#eff2ec]"
              >
                See the learning journey
              </a>
            </div>
            <p className="animate-in fade-in mt-5 flex items-center gap-2 text-sm text-[#7a867e] duration-500 delay-700 fill-mode-both motion-reduce:animate-none">
              <LockKeyhole className="size-3.5" /> Built for thinking, not
              policing.
            </p>
          </div>

          <LearningTimeline />
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-[#e5e5df] bg-[#f5f4ef]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">
              A different kind of integrity
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Don&apos;t inspect the answer. Understand the journey.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#65716a]">
              Trace quietly records meaningful moments of revision, then uses
              them to reveal how an idea came into focus.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Reveal delay={100}>
              <FeatureCard
                icon={FileText}
                number="01"
                title="Write where you write"
                text="Open Trace in Google Docs and start a session. No new editor, no new habits."
              />
            </Reveal>
            <Reveal delay={220}>
              <FeatureCard
                icon={Layers3}
                number="02"
                title="Let the process unfold"
                text="Thoughtful snapshots capture additions, deletions, and time invested as the draft evolves."
              />
            </Reveal>
            <Reveal delay={340}>
              <FeatureCard
                icon={Stamp}
                number="03"
                title="Share proof, not suspicion"
                text="Export a receipt that gives teachers a readable view of genuine intellectual effort."
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id="for-educators"
        className="mx-auto grid max-w-7xl scroll-mt-20 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-10 lg:py-28"
      >
        <Reveal animationClassName="slide-in-from-left-6">
          <div>
            <Badge variant="secondary" className="bg-[#ebe7f2] text-[#605476]">
              For educators
            </Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
              A receipt for real intellectual effort.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#65716a]">
              A teacher opens one link—no account or extension required—and sees a
              student&apos;s final work alongside the meaningful moments that
              shaped it.
            </p>
            <ul className="mt-8 space-y-4">
              {principles.map((principle) => (
                <li
                  key={principle}
                  className="flex gap-3 text-[15px] leading-6 text-[#405049]"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#dbeadf] text-[#315943]">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal animationClassName="slide-in-from-right-6" delay={180}>
          <Card className="border-0 bg-[#1e2923] py-0 text-[#f5f3ec] shadow-2xl shadow-[#1d2521]/10">
            <CardHeader className="border-b border-white/10 px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-white">
                    Proof of work
                  </CardTitle>
                  <CardDescription className="mt-1 text-[#adbbb1]">
                    History essay · verified session
                  </CardDescription>
                </div>
                <Badge className="bg-[#b9d9c1] text-[#173c27]">
                  Authentic process
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/7 p-4">
                  <Clock3 className="size-4 text-[#b9d9c1]" />
                  <p className="mt-5 text-2xl font-semibold tracking-tight">
                    1h 20m
                  </p>
                  <p className="mt-1 text-xs text-[#adbbb1]">
                    tracked writing time
                  </p>
                </div>
                <div className="rounded-xl bg-white/7 p-4">
                  <Quote className="size-4 text-[#d7cef0]" />
                  <p className="mt-5 text-2xl font-semibold tracking-tight">18</p>
                  <p className="mt-1 text-xs text-[#adbbb1]">
                    meaningful revisions
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium tracking-[0.1em] text-[#b9d9c1] uppercase">
                  Trace insight
                </p>
                <p className="mt-2 text-sm leading-6 text-[#edf2ee]">
                  The thesis became more nuanced after the student introduced
                  primary evidence and reconsidered a counterargument.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#adbbb1]">
                <span className="size-1.5 rounded-full bg-[#91c49e]" /> Ready to
                share with an educator
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <section className="border-t border-[#e5e5df] bg-[#dce9df]">
        <Reveal className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
            <div>
              <p className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Make learning visible.
              </p>
              <p className="mt-2 text-[#547061]">
                Start tracing the story behind every draft.
              </p>
            </div>
            <Button
              size="lg"
              className="h-11 rounded-xl bg-[#1d2521] px-5 hover:bg-[#33423a]"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Get started <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-[#77827b] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span>© 2026 Trace · Academic integrity, reimagined.</span>
        <span>Built for the messy, meaningful work of thinking.</span>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: typeof FileText;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <Card className="border-0 bg-[#fbfaf7] shadow-sm shadow-[#1d2521]/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#315943]/10 motion-reduce:transition-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e7eee7] text-[#315943]">
            <Icon className="size-5" />
          </span>
          <span className="font-mono text-xs text-[#8a938d]">{number}</span>
        </div>
        <CardTitle className="mt-5 text-xl tracking-[-0.03em]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-6 text-[#69756d]">{text}</p>
      </CardContent>
    </Card>
  );
}

function LearningTimeline() {
  return (
    <Card className="animate-in fade-in slide-in-from-right-8 relative border border-[#d9dfd8] bg-[#fffefb] py-0 shadow-xl shadow-[#49604f]/10 duration-700 delay-300 fill-mode-both motion-reduce:animate-none">
      <CardHeader className="border-b border-[#e8e9e4] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#83b28c] motion-safe:animate-pulse" />
            <CardTitle className="text-sm">Learning journey</CardTitle>
          </div>
          <Badge variant="outline" className="border-[#dbe3da] text-[#65756b]">
            <Clock3 data-icon="inline-start" /> 80 min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-sm leading-6 text-[#68756d]">
          A short, readable story of how this draft came to life.
        </p>
        <div className="mt-6 space-y-1">
          {phases.map((phase, index) => (
            <div
              key={phase.title}
              className={`animate-in fade-in slide-in-from-bottom-2 grid grid-cols-[22px_1fr] gap-3 duration-500 fill-mode-both motion-reduce:animate-none ${phase.animation}`}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1.5 size-3 rounded-full ring-4 ring-[#fffefb] ${phase.color}`}
                />
                {index < phases.length - 1 && (
                  <span className="mt-1 h-full min-h-12 w-px bg-[#dde3dd]" />
                )}
              </div>
              <div className="pb-5">
                <p className="font-mono text-[11px] text-[#829088]">
                  {phase.time}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2e3933]">
                  {phase.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-[#6c786f]">
                  {phase.text}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[#e8e9e4] pt-4">
          <span className="text-xs font-medium text-[#587360]">
            Generated from 18 revisions
          </span>
          <span className="text-xs text-[#8b958e]">View receipt →</span>
        </div>
      </CardContent>
    </Card>
  );
}
