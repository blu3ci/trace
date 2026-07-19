"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { Block } from "@blocknote/core";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import * as yup from "yup";

import { db } from "@/db";
import { receiptLegitimacyAnalysesTable } from "@/db/schema";
import { receiptLegitimacyAnalysisSchema } from "@/formSchemas/receipt-legitimacy-analysis";
import { receiptLegitimacyAnalysisInstructions } from "@/lib/legitimacy-analysis-prompt";
import {
  applyPasteCoverageGuardrail,
  applyWritingRateCoverageGuardrail,
} from "@/lib/legitimacy-analysis-guardrails";
import {
  getLegitimacyAnalysisRefreshState,
  isLegitimacyAnalysis,
  type LegitimacyAnalysis,
} from "@/lib/legitimacy-analysis";
import { hashDocumentBody } from "@/lib/legitimacy-analysis.server";

const ANALYSIS_MODEL = "gpt-5-nano";
const MAX_CITATION_SIGNALS_PER_MILESTONE = 3;

const legitimacyAnalysisSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    label: { type: "string", enum: ["strong", "mixed", "needs_review"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    explanations: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          impact: { type: "string", enum: ["supports", "neutral", "needs_review"] },
        },
        required: ["title", "detail", "impact"],
        additionalProperties: false,
      },
    },
    citationAssessment: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "citation_evidence_present",
            "citation_evidence_limited",
            "no_citation_evidence_observed",
          ],
        },
        detail: { type: "string" },
      },
      required: ["status", "detail"],
      additionalProperties: false,
    },
    recommendedNextStep: { type: "string" },
  },
  required: [
    "score",
    "label",
    "confidence",
    "summary",
    "explanations",
    "citationAssessment",
    "recommendedNextStep",
  ],
  additionalProperties: false,
} as const;

export type GenerateDocumentLegitimacyAnalysisResult =
  | { error: false; analysis: LegitimacyAnalysis; generatedAt: string }
  | { error: true; message: string };

export async function generateDocumentLegitimacyAnalysis(
  unsafeDocumentId: string,
): Promise<GenerateDocumentLegitimacyAnalysisResult> {
  const { userId } = await auth();
  if (!userId) return { error: true, message: "Sign in again before running an analysis." };

  let documentId: string;
  try {
    ({ documentId } = await receiptLegitimacyAnalysisSchema.validate(
      { documentId: unsafeDocumentId },
      { stripUnknown: true },
    ));
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { error: true, message: "This document is no longer available." };
    }
    return { error: true, message: "We couldn’t validate this document." };
  }

  const document = await db.query.documentsTable.findFirst({
    where: { id: documentId },
    with: {
      assignmentSubmission: { with: { assignment: true, receipt: true } },
      legitimacyAnalysis: true,
    },
  });
  if (!document) {
    return { error: true, message: "This document is no longer available." };
  }
  const submission = document.assignmentSubmission;
  const canViewDocument = document.clerkUserId === userId
    || submission?.assignment?.clerkUserId === userId;
  if (!canViewDocument) {
    return { error: true, message: "You don’t have access to this document." };
  }

  const contentHash = hashDocumentBody(document.content);
  const refreshState = getLegitimacyAnalysisRefreshState({
    analysis: document.legitimacyAnalysis,
  });
  if (!refreshState.canRefresh) return { error: true, message: refreshState.message };

  const milestones = await db.query.documentMilestonesTable.findMany({
    where: { documentId },
    orderBy: ({ createdAt }, { asc }) => asc(createdAt),
    columns: {
      activeSeconds: true,
      blockCount: true,
      bulkPasteWordCount: true,
      content: true,
      createdAt: true,
      wordCount: true,
    },
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: true, message: "AI analysis is not configured yet. Add OPENAI_API_KEY and try again." };
  }

  let analysis: LegitimacyAnalysis;
  try {
    const analysisInput = buildAnalysisInput({
      document,
      assignment: submission?.assignment,
      receipt: submission?.receipt,
      milestones,
    });
    const response = await getOpenAIClient(apiKey).responses.create({
      model: ANALYSIS_MODEL,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 4_000,
      instructions: receiptLegitimacyAnalysisInstructions,
      input: JSON.stringify(analysisInput),
      text: {
        format: {
          type: "json_schema",
          name: "receipt_legitimacy_analysis",
          strict: true,
          schema: legitimacyAnalysisSchema,
        },
      },
    });

    if (response.status === "incomplete") {
      if (response.incomplete_details?.reason === "max_output_tokens") {
        return { error: true, message: "The analysis needed more space to finish. Please try again." };
      }
      return { error: true, message: "The analysis could not be completed for this receipt." };
    }
    if (response.status !== "completed") {
      return { error: true, message: "The AI analysis is unavailable right now. Please try again." };
    }
    if (!response.output_text.trim()) {
      return { error: true, message: "The AI analysis returned no usable result. Please try again." };
    }

    const parsed = JSON.parse(response.output_text) as unknown;
    if (!isLegitimacyAnalysis(parsed)) throw new Error("The response did not match the expected analysis format.");
    analysis = applyWritingRateCoverageGuardrail(
      applyPasteCoverageGuardrail(parsed, analysisInput.analysisFacts),
      analysisInput.analysisFacts,
    );
  } catch (error) {
    console.error("Unable to generate document legitimacy analysis", error);
    return { error: true, message: "The AI analysis is unavailable right now. Please try again." };
  }

  const generatedAt = new Date();
  await db
    .insert(receiptLegitimacyAnalysesTable)
    .values({
      documentId,
      receiptId: submission?.receipt?.id,
      contentHash,
      model: ANALYSIS_MODEL,
      analysis,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    })
    .onConflictDoUpdate({
      target: receiptLegitimacyAnalysesTable.documentId,
      set: {
        receiptId: submission?.receipt?.id,
        contentHash,
        model: ANALYSIS_MODEL,
        analysis,
        updatedAt: generatedAt,
      },
    });

  revalidatePath(`/receipts/document/${documentId}`);
  if (submission?.receipt) revalidatePath(`/receipts/${submission.id}`);
  return { error: false, analysis, generatedAt: generatedAt.toISOString() };
}

function getOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function buildAnalysisInput({
  document,
  assignment,
  receipt,
  milestones,
}: {
  document: { content: Block[] | null; title: string };
  assignment?: { title: string; description: string | null } | null;
  receipt?: { activeSeconds: number; finalContent: Block[]; finalWordCount: number; revisionCount: number } | null;
  milestones: Array<{
    activeSeconds: number;
    blockCount: number;
    bulkPasteWordCount: number;
    content: Block[] | null;
    createdAt: Date;
    wordCount: number;
  }>;
}) {
  const finalContent = receipt?.finalContent ?? document.content ?? [];
  const finalText = extractText(finalContent);
  const timeline = milestones.map((milestone, index) => {
    const text = extractText(milestone.content);
    const previous = milestones[index - 1];
    const citationSignals = extractCitationSignals(text);
    return {
      milestone: index + 1,
      savedAt: milestone.createdAt.toISOString(),
      wordCount: milestone.wordCount,
      wordChangeFromPrevious: previous ? milestone.wordCount - previous.wordCount : milestone.wordCount,
      recordedWordsPerMinute: milestone.activeSeconds > 0
        ? Math.round((Math.max(0, previous ? milestone.wordCount - previous.wordCount : milestone.wordCount) * 60) / milestone.activeSeconds)
        : 0,
      blockCount: milestone.blockCount,
      activeSeconds: milestone.activeSeconds,
      bulkPasteWordCount: milestone.bulkPasteWordCount,
      citationSignals,
    };
  });

  const totalActiveSeconds = receipt?.activeSeconds
    ?? milestones.reduce((total, milestone) => total + milestone.activeSeconds, 0);
  const bulkPasteEvents = timeline.filter((milestone) => milestone.bulkPasteWordCount > 0);
  const largestBulkPasteWordCount = bulkPasteEvents.reduce(
    (largest, milestone) => Math.max(largest, milestone.bulkPasteWordCount),
    0,
  );
  const citationSignalCount = timeline.reduce(
    (total, milestone) => total + milestone.citationSignals.length,
    0,
  );
  const finalCitationSignals = extractCitationSignals(finalText, 12);
  const rapidRecordedAdditions = timeline.filter((milestone) => (
    milestone.wordChangeFromPrevious >= 75
    && milestone.activeSeconds > 0
    && milestone.recordedWordsPerMinute >= 250
  ));

  return {
    assignment: {
      title: assignment?.title ?? document.title,
      description: assignment?.description ?? null,
    },
    analysisFacts: {
      savedMilestoneCount: timeline.length,
      finalContentAvailable: finalText.length > 0,
      finalWordCount: receipt?.finalWordCount ?? countWords(finalText),
      revisionCount: receipt?.revisionCount ?? milestones.length,
      recordedActiveSeconds: totalActiveSeconds,
      milestonesWithRecordedActiveTime: timeline.filter((milestone) => milestone.activeSeconds > 0).length,
      bulkPasteEventCount: bulkPasteEvents.length,
      totalBulkPasteWordCount: bulkPasteEvents.reduce(
        (total, milestone) => total + milestone.bulkPasteWordCount,
        0,
      ),
      largestBulkPasteWordCount,
      milestonesAfterLastBulkPaste: bulkPasteEvents.length
        ? timeline.length - bulkPasteEvents.at(-1)!.milestone
        : 0,
      rapidRecordedAdditionCount: rapidRecordedAdditions.length,
      fastestRecordedWordsPerMinute: rapidRecordedAdditions.reduce(
        (fastest, milestone) => Math.max(fastest, milestone.recordedWordsPerMinute),
        0,
      ),
      citationSignalCount,
      milestonesWithCitationSignals: timeline.filter((milestone) => milestone.citationSignals.length > 0).length,
      finalCitationSignalCount: finalCitationSignals.length,
      dataLimitations: [
        "Saved milestones are checkpoints, not a full keystroke history.",
        "Recorded active time does not include all planning, reading, or offline writing.",
        "Citation signals are heuristic pattern matches and do not verify sources or citation quality.",
      ],
    },
    receipt: {
      finalWordCount: receipt?.finalWordCount ?? countWords(finalText),
      revisionCount: receipt?.revisionCount ?? milestones.length,
      totalActiveSeconds,
      finalCitationSignals,
    },
    milestones: timeline,
  };
}

function countWords(value: string) {
  const normalized = value.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function extractCitationSignals(value: string, limit = MAX_CITATION_SIGNALS_PER_MILESTONE) {
  const patterns = [
    /\b(?:works cited|references|bibliography|sources consulted)\b/gi,
    /\b(?:https?:\/\/\S+|doi:\s*\S+)/gi,
    /\[[0-9]{1,3}\]/g,
    /\([A-Z][A-Za-z'’-]+(?:\s+(?:and|&|et al\.)\s+[A-Z][A-Za-z'’-]+)?(?:,\s*)?(?:19|20)\d{2}(?:,\s*(?:p{1,2}\.)?\s*\d+(?:[-–]\d+)?)?\)/g,
  ];
  const signals: string[] = [];

  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) {
      signals.push(excerptAround(value, match.index ?? 0, match[0].length));
      if (signals.length >= limit) return signals;
    }
  }

  return signals;
}

function extractText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as { content?: unknown; text?: unknown };
  if (typeof record.text === "string") return record.text;
  return extractText(record.content);
}

function excerptAround(value: string, start: number, length: number) {
  const before = Math.max(0, start - 120);
  const after = Math.min(value.length, start + length + 120);
  return value.slice(before, after).replace(/\s+/g, " ").trim();
}
