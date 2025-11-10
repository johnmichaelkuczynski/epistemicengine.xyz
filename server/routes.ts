import type { Express, Request, Response } from "express";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";
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

const PgSession = connectPgSimple(session);

export function registerRoutes(app: Express) {
  const server = createServer(app);
  
  // Require SESSION_SECRET in environment
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable is required for secure session management. " +
      "Please set a strong random secret (minimum 32 characters)."
    );
  }
  
  // Configure session middleware
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );
  
  // ==================== API KEY AUTHENTICATION ====================
  // Middleware to check for internal API key (x-zhi-key header)
  // If valid, grants full access without requiring login
  // Internal requests use a dedicated "internal-api" user for data isolation
  app.use(async (req, res, next) => {
    try {
      const apiKey = req.headers['x-zhi-key'] as string | undefined;
      const zhiPrivateKey = process.env.ZHI_PRIVATE_KEY;
      
      if (apiKey && zhiPrivateKey && apiKey === zhiPrivateKey) {
        req.isInternal = true;
        
        // Find or create dedicated internal user
        let internalUser = await storage.getUserByUsername('internal-api');
        if (!internalUser) {
          internalUser = await storage.createUser({
            username: 'internal-api',
            passwordHash: null,
          });
          console.log(`[API Key Auth] Created internal-api user: ${internalUser.id}`);
        }
        
        // Store internal user ID in session for this request
        req.session.userId = internalUser.id;
        req.session.username = internalUser.username;
        
        console.log(`[API Key Auth] Internal request authenticated via x-zhi-key header, userId: ${internalUser.id}`);
      }
      
      next();
    } catch (error) {
      console.error('[API Key Auth] Failed to authenticate internal request:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal authentication failed',
      });
    }
  });
  
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
      
      console.log(`[/api/login] User logged in: ${user.username} (ID: ${user.id}), Session ID: ${req.sessionID}`);
      
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
    // Internal API key access
    if (req.isInternal) {
      return res.json({
        success: true,
        user: {
          id: "internal",
          username: "internal-api",
          isInternal: true,
        },
      });
    }
    
    // Normal session-based user
    if (req.session.userId) {
      return res.json({
        success: true,
        user: {
          id: req.session.userId,
          username: req.session.username,
          isInternal: false,
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

      // Save to database (associated with logged-in user or null for anonymous)
      // Internal API requests save with dedicated "internal-api" user ID
      // Anonymous requests save with userId: null
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
      console.log(`[/api/history] Session userId: ${userId}, Session ID: ${req.sessionID}`);
      const history = await storage.getAnalysisHistory(userId, limit);
      console.log(`[/api/history] Retrieved ${history.length} records for userId: ${userId}`);
      
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
