# Epistemic Reasoning Engine

## Overview

The Epistemic Reasoning Engine is a specialized web application for analyzing philosophical and scientific argumentative text using AI-powered epistemic analysis. The application provides five distinct analytical modules:

1. **Epistemic Inference Module** - Analyzes justificatory structure, judges logical coherence, and rewrites text with explicit inferential steps
2. **Justification Builder Module** - Identifies underdeveloped claims and reconstructs missing justificatory chains
3. **Knowledge-to-Utility Mapper** - Extracts and maps the practical utility of knowledge claims
4. **Cognitive Integrity Layer** - Detects authentic reasoning vs simulation and provides 8 quantitative diagnostic metrics (RealityAnchor, CausalDepth, Friction, Compression, SimulationIndex, LevelCoherence, CompositeScore, IntegrityType)
5. **Cognitive Continuity Layer** - Maintains truth coherence across epistemic corpus by detecting contradictions, generating coherence maps, and producing continuity-aligned rewrites with 6 diagnostic metrics (CrossPhaseCoherence, TemporalStability, ProgressiveIntegration, ErrorPropagationIndex, SystemicCompression, ContinuityComposite)

The system is designed for scholars, researchers, and students working with complex argumentative texts, providing professional-grade analysis with a focus on clarity, precision, and epistemic rigor.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript running on Vite build system

**UI Component Strategy**:
- **Design System**: shadcn/ui components with Radix UI primitives (New York style variant)
- **Styling**: Tailwind CSS with custom academic-focused design tokens
- **Typography**: Inter (UI/body), JetBrains Mono (code/technical), optional Merriweather (reading)
- **Layout Pattern**: Single-page application with module-based tabs, responsive container system (max-w-7xl for app, max-w-4xl for text content)
- **State Management**: TanStack Query (React Query) for server state, local React state for UI

**Design Philosophy**: Material Design / Academic Research Tool pattern prioritizing maximum readability, clear visual hierarchy, and minimal distractions. Content-first approach with information-dense layouts suitable for long-form philosophical text analysis.

**Key Frontend Components**:
- `ModuleSelector` - Tab-based module switching interface (5-tab layout with Shield icon for Cognitive Integrity and GitBranch icon for Cognitive Continuity)
- `TextInputArea` - Word-counted input with 10,000-word limit validation (automatic chunking for texts >2,000 words)
  - **File Upload** - Users can upload .txt and .md files (max 5MB) via "Upload File" button next to input label
- Module-specific result components (`EpistemicInferenceResults`, `JustificationBuilderResults`, `KnowledgeUtilityResults`, `CognitiveIntegrityResults`, `CognitiveContinuityResults`)
- `CoherenceScore` - Visual progress indicator for epistemic metrics
- **TXT Export** - Each module includes a download button that exports complete analysis results as formatted plain text files
- **History Page** - Complete analysis history dashboard with filtering, sorting, viewing, downloading, and deletion capabilities

### Backend Architecture

**Framework**: Express.js with TypeScript on Node.js

**Request Processing Flow**:
1. Input validation using Zod schemas (10,000-word limit enforcement)
2. Argument detection pre-processing (filters non-argumentative text)
3. Automatic text chunking for inputs >2,000 words (paragraph-aware segmentation)
4. Module-specific AI processing via provider abstraction
5. Result synthesis for chunked analyses
6. Database persistence of analysis results
7. Structured JSON response with typed schemas

**Module Processing Functions** (`server/processing.ts`):
- `detectArgument()` - Pre-filters text to ensure argumentative content exists
- `segmentText()` - Intelligently splits text by paragraphs (with sentence fallback) for chunking
- `processEpistemicInference()` - Three-layer analysis (structure → judgment → rewrite) with automatic chunking
- `processJustificationBuilder()` - Gap analysis and chain reconstruction with automatic chunking
- `processKnowledgeUtility()` - Utility classification and ranking with automatic chunking
- `processCognitiveIntegrity()` - Three-pass authenticity analysis (detection → reconstruction → scoring) with automatic chunking and metric synthesis
- `processCognitiveContinuity()` - Three-pass coherence analysis (mapping → diagnostics → rewrite) with automatic chunking and conflict detection
- Result synthesis utilities for aggregating multi-chunk analyses

**Prompt Engineering Strategy**: Each module has dedicated system/user prompt templates in `server/epistemic-prompts.ts` with explicit JSON schema instructions for AI responses. Prompts enforce structured output matching shared TypeScript schemas.

### AI Integration Architecture

**Three-Tier Provider Strategy** with automatic cascading fallback:
- **Primary Provider**: Anthropic Claude (via Replit AI Integrations - `@anthropic-ai/sdk`)
- **Secondary Fallback**: OpenAI GPT-4o (via `openai` SDK)
- **Tertiary Fallback**: DeepSeek (via OpenAI-compatible API)
- **Failover Logic**: Automatic sequential fallback (Anthropic → OpenAI → DeepSeek) if providers fail

**Rationale**: Ensures maximum uptime and reliability. DeepSeek provides cost-effective backup (1/10th OpenAI pricing) while maintaining quality for complex epistemic reasoning tasks.

**Configuration**: API keys via environment variables:
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` + `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` (Replit AI Integrations)
- `OPENAI_API_KEY` (OpenAI)
- `DEEPSEEK_API_KEY` (DeepSeek - optional)

### Authentication & Session Management

**No-Barrier Authentication Strategy**: Completely optional inline username input
- **Zero Barriers**: Users access the main page immediately with full functionality (no login page, no dialog, no redirect)
- **Optional Username**: Small inline username input in page header (w-40 width) - only needed for saving analyses to history
- **Anonymous Usage**: All analysis features work without authentication - results saved with `userId: null`
- **Session Persistence**: Username-only login (case-insensitive) - finds existing user or creates new user automatically
- **Smooth Transition**: Username input replaced with username display after login, persists across page loads

**Session Configuration**:
- **Session Store**: PostgreSQL via `connect-pg-simple` (session table auto-created)
- **Session Security**: 
  - Requires `SESSION_SECRET` environment variable (minimum 32 characters recommended)
  - Server crashes on startup if `SESSION_SECRET` is missing (prevents session forgery)
  - HTTP-only cookies (prevents XSS attacks)
  - Secure cookies in production (HTTPS-only)
  - 30-day session expiration
- **Session Data**: Stores `userId` and `username` for authenticated users

**Route Access**:
- No route protection - all pages accessible without authentication
- History page shows user-specific analyses when logged in, empty when not
- Analysis functionality works for both authenticated and anonymous users

**API Endpoints**:
- `POST /api/login` - Username-only login (finds or creates user)
- `GET /api/me` - Returns current authenticated user from session (used to display username in header)

### Data Storage Architecture

**Active Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Users**: PostgreSQL storage with indexed username lookup
  - Table: `users` with columns: id (UUID), username (unique), passwordHash (nullable), createdAt
  - Username-only authentication (passwordHash always NULL for current implementation)
  - Case-insensitive username matching
- **Analysis History**: PostgreSQL database persistence for all completed analyses
  - Table: `analysis_history` with columns: id (UUID), userId, moduleType, inputText, wordCount (integer), result (JSONB), processingTime (integer), createdAt
  - Indexes on userId, moduleType, and createdAt for efficient querying
  - Full CRUD operations: saveAnalysis, getAnalysisHistory, getAnalysisById, deleteAnalysis
  - Automatic saving after each successful analysis
  - User-specific filtering: All queries filter by `req.session.userId`

**API Endpoints**:
- `POST /api/analyze` - Processes text and automatically saves results to database (works with or without authentication)
- `GET /api/history` - Retrieves analysis history for authenticated user
- `GET /api/history/:id` - Retrieves specific analysis by ID
- `DELETE /api/history/:id` - Deletes analysis from database

**Database Tools**: Migration system using `drizzle-kit` with `npm run db:push` for schema updates

### Schema & Type System

**Shared Type Definitions** (`shared/schema.ts`):
- Zod schemas define runtime validation and TypeScript types
- Module types: `epistemic-inference`, `justification-builder`, `knowledge-utility-mapper`, `cognitive-integrity`
- Structured result schemas for each module with nested objects (arguments, judgments, utilities, diagnostic metrics)
- Request/response schemas with strict validation

**Type Safety**: Full end-to-end type safety from client → server → AI response parsing using shared schema definitions

### Session & Authentication

**Session Management**: Express sessions with PostgreSQL backing (via `connect-pg-simple`)
- Configured but currently minimal - user creation/lookup implemented
- Authentication layer prepared for future expansion

## External Dependencies

### AI Services
- **Anthropic Claude API** (via Replit AI Integrations) - Primary reasoning engine for epistemic analysis
- **OpenAI GPT-4o API** - Secondary fallback reasoning engine
- **DeepSeek API** - Tertiary fallback reasoning engine (cost-effective backup)

### Database & Storage
- **Neon Serverless PostgreSQL** - Prepared database infrastructure (configured but analysis storage not yet active)
- **Drizzle ORM** - Type-safe database access and schema management

### UI Component Library
- **Radix UI Primitives** - Accessible, unstyled component primitives (Accordion, Dialog, Dropdown, Popover, Tabs, Toast, etc.)
- **shadcn/ui** - Pre-styled Radix components with Tailwind integration
- **Tailwind CSS** - Utility-first styling framework with custom academic design tokens

### Development & Build Tools
- **Vite** - Frontend build tool with HMR, React plugin, and Replit-specific plugins
- **TypeScript** - Type system across full stack
- **TanStack Query** - Server state management and caching
- **Wouter** - Lightweight client-side routing

### Fonts
- **Google Fonts** - Inter, JetBrains Mono, Merriweather (preconnected in HTML)

### Utility Libraries
- **class-variance-authority** - Component variant management
- **clsx** + **tailwind-merge** - Conditional className composition
- **date-fns** - Date manipulation
- **zod** - Runtime schema validation
- **nanoid** - ID generation