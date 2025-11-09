import { z } from "zod";
import { pgTable, uuid, text, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// ==================== DATABASE TABLES ====================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analysisHistory = pgTable("analysis_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  moduleType: text("module_type").notNull(),
  inputText: text("input_text").notNull(),
  wordCount: integer("word_count").notNull(),
  result: jsonb("result").notNull(),
  processingTime: integer("processing_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  moduleTypeIdx: index("module_type_idx").on(table.moduleType),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export const doctrines = pgTable("doctrines", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const storedTexts = pgTable("stored_texts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  title: text("title").notNull(),
  text: text("text").notNull(),
  wordCount: integer("word_count").notNull(),
  moduleType: text("module_type"),
  tags: text("tags").array(),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("stored_texts_user_id_idx").on(table.userId),
  createdAtIdx: index("stored_texts_created_at_idx").on(table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type AnalysisHistoryRecord = typeof analysisHistory.$inferSelect;
export type InsertAnalysisHistory = typeof analysisHistory.$inferInsert;

export type DoctrineRecord = typeof doctrines.$inferSelect;
export type InsertDoctrine = typeof doctrines.$inferInsert;

export type StoredText = typeof storedTexts.$inferSelect;
export type InsertStoredText = typeof storedTexts.$inferInsert;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAnalysisHistorySchema = createInsertSchema(analysisHistory).omit({ id: true, createdAt: true });

// ==================== DOCTRINE MANAGEMENT ====================

export const doctrineEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

export type DoctrineEntry = z.infer<typeof doctrineEntrySchema>;

export const doctrineStoreSchema = z.record(z.string());

export type DoctrineStore = z.infer<typeof doctrineStoreSchema>;

export const updateDoctrineRequestSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

export type UpdateDoctrineRequest = z.infer<typeof updateDoctrineRequestSchema>;

// ==================== ANALYSIS TYPES ====================

export const moduleTypeSchema = z.enum([
  "epistemic-inference",
  "justification-builder", 
  "knowledge-utility-mapper",
  "cognitive-integrity",
  "cognitive-continuity"
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

// ==================== COGNITIVE INTEGRITY LAYER MODULE ====================

export const diagnosticBlockSchema = z.object({
  RealityAnchor: z.number().min(0).max(1),
  CausalDepth: z.number().min(0).max(1),
  Friction: z.number().min(0).max(1),
  Compression: z.number().min(0).max(1),
  SimulationIndex: z.number().min(0).max(1),
  LevelCoherence: z.number().min(0).max(1),
  CompositeScore: z.number().min(0).max(1),
  IntegrityType: z.string(),
});

export type DiagnosticBlock = z.infer<typeof diagnosticBlockSchema>;

export const cognitiveIntegrityResultSchema = z.object({
  authenticity_commentary: z.string(),
  reconstructed_passage: z.string(),
  diagnostic_block: diagnosticBlockSchema,
  interpretation_summary: z.string(),
});

export type CognitiveIntegrityResult = z.infer<typeof cognitiveIntegrityResultSchema>;

// ==================== COGNITIVE CONTINUITY LAYER MODULE ====================

export const pairwiseScoreSchema = z.record(z.string(), z.number().min(0).max(1));

export type PairwiseScore = z.infer<typeof pairwiseScoreSchema>;

export const cognitiveContinuityResultSchema = z.object({
  target: z.string(),
  referenceSet: z.array(z.string()),
  compositeScore: z.number().min(0).max(1),
  pairwise: pairwiseScoreSchema,
  alignmentSummary: z.array(z.string()),
  continuityRewrite: z.string().optional(),
});

export type CognitiveContinuityResult = z.infer<typeof cognitiveContinuityResultSchema>;

// ==================== API REQUEST/RESPONSE SCHEMAS ====================

export const analyzeRequestSchema = z.object({
  text: z.string().min(1, "Text cannot be empty").max(50000, "Text too long"),
  moduleType: moduleTypeSchema,
  referenceIds: z.array(z.string()).optional(),
  alignRewrite: z.boolean().optional(),
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
    cognitiveIntegrityResultSchema,
    cognitiveContinuityResultSchema,
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
