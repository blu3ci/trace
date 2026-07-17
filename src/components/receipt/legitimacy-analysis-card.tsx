"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, CheckCircle2, CircleAlert, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-[#315943]" /> AI writing-process analysis</CardTitle>
          <p className="mt-1.5 text-sm leading-5 text-[#607067]">A structured review of the saved milestones, including research and citation context.</p>
        </div>
        {analysis && <AnalysisBadge label={analysis.label} />}
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div key={analysis.generatedAt} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ScoreRing score={analysis.score} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#26362c]">{analysis.summary}</p>
                <p className="mt-2 text-sm leading-5 text-[#607067]">Confidence: {analysis.confidence}. This is a process signal for human review, not a finding of academic misconduct.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {analysis.explanations.map((explanation) => (
                <div key={`${explanation.title}-${explanation.impact}`} className="rounded-lg border border-[#dbe7de] bg-white/80 p-3.5">
                  <div className="flex items-center gap-2">
                    <ImpactIcon impact={explanation.impact} />
                    <p className="text-sm font-medium text-[#2e4134]">{explanation.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[#607067]">{explanation.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-[#dbe7de] bg-[#f7faf7] p-3.5">
              <p className="text-xs font-semibold tracking-[0.08em] text-[#567160] uppercase">Citation context</p>
              <p className="mt-1 text-sm leading-5 text-[#526258]">{analysis.citationAssessment.detail}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#dbe7de] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-5 text-[#607067]"><span className="font-medium text-[#3d5143]">Suggested next step:</span> {analysis.recommendedNextStep}</p>
              <Button type="button" variant="outline" size="sm" disabled={isPending || !refreshState.canRefresh} onClick={runAnalysis} className="shrink-0">
                {isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                Refresh analysis
              </Button>
            </div>
            {!refreshState.canRefresh && <p className="mt-3 text-sm text-[#607067]">{refreshState.message}</p>}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#b9cfbd] bg-white/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <p className="text-sm leading-5 text-[#607067]">Generate a consistent score and evidence-based explanation from this document&apos;s writing milestones.</p>
            <Button type="button" className="mt-4 sm:mt-0" disabled={isPending} onClick={runAnalysis}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
              {isPending ? "Analyzing milestones…" : "Analyze writing process"}
            </Button>
          </div>
        )}
        {error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-[#a13d34]"><CircleAlert className="size-4" /> {error}</p>}
      </CardContent>
    </Card>
  );
}

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 75 ? "#4f8a5a" : score >= 50 ? "#b27a34" : "#bd5145";
  return (
    <div
      className="grid size-28 shrink-0 place-items-center rounded-full p-2 shadow-inner transition-transform duration-500 motion-safe:animate-in motion-safe:zoom-in-75"
      style={{ background: `conic-gradient(${tone} ${score}%, #dce8df ${score}% 100%)` }}
      aria-label={`Writing-process score: ${score} out of 100`}
    >
      <div className="grid size-full place-items-center rounded-full bg-white text-center shadow-sm">
        <span className="text-3xl font-semibold tracking-[-0.07em] text-[#26362c]">{score}</span>
        <span className="-mt-1 text-[10px] font-medium tracking-[0.08em] text-[#65716a] uppercase">out of 100</span>
      </div>
    </div>
  );
}

function AnalysisBadge({ label }: { label: LegitimacyAnalysis["label"] }) {
  const labels = {
    strong: { text: "Strong process evidence", className: "bg-[#e5f1e8] text-[#315943]" },
    mixed: { text: "Mixed process evidence", className: "bg-[#fbf1df] text-[#7b5725]" },
    needs_review: { text: "Needs context", className: "bg-[#fbe9e7] text-[#9b332a]" },
  } as const;
  const current = labels[label];
  return <Badge className={current.className}>{current.text}</Badge>;
}

function ImpactIcon({ impact }: { impact: LegitimacyAnalysis["explanations"][number]["impact"] }) {
  if (impact === "supports") return <CheckCircle2 className="size-4 text-[#4f8a5a]" />;
  if (impact === "needs_review") return <CircleAlert className="size-4 text-[#b4653f]" />;
  return <BrainCircuit className="size-4 text-[#65716a]" />;
}
