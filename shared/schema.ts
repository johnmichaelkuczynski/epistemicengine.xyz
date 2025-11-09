import { z } from "zod";

// ==================== ANALYSIS TYPES ====================

export const moduleTypeSchema = z.enum([
  "epistemic-inference",
  "justification-builder", 
  "knowledge-utility-mapper"
]);

export type ModuleType = z.infer<typeof moduleTypeSchema>;

// ==================== EPISTEMIC INFERENCE MODULE ====================

export const argumentSchema = z.object({
  id: z.string(),
  coreClaim: z.string(),
  explicitPremises: z.array(z.string()),
  hiddenPremises: z.array(z.string()),
  inferenceType: z.enum(["deductive", "inductive", "analogical", "analytic", "causal", "definitional", "probabilistic"]),
});

export type Argument = z.infer<typeof argumentSchema>;

export const judgmentSchema = z.object({
  coherenceScore: z.number().min(0).max(1),
  reasoningType: z.string(),
  logicalSoundness: z.string(),
  conceptualCompleteness: z.string(),
  issues: z.array(z.string()),
});

export type Judgment = z.infer<typeof judgmentSchema>;

export const epistemicInferenceResultSchema = z.object({
  arguments: z.array(argumentSchema),
  judgment: judgmentSchema,
  rewrittenText: z.string(),
  overallCoherence: z.number().min(0).max(1),
  metaJudgment: z.string().optional(),
});

export type EpistemicInferenceResult = z.infer<typeof epistemicInferenceResultSchema>;

// ==================== JUSTIFICATION BUILDER MODULE ====================

export const claimSchema = z.object({
  claim: z.string(),
  isUnderdeveloped: z.boolean(),
});

export type Claim = z.infer<typeof claimSchema>;

export const justificationChainSchema = z.object({
  claim: z.string(),
  premises: z.array(z.string()),
  conclusion: z.string(),
  evidenceType: z.enum(["empirical", "conceptual", "definitional"]),
});

export type JustificationChain = z.infer<typeof justificationChainSchema>;

export const justificationBuilderResultSchema = z.object({
  detectedClaims: z.array(claimSchema),
  justificationChains: z.array(justificationChainSchema),
  coherenceScore: z.number().min(0).max(1),
  completeness: z.string(),
  weaknesses: z.array(z.string()),
  rewrittenText: z.string(),
});

export type JustificationBuilderResult = z.infer<typeof justificationBuilderResultSchema>;

// ==================== KNOWLEDGE-TO-UTILITY MAPPER MODULE ====================

export const utilityTypeSchema = z.enum([
  "explanatory",
  "predictive", 
  "prescriptive",
  "methodological",
  "philosophical-epistemic"
]);

export type UtilityType = z.infer<typeof utilityTypeSchema>;

export const utilityMappingSchema = z.object({
  type: utilityTypeSchema,
  derivedUtility: z.string(),
  description: z.string(),
});

export type UtilityMapping = z.infer<typeof utilityMappingSchema>;

export const knowledgeUtilityResultSchema = z.object({
  operativeKnowledge: z.array(z.string()),
  utilityMappings: z.array(utilityMappingSchema),
  utilityAugmentedRewrite: z.string(),
  judgmentReport: z.object({
    breadth: z.string(),
    depth: z.string(),
    limitations: z.array(z.string()),
    transformativePotential: z.string(),
  }),
  utilityRank: z.number().min(0).max(10),
});

export type KnowledgeUtilityResult = z.infer<typeof knowledgeUtilityResultSchema>;

// ==================== API REQUEST/RESPONSE SCHEMAS ====================

export const analyzeRequestSchema = z.object({
  text: z.string().min(1, "Text cannot be empty").max(50000, "Text too long"),
  moduleType: moduleTypeSchema,
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const analyzeResponseSchema = z.object({
  success: z.boolean(),
  wordCount: z.number(),
  isArgumentative: z.boolean(),
  diagnosticMessage: z.string().optional(),
  result: z.union([
    epistemicInferenceResultSchema,
    justificationBuilderResultSchema,
    knowledgeUtilityResultSchema,
  ]).optional(),
  processingTime: z.number().optional(),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

// ==================== ERROR RESPONSE ====================

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.enum(["VALIDATION_ERROR", "PROCESSING_ERROR", "AI_ERROR", "NO_ARGUMENT", "OVERLENGTH"]),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
