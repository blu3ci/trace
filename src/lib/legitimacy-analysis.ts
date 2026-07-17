export const legitimacyLabels = ["strong", "mixed", "needs_review"] as const;
export const legitimacyConfidenceLevels = ["low", "medium", "high"] as const;
export const legitimacyImpactTypes = ["supports", "neutral", "needs_review"] as const;
export const citationAssessmentTypes = [
  "citation_evidence_present",
  "citation_evidence_limited",
  "no_citation_evidence_observed",
] as const;

export type LegitimacyLabel = (typeof legitimacyLabels)[number];
export type LegitimacyConfidence = (typeof legitimacyConfidenceLevels)[number];
export type LegitimacyImpact = (typeof legitimacyImpactTypes)[number];
export type CitationAssessment = (typeof citationAssessmentTypes)[number];

export type LegitimacyAnalysis = {
  score: number;
  label: LegitimacyLabel;
  confidence: LegitimacyConfidence;
  summary: string;
  explanations: Array<{
    title: string;
    detail: string;
    impact: LegitimacyImpact;
  }>;
  citationAssessment: {
    status: CitationAssessment;
    detail: string;
  };
  recommendedNextStep: string;
};

export function isLegitimacyAnalysis(value: unknown): value is LegitimacyAnalysis {
  if (!isRecord(value)) return false;

  const { citationAssessment, confidence, explanations, label, recommendedNextStep, score, summary } = value;
  return typeof score === "number"
    && Number.isInteger(score)
    && score >= 0
    && score <= 100
    && isOneOf(label, legitimacyLabels)
    && isOneOf(confidence, legitimacyConfidenceLevels)
    && typeof summary === "string"
    && summary.length > 0
    && Array.isArray(explanations)
    && explanations.length >= 2
    && explanations.length <= 4
    && explanations.every(isExplanation)
    && isCitationAssessment(citationAssessment)
    && typeof recommendedNextStep === "string"
    && recommendedNextStep.length > 0;
}

function isExplanation(value: unknown): value is LegitimacyAnalysis["explanations"][number] {
  return isRecord(value)
    && typeof value.title === "string"
    && value.title.length > 0
    && typeof value.detail === "string"
    && value.detail.length > 0
    && isOneOf(value.impact, legitimacyImpactTypes);
}

function isCitationAssessment(value: unknown): value is LegitimacyAnalysis["citationAssessment"] {
  return isRecord(value)
    && isOneOf(value.status, citationAssessmentTypes)
    && typeof value.detail === "string"
    && value.detail.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOneOf<const T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}
