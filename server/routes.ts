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
import { storage } from "./storage";

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

      // Check word limit (10,000 words with automatic chunking)
      if (wordCount > 10000) {
        return res.status(400).json({
          success: false,
          wordCount,
          error: "Text exceeds 10,000-word limit",
          code: "OVERLENGTH",
          diagnosticMessage: "Please reduce the input to 10,000 words or less.",
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

      // Save to database
      try {
        await storage.saveAnalysis({
          userId: null,
          moduleType,
          inputText: text,
          wordCount,
          result: result as any,
          processingTime,
        });
      } catch (dbError) {
        console.error("Failed to save analysis to database:", dbError);
      }

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

  // History endpoints
  app.get("/api/history", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getAnalysisHistory(undefined, limit);
      
      return res.json({
        success: true,
        history,
      });
    } catch (error) {
      console.error("Failed to fetch history:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch analysis history",
      });
    }
  });

  app.get("/api/history/:id", async (req: Request, res: Response) => {
    try {
      const analysis = await storage.getAnalysisById(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: "Analysis not found",
        });
      }
      
      return res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch analysis",
      });
    }
  });

  app.delete("/api/history/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteAnalysis(req.params.id);
      
      return res.json({
        success: true,
      });
    } catch (error) {
      console.error("Failed to delete analysis:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete analysis",
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
