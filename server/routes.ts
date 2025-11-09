import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { analyzeRequestSchema, updateDoctrineRequestSchema } from "@shared/schema";
import {
  countWords,
  detectArgument,
  processEpistemicInference,
  processJustificationBuilder,
  processKnowledgeUtility,
  processCognitiveIntegrity,
  processCognitiveContinuity,
} from "./processing";
import { storage } from "./storage";

export function registerRoutes(app: Express) {
  const server = createServer(app);
  
  // ==================== AUTH ROUTES ====================
  
  // Username-only login (no password required)
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Username is required",
        });
      }
      
      const normalizedUsername = username.toLowerCase().trim();
      
      // Find or create user
      let user = await storage.getUserByUsername(normalizedUsername);
      
      if (!user) {
        // Create new user with username-only (no password)
        user = await storage.createUser({
          username: normalizedUsername,
          passwordHash: null,
        });
        console.log(`Created new user: ${normalizedUsername}`);
      }
      
      // Store user in session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        error: "Login failed",
      });
    }
  });
  
  // Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
  
  // Get current user
  app.get("/api/me", (req: Request, res: Response) => {
    if (req.session.userId) {
      return res.json({
        success: true,
        user: {
          id: req.session.userId,
          username: req.session.username,
        },
      });
    }
    
    return res.json({
      success: false,
      user: null,
    });
  });
  
  // ==================== ANALYSIS ROUTES ====================
  
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

      const { text, moduleType, referenceIds = [], alignRewrite = false } = validationResult.data;
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
        
        case "cognitive-integrity":
          result = await processCognitiveIntegrity(text);
          break;
        
        case "cognitive-continuity":
          result = await processCognitiveContinuity(text, referenceIds, alignRewrite);
          break;
        
        default:
          return res.status(400).json({
            success: false,
            error: "Invalid module type",
            code: "VALIDATION_ERROR",
          });
      }

      const processingTime = Date.now() - startTime;

      // Save to database (associated with logged-in user)
      try {
        await storage.saveAnalysis({
          userId: req.session.userId || null,
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
      // Filter by logged-in user
      const userId = req.session.userId;
      const history = await storage.getAnalysisHistory(userId, limit);
      
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

  // Doctrine endpoints
  app.get("/api/doctrines", async (req: Request, res: Response) => {
    try {
      const doctrines = await storage.getAllDoctrines();
      
      return res.json({
        success: true,
        doctrines,
      });
    } catch (error) {
      console.error("Failed to fetch doctrines:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch doctrines",
      });
    }
  });

  app.put("/api/doctrines/:key", async (req: Request, res: Response) => {
    try {
      const validationResult = updateDoctrineRequestSchema.safeParse({
        key: req.params.key,
        ...req.body,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request format",
        });
      }

      const { key, value, description } = validationResult.data;
      await storage.setDoctrine(key, value, description);
      
      return res.json({
        success: true,
      });
    } catch (error) {
      console.error("Failed to update doctrine:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update doctrine",
      });
    }
  });

  app.post("/api/doctrines/initialize", async (req: Request, res: Response) => {
    try {
      await storage.initializeDefaultDoctrines();
      
      return res.json({
        success: true,
      });
    } catch (error) {
      console.error("Failed to initialize doctrines:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to initialize doctrines",
      });
    }
  });

  // Stored texts endpoints
  app.get("/api/stored-texts", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const texts = await storage.getStoredTexts(undefined, limit);
      
      return res.json({
        success: true,
        texts,
      });
    } catch (error) {
      console.error("Failed to fetch stored texts:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch stored texts",
      });
    }
  });

  app.delete("/api/stored-texts/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteStoredText(req.params.id);
      
      return res.json({
        success: true,
      });
    } catch (error) {
      console.error("Failed to delete stored text:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete stored text",
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
