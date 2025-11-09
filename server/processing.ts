import { getAICompletion } from "./ai-service";
import {
  EPISTEMIC_INFERENCE_SYSTEM_PROMPT,
  EPISTEMIC_INFERENCE_USER_PROMPT,
  JUSTIFICATION_BUILDER_SYSTEM_PROMPT,
  JUSTIFICATION_BUILDER_USER_PROMPT,
  KNOWLEDGE_UTILITY_SYSTEM_PROMPT,
  KNOWLEDGE_UTILITY_USER_PROMPT,
  ARGUMENT_DETECTION_SYSTEM_PROMPT,
  ARGUMENT_DETECTION_USER_PROMPT,
} from "./epistemic-prompts";
import type {
  EpistemicInferenceResult,
  JustificationBuilderResult,
  KnowledgeUtilityResult,
} from "@shared/schema";

// ==================== UTILITIES ====================

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function segmentText(text: string, maxWords: number = 2000): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return [text];
  }

  const segments: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentSegment: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).length;
    
    if (currentWordCount + sentenceWords > maxWords && currentSegment.length > 0) {
      segments.push(currentSegment.join('. ') + '.');
      currentSegment = [sentence.trim()];
      currentWordCount = sentenceWords;
    } else {
      currentSegment.push(sentence.trim());
      currentWordCount += sentenceWords;
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment.join('. ') + '.');
  }

  return segments;
}

// ==================== ARGUMENT DETECTION ====================

interface ArgumentDetectionResult {
  isArgumentative: boolean;
  confidence: number;
  reasoning: string;
}

export async function detectArgument(text: string): Promise<ArgumentDetectionResult> {
  // Quick heuristic check first - look for common argument markers
  const hasInferenceMarkers = /\b(therefore|thus|hence|consequently|because|since|as|implies|suggests?|indicates?|shows?|proves?|demonstrates?|leads? to|causes?|results? in)\b/i.test(text);
  
  // If we find clear inference markers, skip AI detection and proceed
  if (hasInferenceMarkers) {
    return {
      isArgumentative: true,
      confidence: 0.9,
      reasoning: "Contains explicit inference markers",
    };
  }

  try {
    const response = await getAICompletion({
      systemPrompt: ARGUMENT_DETECTION_SYSTEM_PROMPT,
      userPrompt: ARGUMENT_DETECTION_USER_PROMPT(text),
      temperature: 0.2,
      maxTokens: 500,
    });

    const result = JSON.parse(response);
    return {
      isArgumentative: result.isArgumentative ?? true,
      confidence: result.confidence ?? 0.5,
      reasoning: result.reasoning ?? "Unable to determine",
    };
  } catch (error) {
    console.error("Argument detection failed:", error);
    // Default to true if detection fails (be permissive)
    return {
      isArgumentative: true,
      confidence: 0.5,
      reasoning: "Detection service unavailable, proceeding with analysis",
    };
  }
}

// ==================== EPISTEMIC INFERENCE MODULE ====================

export async function processEpistemicInference(
  text: string
): Promise<EpistemicInferenceResult> {
  const response = await getAICompletion({
    systemPrompt: EPISTEMIC_INFERENCE_SYSTEM_PROMPT,
    userPrompt: EPISTEMIC_INFERENCE_USER_PROMPT(text),
    temperature: 0.7,
    maxTokens: 4096,
  });

  const result = JSON.parse(response);
  
  // Validate and ensure proper structure
  return {
    arguments: result.arguments || [],
    judgment: {
      coherenceScore: result.judgment?.coherenceScore ?? 0.5,
      reasoningType: result.judgment?.reasoningType ?? "Unknown",
      logicalSoundness: result.judgment?.logicalSoundness ?? "Unable to assess",
      conceptualCompleteness: result.judgment?.conceptualCompleteness ?? "Unable to assess",
      issues: result.judgment?.issues || [],
    },
    rewrittenText: result.rewrittenText || text,
    overallCoherence: result.overallCoherence ?? result.judgment?.coherenceScore ?? 0.5,
    metaJudgment: result.metaJudgment,
  };
}

// ==================== JUSTIFICATION BUILDER MODULE ====================

export async function processJustificationBuilder(
  text: string
): Promise<JustificationBuilderResult> {
  const response = await getAICompletion({
    systemPrompt: JUSTIFICATION_BUILDER_SYSTEM_PROMPT,
    userPrompt: JUSTIFICATION_BUILDER_USER_PROMPT(text),
    temperature: 0.7,
    maxTokens: 4096,
  });

  const result = JSON.parse(response);
  
  return {
    detectedClaims: result.detectedClaims || [],
    justificationChains: result.justificationChains || [],
    coherenceScore: result.coherenceScore ?? 0.5,
    completeness: result.completeness || "Unable to assess",
    weaknesses: result.weaknesses || [],
    rewrittenText: result.rewrittenText || text,
  };
}

// ==================== KNOWLEDGE-TO-UTILITY MAPPER MODULE ====================

export async function processKnowledgeUtility(
  text: string
): Promise<KnowledgeUtilityResult> {
  const response = await getAICompletion({
    systemPrompt: KNOWLEDGE_UTILITY_SYSTEM_PROMPT,
    userPrompt: KNOWLEDGE_UTILITY_USER_PROMPT(text),
    temperature: 0.7,
    maxTokens: 4096,
  });

  const result = JSON.parse(response);
  
  return {
    operativeKnowledge: result.operativeKnowledge || [],
    utilityMappings: result.utilityMappings || [],
    utilityAugmentedRewrite: result.utilityAugmentedRewrite || text,
    judgmentReport: {
      breadth: result.judgmentReport?.breadth || "Unable to assess",
      depth: result.judgmentReport?.depth || "Unable to assess",
      limitations: result.judgmentReport?.limitations || [],
      transformativePotential: result.judgmentReport?.transformativePotential || "Unable to assess",
    },
    utilityRank: result.utilityRank ?? 5,
  };
}
