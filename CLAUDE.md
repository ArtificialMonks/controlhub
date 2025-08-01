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
