# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:run` - Run all tests once
- `npm run test:coverage` - Run tests with coverage report

### Testing Strategy
The project uses:
- **Vitest** for unit testing
- **Testing Library** (@testing-library/react, @testing-library/jest-dom) for component testing
- **Playwright** for end-to-end testing
- Test files are located in `src/test/` directory
- Setup files: `src/test/setup.ts`, `tests/setup.ts`

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

#### Parallel Development Environment
- **`avarice-protocol/`** - Separate development environment (excluded from main tsconfig)
- Contains extensive testing, logging, and agent-based architecture
- Should be treated as independent from main application

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
- RESTful API routes in `app/api/`
- Webhook endpoints for n8n integration
- Server actions for form submissions

## Key Business Context

This is the **Communitee Control Hub** - a management interface for n8n automation workflows. The main goal is to provide non-technical users with a simple interface to monitor and control their automation workflows without needing developer assistance.

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
- Write unit tests for utilities and business logic
- Component tests for UI components
- Integration tests for API routes and database operations
- E2E tests for critical user flows

## MCP Configuration

The project uses MCP (Model Context Protocol) servers configured in `.mcp.json` in the root directory. This is the single source of truth for MCP server configuration to avoid conflicts.