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
  applyMilestoneCoverageGuardrail,
  applyPasteCoverageGuardrail,
  applyWritingRateCoverageGuardrail,
} from "@/lib/legitimacy-analysis-guardrails";
import { buildLegitimacyAnalysisRecord } from "@/lib/legitimacy-analysis-record";
import {
  getLegitimacyAnalysisRefreshState,
  isLegitimacyAnalysis,
  type LegitimacyAnalysis,
} from "@/lib/legitimacy-analysis";
import { hashDocumentBody } from "@/lib/legitimacy-analysis.server";

const ANALYSIS_MODEL = "gpt-5-nano";
const legitimacyAnalysisSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    scoreRationale: { type: "string" },
    label: { type: "string", enum: ["strong", "mixed", "needs_review"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    explanations: {
      type: "array",
      minItems: 2,
      maxItems: 6,
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
    "scoreRationale",
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
      bulkPasteWordCount: true,
      content: true,
      createdAt: true,
      typingWordsPerMinute: true,
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
      receipt: submission?.receipt,
      milestones,
    });
    const response = await getOpenAIClient(apiKey).responses.create({
      model: ANALYSIS_MODEL,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 1_500,
      instructions: receiptLegitimacyAnalysisInstructions,
      input: JSON.stringify(analysisInput.record),
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
    analysis = applyMilestoneCoverageGuardrail(
      applyWritingRateCoverageGuardrail(
        applyPasteCoverageGuardrail(parsed, analysisInput.analysisFacts),
        analysisInput.analysisFacts,
      ),
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
  receipt,
  milestones,
}: {
  document: { content: Block[] | null };
  receipt?: { finalContent: Block[]; finalWordCount: number } | null;
  milestones: Array<{
    activeSeconds: number;
    bulkPasteWordCount: number;
    content: Block[] | null;
    createdAt: Date;
    typingWordsPerMinute: number;
    wordCount: number;
  }>;
}) {
  const finalContent = receipt?.finalContent ?? document.content ?? [];
  const finalText = extractText(finalContent);
  const record = buildLegitimacyAnalysisRecord(milestones, finalText);

  const bulkPasteEvents = milestones.filter((milestone) => milestone.bulkPasteWordCount > 0);
  const rapidRecordedAdditions = milestones.filter((milestone, index) => {
    const previous = milestones[index - 1];
    const wordChange = Math.max(0, previous ? milestone.wordCount - previous.wordCount : milestone.wordCount);
    const wordsPerMinute = milestone.activeSeconds > 0
      ? Math.round((wordChange * 60) / milestone.activeSeconds)
      : 0;
    return wordChange >= 75 && wordsPerMinute >= 250;
  });

  return {
    analysisFacts: {
      savedMilestoneCount: milestones.length,
      finalWordCount: receipt?.finalWordCount ?? countWords(finalText),
      totalBulkPasteWordCount: bulkPasteEvents.reduce(
        (total, milestone) => total + milestone.bulkPasteWordCount,
        0,
      ),
      rapidRecordedAdditionCount: rapidRecordedAdditions.length,
      fastestRecordedWordsPerMinute: milestones.reduce((fastest, milestone, index) => {
        const previous = milestones[index - 1];
        const wordChange = Math.max(0, previous ? milestone.wordCount - previous.wordCount : milestone.wordCount);
        return milestone.activeSeconds > 0
          ? Math.max(fastest, Math.round((wordChange * 60) / milestone.activeSeconds))
          : fastest;
      }, 0),
    },
    record,
  };
}

function countWords(value: string) {
  const normalized = value.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function extractText(value: unknown): string {
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as { content?: unknown; text?: unknown };
  if (typeof record.text === "string") return record.text;
  return extractText(record.content);
}
