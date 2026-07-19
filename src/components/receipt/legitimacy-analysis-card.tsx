"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, CheckCircle2, CircleAlert, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";

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
}: {
  documentId: string;
  initialAnalysis?: DisplayAnalysis;
  initialRefreshState: LegitimacyAnalysisRefreshState;
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
        message: "Edit and save the document body before refreshing this analysis.",
      });
    });
  }

  return (
    <Card className="border-[#cfddd2] bg-[linear-gradient(135deg,#f7fbf8_0%,#ffffff_55%,#f0f7f1_100%)] shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-[#dbe7de] bg-white/45 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-[#315943]" /> AI writing-process summary</CardTitle>
          <p className="mt-1.5 text-sm leading-5 text-[#607067]">A structured summary of saved milestones, including observed research and citation-like signals.</p>
        </div>
        {analysis && <CoverageMeter label={analysis.label} />}
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div key={analysis.generatedAt} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 duration-500">
            <div className="rounded-lg border border-[#dbe7de] bg-white/70 p-4">
              <p className="max-w-3xl font-medium leading-6 text-[#26362c]">{humanizeAnalysisText(analysis.summary)}</p>
              <p className="mt-2 text-sm leading-5 text-[#607067]">{confidenceCopy(analysis.confidence)} This reflects the saved record&apos;s coverage, not authorship or academic misconduct.</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#dbe7de] bg-white/75">
              {analysis.explanations.map((explanation) => (
                <div key={`${explanation.title}-${explanation.impact}`} className="grid gap-2 border-b border-[#e4ece6] p-4 last:border-b-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5">
                  <div className="flex items-center gap-2">
                    <ImpactIcon impact={explanation.impact} />
                    <p className="text-sm font-medium text-[#2e4134]">{explanation.title}</p>
                  </div>
                  <p className="text-sm leading-5 text-[#607067]">{humanizeAnalysisText(explanation.detail)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3 rounded-lg border border-[#dbe7de] bg-[#f7faf7] p-4">
              <BrainCircuit className="mt-0.5 size-4 shrink-0 text-[#567160]" />
              <div>
                <p className="text-sm font-medium text-[#2e4134]">Citation-like signals</p>
                <p className="mt-1 text-sm leading-5 text-[#526258]">{humanizeAnalysisText(analysis.citationAssessment.detail)}</p>
                <p className="mt-1.5 text-xs leading-4 text-[#65716a]">Pattern matches in the saved text, not verified citations or sources.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#dbe7de] pt-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm leading-5 text-[#607067]"><span className="font-medium text-[#3d5143]">Suggested next step:</span> {humanizeAnalysisText(analysis.recommendedNextStep)}</p>
              <Button type="button" variant="outline" size="sm" disabled={isPending || !refreshState.canRefresh} onClick={runAnalysis} className="shrink-0">
                {isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                Refresh analysis
              </Button>
            </div>
            {!refreshState.canRefresh && <p className="mt-3 text-sm text-[#607067]">{refreshState.message}</p>}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#b9cfbd] bg-white/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <p className="text-sm leading-5 text-[#607067]">Generate an evidence-based summary of this document&apos;s saved writing milestones.</p>
            <Button type="button" className="mt-4 sm:mt-0" disabled={isPending} onClick={runAnalysis}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
              {isPending ? "Summarizing milestones…" : "Summarize writing process"}
            </Button>
          </div>
        )}
        {error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-[#a13d34]"><CircleAlert className="size-4" /> {error}</p>}
      </CardContent>
    </Card>
  );
}

function CoverageMeter({ label }: { label: LegitimacyAnalysis["label"] }) {
  const coverage = {
    strong: { text: "Strong", filledSegments: 3, activeClassName: "bg-[#4f8a5a]" },
    mixed: { text: "Partial", filledSegments: 2, activeClassName: "bg-[#b27a34]" },
    needs_review: { text: "Limited", filledSegments: 1, activeClassName: "bg-[#b27a34]" },
  } as const;
  const current = coverage[label];

  return (
    <div className="shrink-0 rounded-md border border-[#dbe7de] bg-[#f7faf7] px-3 py-2 sm:w-40" aria-label={`${current.text}: ${current.filledSegments} of 3 levels`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#567160] uppercase">Coverage</p>
        <p className="text-xs font-medium text-[#3d5143]">{current.text}</p>
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((segment) => <span key={segment} className={`h-1.5 flex-1 rounded-full ${segment < current.filledSegments ? current.activeClassName : "bg-[#dce8df]"}`} />)}
      </div>
    </div>
  );
}

function ImpactIcon({ impact }: { impact: LegitimacyAnalysis["explanations"][number]["impact"] }) {
  if (impact === "supports") return <CheckCircle2 className="size-4 text-[#4f8a5a]" />;
  if (impact === "needs_review") return <CircleAlert className="size-4 text-[#b4653f]" />;
  return <BrainCircuit className="size-4 text-[#65716a]" />;
}

function confidenceCopy(confidence: LegitimacyAnalysis["confidence"]) {
  return { high: "The saved record provides a clear view of this process.", medium: "The saved record provides a partial view of this process.", low: "The saved record provides a limited view of this process." }[confidence];
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
