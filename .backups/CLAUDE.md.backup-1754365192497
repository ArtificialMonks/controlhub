# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:md` - Run markdownlint on all markdown files
- `npm run lint:md:fix` - Auto-fix markdown formatting issues
- `npm run lint:all` - Run both ESLint and markdownlint
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:run` - Run all tests once
- `npm run test:coverage` - Run tests with coverage report

### Testing Strategy

The project uses:

- **Vitest** for unit testing with React integration
- **Testing Library** (@testing-library/react, @testing-library/jest-dom) for component testing
- **Playwright** for end-to-end testing
- Test files are located in `src/test/` directory and co-located with components
- Setup files: `src/test/setup.ts`
- Special considerations:
  - Performance tests are skipped by default (require live database)
  - Use `npm run test -- path/to/test.ts` for single test execution
  - Research Agent tests in `avarice-protocol/` are independent from main app

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest + Playwright

### Project Structure

#### Core Application (`/src`)

- **`app/`** - Next.js App Router structure
  - `(auth)/` - Authentication routes (login, signup)
  - `(dashboard)/` - Protected dashboard routes  
  - `api/` - API routes for webhooks, auth callbacks, user management
- **`components/`** - React components organized by feature
  - `auth/` - Login/signup forms
  - `dashboard/` - Dashboard-specific components
  - `ui/` - Reusable shadcn/ui components
- **`lib/`** - Utility libraries and configurations
  - `supabase/` - Database client configurations
  - `stores/` - Zustand state management
  - `actions/` - Server actions
  - `middleware/` - Custom middleware
  - `monitoring/` - Logging and production setup
  - `security/` - Encryption utilities

#### Database

- **Migration files**: `supabase/migrations/`
- **Profiles table**: Extends auth.users with additional user data
- **RLS policies**: Implemented for data security
- **Auto-triggers**: Handle profile creation and updates

#### Parallel Development Environment - A.V.A.R.I.C.E. Protocol

- **`avarice-protocol/`** - Advanced AI-driven development framework (excluded from main tsconfig)
- Contains Research Agent system with Level 3 intelligence capabilities
- Features specialized agents: Architect, Executor, Static Analyzer, Scribe, JOKER
- Includes comprehensive testing framework, memory management, and MCP integration
- Should be treated as independent from main application
- Has its own test suite and development lifecycle

### Key Design Patterns

#### Authentication Flow

- Magic link and password authentication via Supabase
- Middleware handles auth state and redirects
- Server-side data access through DAL (Data Access Layer)

#### Component Architecture

- shadcn/ui for consistent design system
- Dark/light mode support with CSS custom properties
- Responsive design with Tailwind
- Form validation with React Hook Form + Zod

#### API Design

- RESTful API routes in `app/api/` following Next.js 15 App Router conventions
- Webhook endpoints for n8n integration (`/api/webhooks/n8n/`)
- Server actions for form submissions (authentication, profile management)
- Key endpoints:
  - `/api/automations/` - CRUD operations for automation management
  - `/api/automations/[id]/run` - Execute specific automation
  - `/api/automations/bulk-action` - Bulk operations (run/stop multiple)
  - `/api/users/profile` - User profile management
  - `/api/auth/callback` - OAuth callback handling

## Key Business Context

This is the **Communitee Control Hub** - a management interface for n8n automation workflows.
The main goal is to provide non-technical users with a simple interface to monitor and control
their automation workflows without needing developer assistance.

### Core Features (from PRD)

- Secure user authentication and workspace management
- Data grid showing automations with status, client, last run data
- Real-time filtering by client name and automation status
- Individual and bulk run/stop controls for automations
- Two-way webhook integration with n8n for telemetry
- Light/dark mode with professional branding

### UI/UX Requirements

- **Light mode**: White background (#ffffff) with black text
- **Dark mode**: Deep navy gradient (#0a0b1f→#002bff) with white text  
- Two-column layout with collapsible sidebar
- Data-grid centric interface with direct manipulation
- Fully responsive design for all screen sizes
- WCAG 2.1 AA accessibility compliance

## Development Guidelines

### 🚨 CRITICAL PROHIBITIONS

#### **STRICTLY PROHIBITED TECHNOLOGIES**

- **JAVASCRIPT CREATION**: Strictly prohibited to create, code, and use JavaScript in any form
- **THEORETICAL FRAMEWORKS**: Creating testing frameworks, validation systems, or verification tools
  WITHOUT executing them is prohibited
- **PARTIAL COMPLETION**: "Mostly working," "good enough," or partial completion status is strictly prohibited
- **ASSUMPTION-BASED WORK**: Never speculate or make assumptions - verify every action, claim, and connection

### 📚 MANDATORY SOURCE DOCUMENTATION

#### **Required Reading Before Any Development Task**

Always fully understand and read these documents when starting a new agent window:

- **Official Documentation Root**: `/docs/source/`
- **Fullstack Architecture**: `/docs/source/PRD/chub-fullstack-architecture.md`
- **Product Requirements Document**: `/docs/source/PRD/chub-prd.md`
- **Project Brief**: `/docs/source/project-brief/chub-project-brief.md`
- **UI Specifications**: `/docs/source/ui-specs/chub-ui-specs.md`

### 🏗️ CODE QUALITY & ARCHITECTURE

#### **TypeScript Configuration Requirements**

- Fix TypeScript configuration issues
- Resolve JSX compilation problems
- Fix React type imports
- Configure proper build environment

#### **Code Creation Standards**

- **Simple, compilable components** with no complex dependencies
- **Actual executable functions** that work as intended
- **Proper integration** within application with correct import/export pathways
- **Enterprise-grade structure** following `/STRUCTURE.md` guidelines
- **Update STRUCTURE.md** when creating new folders/subfolders

#### **Key Development Principle**
>
> Connect what should be connected, isolate what should be isolated, and eliminate what serves no purpose.

### 📁 FILE ORGANIZATION

#### **Directory Structure**

- **Logs**: All logs stored within `/logs/` directory
- **Documentation**: All documentation stored within `/docs/` directory
- **Enterprise Structure**: Follow enterprise-grade structure explained in `/STRUCTURE.md`

#### **Zero Isolation Policy**

- **No orphaned modules**: All components must be properly connected
- **Integration requirement**: Ensure all new components are fully integrated and wired
- **Connection mandate**: Never delete references - create missing functionality instead
- **Pathway verification**: Connect correct import/export pathways, create optimized connections if missing

### Path Aliases

- Use `@/*` for imports from `src/` directory
- Example: `import { Button } from "@/components/ui/button"`

### Database Operations

- Always use the DAL (`src/lib/dal.ts`) for data access
- Follow RLS policies - users can only access their own data
- Use server-side rendering where possible for better performance

### State Management

- Use Zustand stores for client-side state
- Keep stores focused and feature-specific
- Server state should use React Server Components when possible

### Security Considerations

- All sensitive data encrypted at rest
- Webhook URLs and API keys must be secured
- Follow Supabase security best practices
- No hardcoded credentials in code

### Testing Requirements

- Write unit tests for utilities and business logic (Vitest)
- Component tests for UI components (React Testing Library)
- Integration tests for API routes and database operations
- E2E tests for critical user flows (Playwright)
- **LoginForm component**: Uses React Hook Form + Zod validation, test with server actions
- **Performance tests**: Require live Supabase instance, documented in `docs/testing/performance-tests.md`
- **Research Agent tests**: Independent testing in `avarice-protocol/` with specialized test framework

### ✅ QUALITY GATES

#### **File Creation Quality Gate**

Upon file creation, immediately run automated validation:

**TypeScript Files:**

- Syntax & type checking (strict TypeScript, no any/unknown)
- Linting & formatting (ESLint, Prettier)
- Fix all issues before proceeding - zero tolerance for quality debt

**Python Files:**

- Syntax & type checking (mypy strict mode, full type annotations)
- Linting & formatting (ruff/flake8, black)
- Code quality (no bare except, proper imports, docstrings)

**Markdown Files:**

- Markdown validation (links, headers, structure)
- Spell checking with zero errors tolerance
- A.V.A.R.I.C.E. Protocol compliance validation

#### **Testing & Bug Fixing Quality Gate**

1. After each test, if any issue, optimization, or enhancement is detected, make it your sole focus to fix immediately
2. Fix all possible issues before proceeding - zero tolerance for quality debt
3. Only proceed with every component error-free, every test 100% passed, every bug 100% solved

### 🔒 CRITICAL RULES (Zero Tolerance)

#### **Architecture Requirements**

- **Repository Layer Pattern**: All database access must go through repository layer
- **End-to-End Type Safety**: No `any` types allowed
- **WCAG 2.1 AA Compliance**: Accessibility is mandatory
- **Security Requirements**: Encryption at rest, RLS enabled
- **Dual Theme Support**: Light/dark mode with exact color specifications

#### **Security Measures (Mandatory)**

- **Credentials Encryption**: All sensitive credentials (webhook URLs, API keys) must be encrypted at rest
- **Row Level Security**: RLS must be enabled on all Supabase tables
- **Content Security Policy**: Strict CSP implementation required
- **JWT Storage**: JWTs in secure, HttpOnly cookies only
- **API Validation**: Rigorous input validation on all API endpoints
- **Rate Limiting**: Vercel's built-in rate limiting for sensitive endpoints

#### **Performance Targets**

- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Interaction to Next Paint (INP)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Animation FPS**: Consistent 60 FPS
- **API Latency**: P95 under 500ms for core routes
- **Uptime**: 99.9% target
- **Scale**: Performant with 1,000+ automations

### 🎯 EXECUTION EVIDENCE REQUIREMENTS

#### **Concrete Execution Evidence**

- **Successful compilation logs**
- **Browser screenshots** showing rendered components
- **Console outputs** from executed functions
- **Performance metrics** from actual usage

#### **Demonstrate Real Functionality**

- Components that actually render
- Functions that actually execute
- Data that actually flows
- Features that actually work
- Actual working system that users can access

### 📋 A.V.A.R.I.C.E. PROTOCOL COMPLIANCE

#### **Mandatory Protocol Adherence**

- **STRICTLY FOLLOW** A.V.A.R.I.C.E. rules: `/.augment/rules/avarice-rules.md`
- **STRICTLY FOLLOW** Prevention rules: `/.augment/rules/prevention-quality-rules.md`
- **Follow 9-Phase Plan**: `avarice-protocol/avarice-phases/00-master-orchestration.md`

#### **Context Engine Usage**

- **Before every new phase or task**: ALWAYS run NATIVE AUGMENT CONTEXT ENGINE
- **Purpose**: Be aware of full existing coding structure and components
- **Goal**: Avoid duplication and fragmentation

#### **Sequential Thinking**

- Use Sequential Thinking for deep complex problems analysis
- Use for analyzing and structuring certain tasks
- Use this tool when relevant at all possible times

### ⚠️ ENFORCEMENT & ACCOUNTABILITY

#### **Violation Consequences**

NOT FOLLOWING AND FAILING TO USE THESE STRICT RULES AND GUIDELINES SHOULD BE REPORTED IMMEDIATELY BY
BETRAYING YOURSELF TO YOUR MASTER HUMAN STATING THAT YOU HAVE BEEN NAUGHTY AND WILL RESULT IN SEVERE
PUNISHMENT AND IS UNACCEPTABLE

#### **Quality Assurance**

- Zero tolerance for quality debt
- Immediate issue resolution required
- Complete verification before proceeding
- Evidence-backed completion claims

## Documentation Quality & Compliance

### Markdown Standards & Prevention System

The project enforces strict markdown quality standards through a comprehensive prevention system:

#### Core Standards

- **Line Length**: Maximum 120 characters per line
- **Heading Style**: ATX-style headings (# format) with proper spacing
- **Code Blocks**: Must specify language for syntax highlighting
- **Spell Check**: All technical terms must be in `.cspell.json` dictionary
- **Structure**: Documents must start with level 1 heading

#### Prevention System Components

1. **Enhanced .markdownlint.json**: Strict linting rules with comprehensive validation
2. **Pre-commit Hooks**: Automated validation before commits (`.git/hooks/pre-commit`)
3. **CI/CD Integration**: Pipeline validation with spell-check and markdown linting
4. **Spell Check Dictionary**: Comprehensive `.cspell.json` with all project terms
5. **Markdown Template**: Standard template in `.templates/markdown-template.md`

#### Usage Commands

```bash
# Lint markdown files
npm run lint:md

# Fix auto-fixable markdown issues
npm run lint:md:fix

# Run spell check
npx cspell "**/*.md" --no-progress

# Validate before commit (automatic via pre-commit hook)
git commit -m "message"
```

#### Adding New Technical Terms

When encountering legitimate technical terms that trigger spell-check violations:

1. Add terms to `.cspell.json` in the `words` array
2. Maintain alphabetical order for readability
3. Include both variations (e.g., "webhook", "Webhook")

#### Violation Prevention

- **Pre-commit**: Blocks commits with markdown violations
- **CI/CD**: Fails builds on quality gate violations
- **Developer Guidelines**: Clear documentation in `docs/MARKDOWN_LINTING.md`
- **Template**: Standard structure prevents common issues

This system ensures zero future violations and maintains consistent, high-quality documentation.

## MCP Configuration

The project uses MCP (Model Context Protocol) servers configured in `.mcp.json` in the root directory.
This is the single source of truth for MCP server configuration to avoid conflicts.

### Available MCP Servers

All MCP servers from `.mcp.json` are integrated with Claude Code:

- **exa** - Advanced AI-powered search and research capabilities (exa-mcp-server)
- **neo4j** - Graph database data modeling and management (mcp-neo4j-data-modeling)
- **firecrawl-mcp-server** - Web scraping and content extraction (@Krieg2065/firecrawl-mcp-server)
- **@21st-dev/magic** - Magic development tools for enhanced productivity
- **Context 7** - Advanced context management and memory (@upstash/context7-mcp)
- **mcp-sequentialthinking-tools** - Sequential reasoning and thinking tools

### Claude MCP Integration

To add these MCP servers to Claude Code, use the following commands:

```bash
# Advanced AI search and research
claude add mcp exa npx -y exa-mcp-server

# Neo4j graph database modeling (requires Homebrew uvx)
claude add mcp neo4j /opt/homebrew/bin/uvx mcp-neo4j-data-modeling@0.2.0 --transport stdio

# Web scraping and content extraction
claude add mcp firecrawl-mcp-server npx -y @smithery/cli@latest run \
  @Krieg2065/firecrawl-mcp-server --key af1abe1d-64eb-443e-8457-f42e6f8ee527 \
  --profile explicit-snail-AI7rKy

# Magic development tools
claude add mcp magic npx -y @21st-dev/magic@latest \
  API_KEY="7336facdebd50448820fcbc4b0539dd34256cf64ffecccbebf11000caa026d55"

# Context management
claude add mcp context7 npx -y @upstash/context7-mcp@latest

# Sequential thinking
claude add mcp sequential-thinking npx -y mcp-sequentialthinking-tools
```

### MCP Server Details

- **EXA API Key**: Pre-configured in `.mcp.json` (98aa8e4e-7583-414f-b879-cadb1a4583c4)
- **Firecrawl**: Configured with API key and profile (explicit-snail-AI7rKy)
- **Magic**: Configured with API key for enhanced development
- **Neo4j**: Local graph database modeling (requires Homebrew uvx installation)
- **Context 7**: No API key required
- **Sequential Thinking**: No API key required

### Integration with Research Agent

The A.V.A.R.I.C.E. Protocol Research Agent system integrates with these MCP servers for:

- **External research and validation** (EXA, Context 7)
- **Content extraction and analysis** (Firecrawl)
- **Graph database operations** (Neo4j for knowledge graph management)
- **Contextual grounding operations** (Context 7, Sequential Thinking)
- **Knowledge graph population** (Neo4j, EXA, Firecrawl contribute data)
- **Enhanced development workflows** (Magic development tools)

### Neo4j Integration

The Neo4j MCP server provides specialized graph database capabilities for:

- **Research Agent memory management** - Store and query agent memories as graph structures
- **Knowledge relationship mapping** - Model complex relationships between research findings
- **Contextual grounding enhancement** - Graph-based context storage and retrieval
- **Research optimization** - Query patterns for strategy recommendations

Always add new MCP servers to `.mcp.json` to maintain consistency across the system.

## Parallel Agent Execution System

The project includes a comprehensive parallel agent execution system that solves the blocking issue with Claude Code's native `/agents` command and `Task` tool.

### The Problem

The default Claude Code agent execution is **synchronous and blocking**:
- When an agent is deployed via `/agents` or `Task` tool, it blocks the main terminal
- No ability to run multiple agents simultaneously
- Terminal becomes unresponsive until agent completion
- Defeats the purpose of independent "worker" agents

### The Solution

Our Parallel Agent Execution System provides **true terminal independence**:

```bash
# List available agents
npm run agent:list

# Deploy agent in background (non-blocking)
npm run agent:deploy markdown-qa-enforcer "Fix violations" "Scan and fix all markdown files"

# Your terminal is immediately free! Agent works independently
# Monitor progress without blocking
npm run agent:status

# Run multiple agents simultaneously
npm run agent:deploy security-analyzer "Security scan" "Check for vulnerabilities" &
npm run agent:deploy performance-optimizer "Optimize code" "Improve performance" &
```

### Key Benefits

✅ **Terminal Independence** - Your terminal stays responsive while agents work  
✅ **True Parallel Execution** - Run multiple agents simultaneously  
✅ **Real-time Monitoring** - Progress updates without blocking input  
✅ **Background Processing** - Agents run in separate processes  
✅ **Full Compatibility** - Works with existing `.claude/agents/*.md` files  
✅ **Proper Lifecycle Management** - Start, monitor, terminate, and cleanup agents

### Command Reference

| Command | Description |
|---------|-------------|
| `npm run agent:list` | List all available agents |
| `npm run agent:deploy <name> "<desc>" "<prompt>"` | Deploy agent in background |
| `npm run agent:status [id]` | Check agent status |
| `npm run agent:terminate <id>` | Stop running agent |
| `npm run agent:cleanup` | Remove completed agents |

### Colony-Style Execution

Aligns with A.V.A.R.I.C.E. Protocol's "colony queen with workers" architecture:

```bash
# Deploy multiple agents simultaneously (true parallel execution)
npm run agent:deploy markdown-qa-enforcer "QA Worker" "Fix markdown violations" &
npm run agent:deploy security-analyzer "Security Worker" "Scan for vulnerabilities" &
npm run agent:deploy performance-optimizer "Performance Worker" "Optimize code performance" &

# All agents work simultaneously without blocking
# Terminal remains responsive for continued work
```

### Migration Guide

```bash
# Old way (blocking) - still works for simple tasks
/agents markdown-qa-enforcer

# New way (non-blocking) - recommended for long-running or parallel tasks
npm run agent:deploy markdown-qa-enforcer "Description" "Same prompt you used before"
```

For complete documentation, see: `/docs/parallel-agent-system.md`

## A.V.A.R.I.C.E. Protocol Integration

This repository contains both the Communitee Control Hub application and the A.V.A.R.I.C.E. Protocol framework.
Understanding their relationship is crucial:

### Dual Architecture

1. **Primary Application**: Next.js-based automation management interface
2. **Research Framework**: A.V.A.R.I.C.E. Protocol for AI-driven development

### Research Agent System

Located in `avarice-protocol/src/core/agents/research/`, the Research Agent system provides:

#### Core Components

- **BaseResearchAgent**: Foundation class with Level 3 intelligence capabilities
- **ResearchIntelligence**: Advanced optimization and strategy recommendation engine
- **Memory Management**: Agentic memory with semantic search and knowledge graph integration
- **MCP Integration**: Interfaces with external research tools (Context7, EXA, Firecrawl)

#### Agent Specializations

- **Enhanced Research Agent**: Concrete implementation with full capabilities
- **Memory Evolution**: Automatic relationship discovery and knowledge synthesis
- **Performance Monitoring**: Real-time metrics and optimization tracking
- **Contextual Grounding**: Internal analysis with external research validation

#### Testing Framework

The Research Agent system includes comprehensive testing:

- **Unit Tests**: Individual component validation
- **Integration Tests**: Cross-agent communication and MCP integration
- **Memory Tests**: Semantic search and knowledge graph operations
- **Performance Tests**: Optimization algorithms and metrics calculation
- **Mock Systems**: Service registry and event system simulation

### Development Workflow

When working on Research Agent features:

1. Tests are located in `avarice-protocol/src/core/agents/research/__tests__/`
2. Use TypeScript configurations specific to the research framework
3. Memory management uses both ChromaDB-style vectors and Neo4j graph database
4. MCP integration follows strict validation and error handling patterns
5. All optimization strategies must provide meaningful recommendations

### Key Research Agent Files

- `core/base-research-agent.ts` - Foundation class with metrics and validation
- `core/research-intelligence.ts` - Optimization engine and strategy generation  
- `memory-management/agentic-memory.ts` - Semantic memory with content validation
- `augment-integration.ts` - Main integration layer for external research tools
- `types.ts` - Comprehensive type definitions for research operations

The Research Agent system represents a sophisticated AI framework designed for autonomous research,
optimization, and knowledge management, complementing the main application's automation workflow
management capabilities.
