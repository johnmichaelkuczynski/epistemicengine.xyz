import { getAICompletion } from "./ai-service";
import type { DoctrineStore } from "@shared/schema";

// ==================== STANCE TOKEN TYPES ====================

export interface StanceTokens {
  law_kind: "universal_regularities" | "proportional_dependencies" | "probabilistic_nomic" | "unclear";
  explanation_order: "law_to_instance" | "instance_to_law" | "unclear";
  dn_commitment: "accept" | "reject" | "neutral";
  regularity_role: "foundational" | "surface" | "unclear";
  confidence: number;
}

export interface DoctrineAlignment {
  crossPhaseCoherence: number;
  conflicts: string[];
  alignments: string[];
  mismatchDetails: {
    law_kind?: { expected: string; found: string };
    explanation_order?: { expected: string; found: string };
    dn_commitment?: { expected: string; found: string };
    regularity_role?: { expected: string; found: string };
  };
}

// ==================== RULE-BASED EXTRACTION ====================

function extractLawKind(text: string): { value: StanceTokens["law_kind"]; confidence: number } {
  const lowercaseText = text.toLowerCase();
  
  // Strong patterns for universal regularities
  const universalPatterns = [
    /\b(universal|exceptionless)\s+(regularity|regularities|law|laws)/i,
    /laws?\s+(are|as)\s+(universal|exceptionless)\s+regularity/i,
    /constant\s+conjunction/i,
    /humean\s+regularity/i,
  ];
  
  // Strong patterns for proportional dependencies
  const proportionalPatterns = [
    /proportional\s+(dependenc|constraint|relationship)/i,
    /dispositional\s+(law|property|properties)/i,
    /causal\s+power/i,
    /law\s+(?:encodes|expresses|quantifies)\s+proportion/i,
  ];
  
  // Strong patterns for probabilistic nomic
  const probabilisticPatterns = [
    /probabilistic\s+(law|nomic)/i,
    /statistical\s+law/i,
    /ratio\s+under\s+uncertainty/i,
  ];
  
  const universalScore = universalPatterns.filter(p => p.test(lowercaseText)).length;
  const proportionalScore = proportionalPatterns.filter(p => p.test(lowercaseText)).length;
  const probabilisticScore = probabilisticPatterns.filter(p => p.test(lowercaseText)).length;
  
  const maxScore = Math.max(universalScore, proportionalScore, probabilisticScore);
  
  if (maxScore === 0) {
    return { value: "unclear", confidence: 0.3 };
  }
  
  if (universalScore === maxScore) {
    return { value: "universal_regularities", confidence: Math.min(0.9, 0.6 + universalScore * 0.1) };
  }
  
  if (proportionalScore === maxScore) {
    return { value: "proportional_dependencies", confidence: Math.min(0.9, 0.6 + proportionalScore * 0.1) };
  }
  
  return { value: "probabilistic_nomic", confidence: Math.min(0.9, 0.6 + probabilisticScore * 0.1) };
}

function extractExplanationOrder(text: string): { value: StanceTokens["explanation_order"]; confidence: number } {
  const lowercaseText = text.toLowerCase();
  
  // Patterns for law-to-instance (DN model)
  const lawToInstancePatterns = [
    /\b(?:subsume|subsumption|subsuming)\b/i,
    /law\s+(?:explains|predicts)\s+(?:the\s+)?instance/i,
    /explain(?:ing)?\s+by\s+(?:deduction|deriving)/i,
    /dn\s+(?:model|explanation|framework)/i,
  ];
  
  // Patterns for instance-to-law
  const instanceToLawPatterns = [
    /instance\s+(?:first|before|precedes)\s+law/i,
    /singular\s+(?:causal|cause)\s+(?:first|before|recognition)/i,
    /(?:we|one)\s+learn(?:s)?\s+(?:singular|individual)\s+(?:cases?|instances?)\s+(?:before|first)/i,
    /law\s+(?:quantifies|generalizes|abstracts)\s+(?:from\s+)?(?:singular|individual|particular)/i,
  ];
  
  const lawToInstanceScore = lawToInstancePatterns.filter(p => p.test(lowercaseText)).length;
  const instanceToLawScore = instanceToLawPatterns.filter(p => p.test(lowercaseText)).length;
  
  if (lawToInstanceScore === 0 && instanceToLawScore === 0) {
    return { value: "unclear", confidence: 0.3 };
  }
  
  if (lawToInstanceScore > instanceToLawScore) {
    return { value: "law_to_instance", confidence: Math.min(0.9, 0.6 + lawToInstanceScore * 0.1) };
  }
  
  return { value: "instance_to_law", confidence: Math.min(0.9, 0.6 + instanceToLawScore * 0.1) };
}

function extractDNCommitment(text: string): { value: StanceTokens["dn_commitment"]; confidence: number } {
  const lowercaseText = text.toLowerCase();
  
  // Patterns for DN acceptance
  const acceptPatterns = [
    /dn\s+(?:is|provides|offers)\s+(?:correct|valid|adequate)/i,
    /deductive[- ]nomological\s+(?:is|provides|offers)\s+(?:correct|valid|adequate)/i,
    /hempel\s+(?:is|was)\s+(?:correct|right)/i,
    /covering[- ]law\s+(?:model|account)\s+(?:is|provides)/i,
  ];
  
  // Patterns for DN rejection
  const rejectPatterns = [
    /dn\s+(?:is|model)\s+(?:rejected|mistaken|wrong|flawed|inadequate)/i,
    /deductive[- ]nomological\s+(?:is|model)\s+(?:rejected|mistaken|wrong|flawed)/i,
    /(?:reject|rejecting)\s+(?:the\s+)?dn/i,
    /hempel\s+(?:is|was)\s+(?:mistaken|wrong)/i,
  ];
  
  const acceptScore = acceptPatterns.filter(p => p.test(lowercaseText)).length;
  const rejectScore = rejectPatterns.filter(p => p.test(lowercaseText)).length;
  
  if (acceptScore === 0 && rejectScore === 0) {
    return { value: "neutral", confidence: 0.3 };
  }
  
  if (acceptScore > rejectScore) {
    return { value: "accept", confidence: Math.min(0.9, 0.6 + acceptScore * 0.1) };
  }
  
  if (rejectScore > acceptScore) {
    return { value: "reject", confidence: Math.min(0.9, 0.6 + rejectScore * 0.1) };
  }
  
  return { value: "neutral", confidence: 0.5 };
}

function extractRegularityRole(text: string): { value: StanceTokens["regularity_role"]; confidence: number } {
  const lowercaseText = text.toLowerCase();
  
  // Patterns for regularity as foundational
  const foundationalPatterns = [
    /regularit(?:y|ies)\s+(?:are|is)\s+(?:the\s+)?(?:foundation|basis|ground)/i,
    /regularit(?:y|ies)\s+(?:constitute|constitutive)/i,
    /(?:laws?\s+are|laws?\s+as)\s+regularit/i,
  ];
  
  // Patterns for regularity as surface/derivative
  const surfacePatterns = [
    /regularit(?:y|ies)\s+(?:are|is)\s+(?:the\s+)?(?:surface|shadow|derivative|consequence)/i,
    /regularit(?:y|ies)\s+(?:follow|result)\s+from/i,
    /not\s+constitutive/i,
  ];
  
  const foundationalScore = foundationalPatterns.filter(p => p.test(lowercaseText)).length;
  const surfaceScore = surfacePatterns.filter(p => p.test(lowercaseText)).length;
  
  if (foundationalScore === 0 && surfaceScore === 0) {
    return { value: "unclear", confidence: 0.3 };
  }
  
  if (foundationalScore > surfaceScore) {
    return { value: "foundational", confidence: Math.min(0.9, 0.6 + foundationalScore * 0.1) };
  }
  
  return { value: "surface", confidence: Math.min(0.9, 0.6 + surfaceScore * 0.1) };
}

// ==================== AI-BASED FALLBACK EXTRACTION ====================

async function extractStanceWithAI(text: string): Promise<StanceTokens> {
  const systemPrompt = `You are a philosophical stance analyzer. Extract the author's positions on laws of nature from the provided text.

Return a JSON object with these fields:
{
  "law_kind": "universal_regularities" | "proportional_dependencies" | "probabilistic_nomic" | "unclear",
  "explanation_order": "law_to_instance" | "instance_to_law" | "unclear",
  "dn_commitment": "accept" | "reject" | "neutral",
  "regularity_role": "foundational" | "surface" | "unclear",
  "confidence": number (0-1)
}

Definitions:
- law_kind: Does the text treat laws as universal regularities (Humean), proportional dependencies (dispositional), or probabilistic?
- explanation_order: Does explanation go from law to instance (DN model), or from instance to law?
- dn_commitment: Does the text accept, reject, or stay neutral on the Deductive-Nomological model?
- regularity_role: Are regularities treated as foundational/constitutive, or as surface phenomena?`;

  const userPrompt = `Analyze this philosophical text and extract the stance tokens:\n\n${text}`;

  try {
    const response = await getAICompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxTokens: 1024,
    });
    const parsed = JSON.parse(response);
    
    return {
      law_kind: parsed.law_kind || "unclear",
      explanation_order: parsed.explanation_order || "unclear",
      dn_commitment: parsed.dn_commitment || "neutral",
      regularity_role: parsed.regularity_role || "unclear",
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error("AI stance extraction failed:", error);
    return {
      law_kind: "unclear",
      explanation_order: "unclear",
      dn_commitment: "neutral",
      regularity_role: "unclear",
      confidence: 0.3,
    };
  }
}

// ==================== HYBRID EXTRACTION ====================

export async function extractStanceTokens(text: string): Promise<StanceTokens> {
  // Try rule-based extraction first
  const lawKind = extractLawKind(text);
  const explanationOrder = extractExplanationOrder(text);
  const dnCommitment = extractDNCommitment(text);
  const regularityRole = extractRegularityRole(text);
  
  // Calculate average confidence
  const avgConfidence = (lawKind.confidence + explanationOrder.confidence + dnCommitment.confidence + regularityRole.confidence) / 4;
  
  // If rule-based extraction is confident enough, use it
  if (avgConfidence >= 0.6) {
    return {
      law_kind: lawKind.value,
      explanation_order: explanationOrder.value,
      dn_commitment: dnCommitment.value,
      regularity_role: regularityRole.value,
      confidence: avgConfidence,
    };
  }
  
  // Otherwise, fall back to AI extraction
  return await extractStanceWithAI(text);
}

// ==================== DOCTRINE ALIGNMENT SCORING ====================

export function computeDoctrineAlignment(
  stanceTokens: StanceTokens,
  doctrines: DoctrineStore
): DoctrineAlignment {
  let score = 1.0;
  const conflicts: string[] = [];
  const alignments: string[] = [];
  const mismatchDetails: DoctrineAlignment["mismatchDetails"] = {};
  
  // Check law_kind alignment
  const expectedLawType = doctrines.LAW_TYPE || "proportional_dependencies";
  if (stanceTokens.law_kind !== "unclear") {
    if (stanceTokens.law_kind !== expectedLawType) {
      score -= 0.4;
      conflicts.push(`Law conception: found "${stanceTokens.law_kind}", expected "${expectedLawType}"`);
      mismatchDetails.law_kind = { expected: expectedLawType, found: stanceTokens.law_kind };
    } else {
      alignments.push("Law conception aligns with doctrine");
    }
  }
  
  // Check explanation_order alignment
  const expectedOrder = doctrines.EXPLANATION_ORDER || "instance_to_law";
  if (stanceTokens.explanation_order !== "unclear") {
    if (stanceTokens.explanation_order !== expectedOrder) {
      score -= 0.4;
      conflicts.push(`Explanation order: found "${stanceTokens.explanation_order}", expected "${expectedOrder}"`);
      mismatchDetails.explanation_order = { expected: expectedOrder, found: stanceTokens.explanation_order };
    } else {
      alignments.push("Explanation order aligns with doctrine");
    }
  }
  
  // Check DN commitment alignment
  const expectedDN = doctrines.DN_MODEL || "rejected";
  if (stanceTokens.dn_commitment !== "neutral") {
    const dnMatch = (expectedDN === "rejected" && stanceTokens.dn_commitment === "reject") ||
                    (expectedDN === "accepted" && stanceTokens.dn_commitment === "accept");
    if (!dnMatch) {
      score -= 0.4;
      conflicts.push(`DN model commitment: found "${stanceTokens.dn_commitment}", expected "${expectedDN}"`);
      mismatchDetails.dn_commitment = { expected: expectedDN, found: stanceTokens.dn_commitment };
    } else {
      alignments.push("DN model position aligns with doctrine");
    }
  }
  
  // Check regularity_role alignment
  const expectedRegularity = doctrines.REGULARITY_STATUS || "surface shadow; not constitutive";
  if (stanceTokens.regularity_role !== "unclear") {
    const regularityMatch = expectedRegularity.includes("surface") && stanceTokens.regularity_role === "surface";
    if (!regularityMatch) {
      score -= 0.2;
      conflicts.push(`Regularity role: found "${stanceTokens.regularity_role}", expected "surface"`);
      mismatchDetails.regularity_role = { expected: "surface", found: stanceTokens.regularity_role };
    } else {
      alignments.push("Regularity status aligns with doctrine");
    }
  }
  
  // Ensure score is between 0 and 1
  score = Math.max(0, Math.min(1, score));
  
  return {
    crossPhaseCoherence: score,
    conflicts,
    alignments,
    mismatchDetails,
  };
}
