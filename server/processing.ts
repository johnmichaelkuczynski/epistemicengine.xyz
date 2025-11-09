import { getAICompletion } from "./ai-service";
import {
  EPISTEMIC_INFERENCE_SYSTEM_PROMPT,
  EPISTEMIC_INFERENCE_USER_PROMPT,
  JUSTIFICATION_BUILDER_SYSTEM_PROMPT,
  JUSTIFICATION_BUILDER_USER_PROMPT,
  KNOWLEDGE_UTILITY_SYSTEM_PROMPT,
  KNOWLEDGE_UTILITY_USER_PROMPT,
  COGNITIVE_INTEGRITY_SYSTEM_PROMPT,
  COGNITIVE_INTEGRITY_USER_PROMPT,
  ARGUMENT_DETECTION_SYSTEM_PROMPT,
  ARGUMENT_DETECTION_USER_PROMPT,
} from "./epistemic-prompts";
import type {
  EpistemicInferenceResult,
  JustificationBuilderResult,
  KnowledgeUtilityResult,
  CognitiveIntegrityResult,
  CognitiveContinuityResult,
} from "@shared/schema";
import { storage } from "./storage";

// ==================== UTILITIES ====================

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function segmentText(text: string, maxWords: number = 2000): string[] {
  const totalWords = countWords(text);
  if (totalWords <= maxWords) {
    return [text];
  }

  console.log(`Text exceeds ${maxWords} words (${totalWords} total). Chunking into segments...`);

  const segments: string[] = [];
  // Split by paragraphs first (double newlines or single newlines)
  const paragraphs = text.split(/\n\n+|\n/).filter(p => p.trim().length > 0);
  
  let currentSegment: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    
    // If a single paragraph exceeds max, split it by sentences
    if (paragraphWords > maxWords) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment.join('\n\n'));
        currentSegment = [];
        currentWordCount = 0;
      }
      
      // Split large paragraph by sentences
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let sentenceBuffer: string[] = [];
      let sentenceWordCount = 0;
      
      for (const sentence of sentences) {
        const sentenceWords = countWords(sentence);
        if (sentenceWordCount + sentenceWords > maxWords && sentenceBuffer.length > 0) {
          segments.push(sentenceBuffer.join('. ') + '.');
          sentenceBuffer = [sentence.trim()];
          sentenceWordCount = sentenceWords;
        } else {
          sentenceBuffer.push(sentence.trim());
          sentenceWordCount += sentenceWords;
        }
      }
      
      if (sentenceBuffer.length > 0) {
        segments.push(sentenceBuffer.join('. ') + '.');
      }
      continue;
    }
    
    // Check if adding this paragraph would exceed the limit
    if (currentWordCount + paragraphWords > maxWords && currentSegment.length > 0) {
      segments.push(currentSegment.join('\n\n'));
      currentSegment = [paragraph.trim()];
      currentWordCount = paragraphWords;
    } else {
      currentSegment.push(paragraph.trim());
      currentWordCount += paragraphWords;
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment.join('\n\n'));
  }

  console.log(`Created ${segments.length} segments from ${totalWords} words`);
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

async function processEpistemicInferenceChunk(
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

export async function processEpistemicInference(
  text: string
): Promise<EpistemicInferenceResult> {
  const chunks = segmentText(text, 2000);
  
  if (chunks.length === 1) {
    return processEpistemicInferenceChunk(text);
  }
  
  console.log(`Processing ${chunks.length} chunks for epistemic inference`);
  
  // Process each chunk
  const chunkResults: EpistemicInferenceResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    const result = await processEpistemicInferenceChunk(chunks[i]);
    chunkResults.push(result);
  }
  
  // Synthesize results
  const allArguments = chunkResults.flatMap(r => r.arguments);
  const avgCoherence = chunkResults.reduce((sum, r) => sum + r.overallCoherence, 0) / chunkResults.length;
  const allIssues = chunkResults.flatMap(r => r.judgment.issues);
  
  const synthesizedRewrite = chunkResults.map(r => r.rewrittenText).join('\n\n');
  
  return {
    arguments: allArguments,
    judgment: {
      coherenceScore: avgCoherence,
      reasoningType: chunkResults[0].judgment.reasoningType,
      logicalSoundness: `Synthesized from ${chunks.length} chunks. Overall: ${avgCoherence > 0.7 ? 'Sound' : avgCoherence > 0.5 ? 'Moderate' : 'Weak'}`,
      conceptualCompleteness: `Analysis across ${chunks.length} text segments`,
      issues: allIssues,
    },
    rewrittenText: synthesizedRewrite,
    overallCoherence: avgCoherence,
    metaJudgment: `This analysis synthesizes results from ${chunks.length} text chunks (${countWords(text)} words total). Individual chunk coherence scores averaged to produce the overall assessment.`,
  };
}

// ==================== JUSTIFICATION BUILDER MODULE ====================

async function processJustificationBuilderChunk(
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

export async function processJustificationBuilder(
  text: string
): Promise<JustificationBuilderResult> {
  const chunks = segmentText(text, 2000);
  
  if (chunks.length === 1) {
    return processJustificationBuilderChunk(text);
  }
  
  console.log(`Processing ${chunks.length} chunks for justification builder`);
  
  const chunkResults: JustificationBuilderResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    const result = await processJustificationBuilderChunk(chunks[i]);
    chunkResults.push(result);
  }
  
  const allClaims = chunkResults.flatMap(r => r.detectedClaims);
  const allChains = chunkResults.flatMap(r => r.justificationChains);
  const allWeaknesses = chunkResults.flatMap(r => r.weaknesses);
  const avgCoherence = chunkResults.reduce((sum, r) => sum + r.coherenceScore, 0) / chunkResults.length;
  const synthesizedRewrite = chunkResults.map(r => r.rewrittenText).join('\n\n');
  
  return {
    detectedClaims: allClaims,
    justificationChains: allChains,
    coherenceScore: avgCoherence,
    completeness: `Analyzed across ${chunks.length} text segments. Overall assessment: ${avgCoherence > 0.7 ? 'Complete' : avgCoherence > 0.5 ? 'Moderately complete' : 'Incomplete'}`,
    weaknesses: allWeaknesses,
    rewrittenText: synthesizedRewrite,
  };
}

// ==================== KNOWLEDGE-TO-UTILITY MAPPER MODULE ====================

async function processKnowledgeUtilityChunk(
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

export async function processKnowledgeUtility(
  text: string
): Promise<KnowledgeUtilityResult> {
  const chunks = segmentText(text, 2000);
  
  if (chunks.length === 1) {
    return processKnowledgeUtilityChunk(text);
  }
  
  console.log(`Processing ${chunks.length} chunks for knowledge utility mapper`);
  
  const chunkResults: KnowledgeUtilityResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    const result = await processKnowledgeUtilityChunk(chunks[i]);
    chunkResults.push(result);
  }
  
  const allKnowledge = chunkResults.flatMap(r => r.operativeKnowledge);
  const allMappings = chunkResults.flatMap(r => r.utilityMappings);
  const allLimitations = chunkResults.flatMap(r => r.judgmentReport.limitations);
  const avgUtilityRank = chunkResults.reduce((sum, r) => sum + r.utilityRank, 0) / chunkResults.length;
  const synthesizedRewrite = chunkResults.map(r => r.utilityAugmentedRewrite).join('\n\n');
  
  return {
    operativeKnowledge: allKnowledge,
    utilityMappings: allMappings,
    utilityAugmentedRewrite: synthesizedRewrite,
    judgmentReport: {
      breadth: `Synthesized from ${chunks.length} text segments`,
      depth: chunkResults[0].judgmentReport.depth,
      limitations: allLimitations,
      transformativePotential: `Analysis across ${chunks.length} chunks reveals ${avgUtilityRank > 7 ? 'high' : avgUtilityRank > 5 ? 'moderate' : 'limited'} transformative potential`,
    },
    utilityRank: avgUtilityRank,
  };
}

// ==================== COGNITIVE INTEGRITY LAYER MODULE ====================

async function processCognitiveIntegrityChunk(
  text: string
): Promise<CognitiveIntegrityResult> {
  const response = await getAICompletion({
    systemPrompt: COGNITIVE_INTEGRITY_SYSTEM_PROMPT,
    userPrompt: COGNITIVE_INTEGRITY_USER_PROMPT(text),
    temperature: 0.7,
    maxTokens: 4096,
  });

  const result = JSON.parse(response);
  
  return {
    authenticity_commentary: result.authenticity_commentary || "Unable to assess authenticity",
    reconstructed_passage: result.reconstructed_passage || text,
    diagnostic_block: {
      RealityAnchor: result.diagnostic_block?.RealityAnchor ?? 0.5,
      CausalDepth: result.diagnostic_block?.CausalDepth ?? 0.5,
      Friction: result.diagnostic_block?.Friction ?? 0.5,
      Compression: result.diagnostic_block?.Compression ?? 0.5,
      SimulationIndex: result.diagnostic_block?.SimulationIndex ?? 0.5,
      LevelCoherence: result.diagnostic_block?.LevelCoherence ?? 0.5,
      CompositeScore: result.diagnostic_block?.CompositeScore ?? 0.5,
      IntegrityType: result.diagnostic_block?.IntegrityType || "Unknown",
    },
    interpretation_summary: result.interpretation_summary || "Unable to provide interpretation",
  };
}

export async function processCognitiveIntegrity(
  text: string
): Promise<CognitiveIntegrityResult> {
  const chunks = segmentText(text, 2000);
  
  if (chunks.length === 1) {
    return processCognitiveIntegrityChunk(text);
  }
  
  console.log(`Processing ${chunks.length} chunks for cognitive integrity analysis`);
  
  const chunkResults: CognitiveIntegrityResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    const result = await processCognitiveIntegrityChunk(chunks[i]);
    chunkResults.push(result);
  }
  
  // Synthesize results from multiple chunks
  // Aggregate commentary, stitch passages, average metrics
  const allCommentaries = chunkResults.map((r, i) => `Chunk ${i + 1}: ${r.authenticity_commentary}`).join(' ');
  const synthesizedPassage = chunkResults.map(r => r.reconstructed_passage).join('\n\n');
  
  // Average all numeric metrics
  const avgRealityAnchor = chunkResults.reduce((sum, r) => sum + r.diagnostic_block.RealityAnchor, 0) / chunkResults.length;
  const avgCausalDepth = chunkResults.reduce((sum, r) => sum + r.diagnostic_block.CausalDepth, 0) / chunkResults.length;
  const avgFriction = chunkResults.reduce((sum, r) => sum + r.diagnostic_block.Friction, 0) / chunkResults.length;
  const avgCompression = chunkResults.reduce((sum, r) => sum + r.diagnostic_block.Compression, 0) / chunkResults.length;
  const avgSimulationIndex = chunkResults.reduce((sum, r) => sum + r.diagnostic_block.SimulationIndex, 0) / chunkResults.length;
  const avgLevelCoherence = chunkResults.reduce((sum, r) => sum + r.diagnostic_block.LevelCoherence, 0) / chunkResults.length;
  const avgCompositeScore = chunkResults.reduce((sum, r) => sum + r.diagnostic_block.CompositeScore, 0) / chunkResults.length;
  
  // Classify IntegrityType based on composite score range
  let integrityType = "Multi-Chunk Analysis";
  if (avgCompositeScore >= 0.80) {
    integrityType = "High-Integrity Source (Synthesized)";
  } else if (avgCompositeScore >= 0.50) {
    integrityType = "Authentic Partial (Synthesized)";
  } else {
    integrityType = "Requires Conceptual Reconstruction (Synthesized)";
  }
  
  const allInterpretations = chunkResults.map((r, i) => `Chunk ${i + 1}: ${r.interpretation_summary}`).join(' ');
  
  return {
    authenticity_commentary: `Synthesized analysis from ${chunks.length} text chunks (${countWords(text)} words total). ${allCommentaries}`,
    reconstructed_passage: synthesizedPassage,
    diagnostic_block: {
      RealityAnchor: avgRealityAnchor,
      CausalDepth: avgCausalDepth,
      Friction: avgFriction,
      Compression: avgCompression,
      SimulationIndex: avgSimulationIndex,
      LevelCoherence: avgLevelCoherence,
      CompositeScore: avgCompositeScore,
      IntegrityType: integrityType,
    },
    interpretation_summary: `Multi-chunk synthesis: ${allInterpretations}`,
  };
}

// ==================== COGNITIVE CONTINUITY LAYER ====================

export async function processCognitiveContinuity(
  text: string,
  referenceIds: string[] = [],
  alignRewrite: boolean = false
): Promise<CognitiveContinuityResult> {
  // Minimal stub - proper implementation coming
  return {
    target: "New Text",
    referenceSet: [],
    compositeScore: 0.5,
    pairwise: {},
    alignmentSummary: ["Implementation in progress"],
    continuityRewrite: alignRewrite ? "Rewrite feature coming soon" : undefined,
  };
}
