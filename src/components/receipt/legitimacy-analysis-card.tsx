"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, CircleAlert, Info, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDocumentLegitimacyAnalysis } from "@/server/actions/receipt-legitimacy-analysis";
import type {
  LegitimacyAnalysis,
  LegitimacyAnalysisRefreshState,
} from "@/lib/legitimacy-analysis";

type DisplayAnalysis = LegitimacyAnalysis & { generatedAt: string };

export function LegitimacyAnalysisCard({
  documentId,
  initialAnalysis,
  initialRefreshState,
  milestoneCount,
}: {
  documentId: string;
  initialAnalysis?: DisplayAnalysis;
  initialRefreshState: LegitimacyAnalysisRefreshState;
  milestoneCount: number;
}) {
  const [analysis, setAnalysis] = useState<DisplayAnalysis | undefined>(initialAnalysis);
  const [refreshState, setRefreshState] = useState(initialRefreshState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAnalysis() {
    setError(null);
    startTransition(async () => {
      const result = await generateDocumentLegitimacyAnalysis(documentId);
      if (result.error) {
        setError(result.message);
        return;
      }

      setAnalysis({ ...result.analysis, generatedAt: result.generatedAt });
      setRefreshState({
        canRefresh: false,
        message: "Refresh available in 10m.",
      });
    });
  }

  return (
    <Card className="border-[#cfddd2] bg-[linear-gradient(135deg,#f7fbf8_0%,#ffffff_55%,#f0f7f1_100%)] shadow-sm">
      <CardHeader className="border-b border-[#dbe7de] bg-white/45">
        <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-[#315943]" /> Writing-process summary</CardTitle>
        <p className="mt-1.5 text-sm leading-5 text-[#607067]">A factual narrative of saved milestones and observed record notes.</p>
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div key={analysis.generatedAt} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 duration-500">
            <div className="rounded-lg border border-[#dbe7de] bg-white/70 p-4">
              <p className="max-w-3xl font-medium leading-6 text-[#26362c]">{humanizeAnalysisText(analysis.summary)}</p>
              <p className="mt-2 text-sm leading-5 text-[#607067]">This reflects saved checkpoints and observed events, not authorship or academic misconduct.</p>
            </div>

            <MilestoneProgress milestoneCount={milestoneCount} />

            <section className="mt-4 overflow-hidden rounded-lg border border-[#dbe7de] bg-white/75" aria-label="Milestone highlights">
              <p className="border-b border-[#e4ece6] px-4 py-3 text-sm font-medium text-[#2e4134]">Milestone highlights</p>
              {analysis.explanations.map((explanation) => (
                <div key={`${explanation.title}-${explanation.detail}`} className="grid gap-2 border-b border-[#e4ece6] p-4 last:border-b-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5">
                  <div className="flex items-center gap-2">
                    <NoteIcon impact={explanation.impact} />
                    <p className="text-sm font-medium text-[#2e4134]">{explanation.title}</p>
                  </div>
                  <p className="text-sm leading-5 text-[#607067]">{humanizeAnalysisText(explanation.detail)}</p>
                </div>
              ))}
            </section>

            <div className="mt-4 flex gap-3 rounded-lg border border-[#dbe7de] bg-[#f7faf7] p-4">
              <Info className="mt-0.5 size-4 shrink-0 text-[#567160]" />
              <div>
                <p className="text-sm font-medium text-[#2e4134]">Citation-like signals</p>
                <p className="mt-1 text-sm leading-5 text-[#526258]">{humanizeAnalysisText(analysis.citationAssessment.detail)}</p>
                <p className="mt-1.5 text-xs leading-4 text-[#65716a]">Pattern matches in saved text, not verified citations or sources.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#dbe7de] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-5 text-[#607067]">Refresh to create a new factual summary from the saved milestones.</p>
              <Button type="button" variant="outline" size="sm" disabled={isPending || !refreshState.canRefresh} onClick={runAnalysis} className="shrink-0">
                {isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                Refresh summary
              </Button>
            </div>
            {!refreshState.canRefresh && <p className="mt-3 text-sm text-[#607067]">{refreshState.message}</p>}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#b9cfbd] bg-white/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <p className="text-sm leading-5 text-[#607067]">Create a factual summary of this document&apos;s saved writing milestones.</p>
            <Button type="button" className="mt-4 sm:mt-0" disabled={isPending} onClick={runAnalysis}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
              {isPending ? "Summarizing milestones…" : "Summarize milestones"}
            </Button>
          </div>
        )}
        {error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-[#a13d34]"><CircleAlert className="size-4" /> {error}</p>}
      </CardContent>
    </Card>
  );
}

function MilestoneProgress({ milestoneCount }: { milestoneCount: number }) {
  const visibleMilestones = Math.min(Math.max(milestoneCount, 1), 8);

  return (
    <section className="mt-4 rounded-lg border border-[#dbe7de] bg-white/75 p-4" aria-label="Saved milestone progression">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#2e4134]">Saved milestone progression</p>
          <p className="mt-1 text-sm text-[#607067]">{milestoneCount === 0 ? "No saved milestones yet" : `${milestoneCount} saved ${milestoneCount === 1 ? "milestone" : "milestones"} in sequence`}</p>
        </div>
        {milestoneCount > 8 && <span className="rounded-full bg-[#edf5ee] px-2.5 py-1 text-xs font-medium text-[#476a51]">8 shown</span>}
      </div>
      <div className="mt-4 flex items-center" aria-hidden="true">
        {Array.from({ length: visibleMilestones }, (_, index) => (
          <div key={index} className="flex flex-1 items-center last:flex-none">
            <span className={`size-3 shrink-0 rounded-full ring-4 ring-white ${index === 0 ? "bg-[#315943]" : index === visibleMilestones - 1 ? "bg-[#78a782]" : "bg-[#a9c8ae]"}`} />
            {index < visibleMilestones - 1 && <span className="h-px flex-1 bg-[#c9dccd]" />}
          </div>
        ))}
      </div>
      {milestoneCount > 0 && <div className="mt-3 flex justify-between text-xs font-medium text-[#65716a]"><span>First saved draft</span><span>Latest saved draft</span></div>}
    </section>
  );
}

function NoteIcon({ impact }: { impact: LegitimacyAnalysis["explanations"][number]["impact"] }) {
  return impact === "needs_review"
    ? <CircleAlert className="size-4 text-[#b4653f]" />
    : <Info className="size-4 text-[#567160]" />;
}

function humanizeAnalysisText(value: string) {
  return value
    .replace(/FinalContentAvailable is true with finalWordCount (\d+), indicating a complete saved state at the end of milestone (\d+)\.?/gi, "A final saved draft of $1 words is available at milestone $2.")
    .replace(/No citation-like signals were recorded across milestones; citationSignals array is empty\.?/gi, "No citation-like signals were recorded across the saved milestones.")
    .replace(/citationSignals array is empty/gi, "no citation-like signals were recorded")
    .replace(/finalContentAvailable/gi, "final draft availability")
    .replace(/finalWordCount/gi, "final word count")
    .replace(/citationSignals/gi, "citation-like signals");
}
