# Communitee Control Hub - Enterprise Directory Structure

## Overview

This document describes the enterprise-grade directory structure implemented for the Communitee Control Hub
application. The structure follows modern Next.js and full-stack application best practices, emphasizing clean
architecture, security, and scalability.

## Directory Tree

```typescript
communitee-control-hub/
├── README.md                           # Project overview and quick start
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Dependency lock file
├── tsconfig.json                       # TypeScript configuration
├── .eslintrc.js                        # ESLint configuration
├── .gitignore                          # Git ignore patterns
├── .env.example                        # Environment variables template
├── .env.local                          # Local environment variables (excluded from git)
├── vercel.json                         # Vercel deployment configuration
├── vitest.config.ts                    # Vitest testing configuration
├── DEPLOYMENT.md                       # Production deployment guide
├── STRUCTURE.md                        # This file - directory structure documentation
│
├── public/                             # Static assets
│   ├── favicon.ico                     # Favicon
│   ├── logo.svg                        # Application logo
│   └── images/                         # Static images
│
├── docs/                               # Project documentation
│   ├── source/                         # Source documentation
│   │   ├── PRD/                        # Product Requirements Documents
│   │   │   ├── chub-fullstack-architecture.md
│   │   │   └── chub-prd.md
│   │   ├── project-brief/              # Project brief documentation
│   │   │   └── chub-project-brief.md
│   │   └── ui-specs/                   # UI specifications
│   │       └── chub-ui-specs.md
│   ├── evidence/                       # A.V.A.R.I.C.E. Protocol evidence storage
│   │   ├── TEMPLATE-quest-structure/   # Standardized quest evidence template
│   │   ├── quest-1.1/                  # Quest-specific evidence directories
│   │   ├── quest-1.2/                  # Following standardized structure
│   │   └── quest-{number}/             # Each quest has dedicated evidence directory
│   │       ├── phase-evidence/         # Evidence from all 9 protocol phases
│   │       ├── agent-reports/          # Agent-specific reports and outputs
│   │       ├── quality-gates/          # Quality gate validation results
│   │       └── memorization/           # Neo4j memory storage confirmations
│   └── journeys/                       # User journey documentation
│       └── quests/                     # Quest-based feature documentation
│
├── supabase/                           # Supabase configuration and migrations
│   └── migrations/                     # Database migration files
│       ├── 001_create_profiles_table.sql
│       ├── 002_create_clients_table.sql
│       ├── 003_create_automations_table.sql
│       └── 004_create_automation_runs_table.sql
│
├── src/                                # Next.js application source code
│   ├── app/                           # Next.js App Router directory
│   │   ├── globals.css                # Global styles
│   │   ├── layout.tsx                 # Root layout component
│   │   ├── page.tsx                   # Home page component
│   │   ├── loading.tsx                # Loading UI component
│   │   ├── error.tsx                  # Error UI component
│   │   ├── not-found.tsx              # 404 page component
│   │   │
│   │   ├── (auth)/                    # Authentication route group
│   │   │   ├── login/                 # Login page
│   │   │   │   └── page.tsx
│   │   │   ├── signup/                # Signup page
│   │   │   │   └── page.tsx
│   │   │   └── auth-code-error/       # Auth error page
│   │   │       └── page.tsx
│   │   │
│   │   ├── dashboard/                 # Protected dashboard routes
│   │   │   ├── page.tsx               # Dashboard home
│   │   │   ├── layout.tsx             # Dashboard layout
│   │   │   ├── automations/           # Automation management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── clients/               # Client management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── analytics/             # Analytics dashboard
│   │   │   │   └── page.tsx
│   │   │   └── settings/              # User settings
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                       # API routes (Next.js App Router)
│   │       ├── auth/                  # Authentication endpoints
│   │       │   ├── callback/
│   │       │   │   └── route.ts       # OAuth callback handler
│   │       │   └── signout/
│   │       │       └── route.ts       # Sign out endpoint
│   │       ├── users/                 # User management endpoints
│   │       │   └── profile/
│   │       │       └── route.ts       # User profile CRUD
│   │       └── webhooks/              # Webhook endpoints
│   │           └── n8n/               # n8n integration webhooks
│   │               ├── automation/
│   │               │   └── route.ts   # Automation webhook handler
│   │               └── telemetry/
│   │                   └── route.ts   # Telemetry webhook handler
│   │
│   ├── components/                    # Reusable React components
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...                    # Other UI components
│   │   ├── auth/                      # Authentication components
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── auth-provider.tsx
│   │   ├── dashboard/                 # Dashboard components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── navigation.tsx
│   │   └── automation/                # Automation-specific components
│   │       ├── automation-card.tsx
│   │       ├── automation-form.tsx
│   │       └── workflow-builder.tsx
│   │
│   ├── lib/                           # Utility libraries and configurations
│   │   ├── actions/                   # Server actions
│   │   │   └── auth.ts                # Authentication server actions
│   │   ├── config.ts                  # Centralized configuration management
│   │   ├── dal.ts                     # Data Access Layer
│   │   ├── utils.ts                   # Utility functions
│   │   │
│   │   ├── supabase/                  # Supabase integration
│   │   │   ├── client.ts              # Client-side Supabase client
│   │   │   ├── server.ts              # Server-side Supabase client
│   │   │   └── middleware.ts          # Supabase middleware
│   │   │
│   │   ├── stores/                    # Zustand state management
│   │   │   ├── auth-store.ts          # Authentication state
│   │   │   ├── automation-store.ts    # Automation state
│   │   │   └── app-store.ts           # Global application state
│   │   │
│   │   ├── middleware/                # Custom middleware
│   │   │   └── error-handler.ts       # Global error handling
│   │   │
│   │   ├── security/                  # Security utilities
│   │   │   └── encryption.ts          # Encryption and sanitization
│   │   │
│   │   └── monitoring/                # Monitoring and logging
│   │       ├── logger.ts              # Structured logging system
│   │       └── production-setup.ts    # Production monitoring setup
│   │
│   ├── middleware.ts                  # Next.js middleware
│   │
│   └── test/                          # Test files (excluded from build)
│       ├── setup.ts                   # Test setup configuration
│       ├── components/                # Component tests
│       │   └── login-form.test.tsx
│       ├── stores/                    # Store tests
│       │   └── auth-store.test.ts
│       └── lib/                       # Library tests
│           └── dal.test.ts
│
├── playwright.config.ts               # Playwright E2E testing configuration
├── tests/                             # E2E tests
│   ├── auth.spec.ts                   # Authentication E2E tests
│   ├── dashboard.spec.ts              # Dashboard E2E tests
│   └── api.spec.ts                    # API E2E tests
│
└── logs/                              # Application logs (excluded from git)
    ├── app.log                        # Application logs
    ├── error.log                      # Error logs
    └── access.log                     # Access logs
```

## Directory Purposes

### Root Level

- **Essential project files only**: README, package.json, configuration files
- **No business logic or implementation details**
- **Clean, professional appearance for repository visitors**

### `/src/app` - Next.js App Router

#### Modern Next.js 13+ App Router structure with file-based routing

- **Route Groups**: `(auth)` for authentication-related pages
- **Dynamic Routes**: `[id]` for parameterized routes
- **API Routes**: RESTful API endpoints with proper HTTP methods
- **Layouts**: Nested layouts for different sections of the application

### `/src/components` - React Components

#### Reusable UI components organized by domain

- **UI Components**: shadcn/ui based design system components
- **Feature Components**: Domain-specific components (auth, dashboard, automation)
- **Composition**: Components designed for reusability and composition

### `/src/lib` - Utility Libraries

#### Core application logic and utilities

- **Configuration**: Centralized environment and feature flag management
- **Data Access**: Supabase integration and data access patterns
- **State Management**: Zustand stores for client-side state
- **Security**: Encryption, sanitization, and security utilities
- **Monitoring**: Logging, metrics, and error tracking

### `/supabase` - Database Management

#### Database schema and migration management

- **Migrations**: SQL migration files with proper versioning
- **RLS Policies**: Row Level Security policies for data protection
- **Indexes**: Performance optimization through proper indexing

### `/docs` - Documentation

#### Comprehensive project documentation

- **Architecture**: Technical architecture and design decisions
- **Requirements**: Product requirements and specifications
- **User Journeys**: Feature documentation organized as user journeys
- **Evidence Storage**: A.V.A.R.I.C.E. Protocol evidence with standardized quest-specific organization

#### Evidence Storage Standards (MANDATORY)

**Location**: `/docs/evidence/quest-{quest-number}/`

**Standardized Structure**:

- `phase-evidence/`: Evidence from all 9 A.V.A.R.I.C.E. Protocol phases
- `agent-reports/`: Agent-specific reports (Architect, Coder, QA, Logician, Scribe)
- `quality-gates/`: Quality gate validation results (TypeScript, ESLint, Testing, Security)
- `memorization/`: Neo4j memory storage confirmations and institutional memory

**Enforcement Rules**:

- **ZERO TOLERANCE**: Evidence storage outside quest-specific directories is prohibited
- **AUTOMATIC VALIDATION**: Evidence paths validated during protocol execution
- **QUEST NUMBERING**: Use format `quest-{major}.{minor}` (e.g., `quest-1.1`, `quest-2.3`)
- **NO COMBINED QUESTS**: Avoid formats like `quest-2.1-2.2` or inconsistent naming

### `/tests` - Testing

#### Comprehensive testing strategy

- **Unit Tests**: Component and utility function tests with Vitest
- **E2E Tests**: End-to-end testing with Playwright
- **Integration Tests**: API and database integration tests

## Architecture Principles

### 1. **Clean Architecture**

- Clear separation of concerns between UI, business logic, and data access
- Dependency inversion with interfaces and abstractions
- Domain-driven design principles

### 2. **Security First**

- Row Level Security (RLS) enabled on all database tables
- Input validation and sanitization at all entry points
- Secure authentication with Supabase Auth
- Environment variable management and secrets protection

### 3. **Performance Optimization**

- Static generation where possible with Next.js
- Proper caching strategies for API responses
- Image optimization with Next.js Image component
- Bundle optimization and code splitting

### 4. **Developer Experience**

- TypeScript strict mode for type safety
- ESLint and Prettier for code quality
- Comprehensive testing with Vitest and Playwright
- Hot reload and fast refresh in development

### 5. **Production Readiness**

- Comprehensive monitoring and logging
- Error tracking and performance monitoring
- Proper deployment configuration for Vercel
- Environment-specific configurations

## Best Practices

### File Naming Conventions

- **Components**: PascalCase (e.g., `LoginForm.tsx`)
- **Utilities**: camelCase (e.g., `authUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase with descriptive names (e.g., `UserProfile.ts`)

### Import Organization

1. React and Next.js imports
2. Third-party library imports
3. Internal component imports
4. Utility and configuration imports
5. Type imports (with `type` keyword)

### Component Structure

- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility best practices (WCAG 2.1 AA)
- Use TypeScript interfaces for props

### State Management

- Use Zustand for global state management
- Implement proper state persistence where needed
- Follow immutable update patterns
- Use computed values for derived state

This structure ensures maintainability, scalability, and follows modern Next.js and React best practices while
maintaining enterprise-grade standards for security and performance.
