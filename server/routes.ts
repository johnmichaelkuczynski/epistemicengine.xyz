import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { analyzeRequestSchema } from "@shared/schema";
import {
  countWords,
  detectArgument,
  processEpistemicInference,
  processJustificationBuilder,
  processKnowledgeUtility,
} from "./processing";

export function registerRoutes(app: Express) {
  const server = createServer(app);
  app.post("/api/analyze", async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      // Validate request
      const validationResult = analyzeRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request format",
          code: "VALIDATION_ERROR",
        });
      }

      const { text, moduleType } = validationResult.data;
      const wordCount = countWords(text);

      // Check word limit
      if (wordCount > 2000) {
        return res.status(400).json({
          success: false,
          wordCount,
          error: "Text exceeds 2,000-word limit",
          code: "OVERLENGTH",
          diagnosticMessage: "Please reduce the input to 2,000 words or less.",
        });
      }

      // Detect if text is argumentative
      const argumentDetection = await detectArgument(text);
      
      // Only reject if we're very confident it's NOT argumentative (threshold: 0.85)
      if (!argumentDetection.isArgumentative && argumentDetection.confidence > 0.85) {
        return res.json({
          success: false,
          wordCount,
          isArgumentative: false,
          diagnosticMessage: argumentDetection.reasoning || "No inferential content detected. The passage appears to be descriptive, narrative, or rhetorical rather than argumentative.",
        });
      }

      // Process based on module type
      let result;
      
      switch (moduleType) {
        case "epistemic-inference":
          result = await processEpistemicInference(text);
          break;
        
        case "justification-builder":
          result = await processJustificationBuilder(text);
          break;
        
        case "knowledge-utility-mapper":
          result = await processKnowledgeUtility(text);
          break;
        
        default:
          return res.status(400).json({
            success: false,
            error: "Invalid module type",
            code: "VALIDATION_ERROR",
          });
      }

      const processingTime = Date.now() - startTime;

      // Explicitly set isArgumentative to true since we processed it
      const response = {
        success: true,
        wordCount,
        isArgumentative: true,
        result,
        processingTime,
      };
      
      return res.json(response);

    } catch (error) {
      console.error("Analysis error:", error);
      
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        code: "PROCESSING_ERROR",
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
      }
    });
  });

  return server;
}
