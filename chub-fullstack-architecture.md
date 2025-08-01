# **Communitee Control Hub Fullstack Architecture Document**

## **Introduction**

This document outlines the complete fullstack architecture for the Communitee Control Hub, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

### **Starter Template or Existing Project**

While no specific pre-packaged starter _kit_ was selected in the PRD, the technical foundation will be a modern React meta-framework to support our goals of a high-performance, serverless application.

**Recommendation:** The project will be initialized using the standard **Next.js App Router** starter (npx create-next-app@latest).

**Rationale:**

* **Alignment:** Next.js is the leading framework for production React applications and integrates seamlessly with our chosen UI library, **shadcn/ui**.  
* **Serverless by Default:** It is designed for a serverless deployment model, which directly aligns with the PRD's technical recommendation.  
* **Full-Stack Capabilities:** The framework's API routes provide a natural and efficient way to build our backend, including the critical "Enhanced Telemetry" webhook endpoint.

###

###

###

### **Change Log**

| Date | Version | Description | Author |
| :---- | :---- | :---- | :---- |
| 2025-07-31 | 1.0 | Initial architecture draft. | Winston, Architect |

## **High Level Architecture**

### **Technical Summary**

The system will be a full-stack, serverless web application built on the **Next.js** framework. The frontend will be a server-side rendered (SSR) React application using **shadcn/ui**. The backend will consist of serverless API routes co-located within the same application, responsible for user actions and processing incoming n8n webhooks. The entire application will be deployed on **Vercel**, with data and auth managed by **Supabase**. Key architectural patterns include a strict **Repository Layer** to mitigate vendor lock-in and a **"n8n Heartbeat Checker"** service to monitor the upstream n8n instance.

### **Platform and Infrastructure Choice**

* **Platform:** **Vercel**  
  * **Rationale:** Provides a seamless, zero-configuration deployment experience for Next.js, a global edge network for performance, integrated CI/CD, and native support for our serverless API routes.  
* **Key Services:**  
  * **Vercel:** For application hosting, serverless function execution, and CI/CD.  
  * **Supabase:** For the Postgres database, user authentication, and real-time data subscriptions. _(Note: A post-MVP "Load Testing" quest will be added to the roadmap to validate performance under high write-volume scenarios)._

### **Repository Structure**

* **Structure:** A single **Next.js application repository**.  
  * **Rationale:** Co-locating frontend and backend code simplifies development and allows for end-to-end type safety between the UI and the API.

### **High Level Architecture Diagram**

Code snippet

graph TD  
    User \--\> Vercel\[Vercel Edge Network\];  
    Vercel \--\> App\[Next.js App (SSR Frontend)\];  

    subgraph "User Interaction Flow"  
        App \-- API Calls \--\> API\_Routes\[API Routes on Vercel\];  
        API\_Routes \-- Triggers \--\> n8n\[n8n Instance\];  
        API\_Routes \-- Reads/Writes via Repository \--\> Supabase\[Supabase (DB & Auth)\];  
    end

    subgraph "Webhook Flow"  
        n8n \-- "Start/Completion" Webhooks \--\> Webhook\_Endpoint\[Webhook API Route\];  
        Webhook\_Endpoint \-- Writes via Repository \--\> Supabase;  
        Supabase \-- Real-time Update \--\> App;  
    end

    subgraph "Monitoring"  
        Heartbeat\[Scheduled Function on Vercel\] \-- Pings \--\> n8n;  
        Heartbeat \-- Updates Status \--\> Supabase;  
    end

### **Architectural Patterns**

* **Full-Stack Framework:** Using Next.js for both frontend and backend logic.  
* **Server-Side Rendering (SSR):** For the initial page load to improve performance.  
* **API Routes:** All backend logic will be implemented as serverless functions. _(Note: Post-MVP, the critical webhook ingestion service will be considered for extraction into a separate function for fault isolation)._  
* **Repository Layer:** All database and auth calls **must** be wrapped in a dedicated data access layer. This abstracts the data source and mitigates long-term vendor lock-in.  
* **Component-Based UI:** The frontend will be composed of reusable React components from shadcn/ui.  
* **Database as a Service (DBaaS):** We will use Supabase to offload database management.

## **Tech Stack**

| Category | Technology | Version | Purpose & Rationale |
| :---- | :---- | :---- | :---- |
| **Frontend Language** | TypeScript | 5.5.3 | For type-safe development, catching errors early. |
| **Frontend Framework** | Next.js (App Router) | 14.2.5 | Production-grade React framework with SSR and serverless functions. |
| **UI Component Library** | shadcn/ui | Latest | A collection of accessible and composable components for rapid UI development. |
| **State Management** | Zustand | 4.5.2 | Simple, unopinionated state management for React that avoids boilerplate. |
| **CSS Framework** | Tailwind CSS | 3.4.4 | A utility-first CSS framework for creating custom designs efficiently. |
| **Backend Language** | TypeScript | 5.5.3 | Aligns with the frontend for a consistent, type-safe monorepo experience. |
| **Backend Framework** | Next.js API Routes | 14.2.5 | Provides a simple, serverless-first way to build our backend. |
| **API Style** | REST API | N/A | Well-understood, standard approach for web APIs. |
| **Database** | PostgreSQL (via Supabase) | 16.x | Powerful, reliable, and feature-rich open-source relational database. |
| **Authentication** | Supabase Auth | \~2.x | Manages user sign-up, login, and session management securely. |
| **Frontend Testing** | Vitest \+ React Testing Library | 1.6.0 | Modern, fast test runner and library for testing components from a user's perspective. |
| **E2E Testing** | Playwright | 1.45.1 | For robust, end-to-end testing of critical user flows across different browsers. |
| **CI/CD Platform** | Vercel CI | N/A | Natively integrated with our host, providing seamless automated deployments. |

## **Data Models**

(Details the Profile, Client, Automation, and AutomationRun models with their attributes and TypeScript interfaces.)

## **REST API Spec**

(Provides the OpenAPI 3.0 specification for all required endpoints.)

## **Components**

(Details the logical components: Frontend Application, Backend API, Repository Layer, n8n Webhook Service, Telemetry Ingestion Service, and Heartbeat Checker, including a component diagram.)

## **External APIs**

### **n8n Instance (via Webhooks)**

* **Purpose:** To trigger and stop the user's automation workflows.  
* **Documentation:** https://docs.n8n.io/webhooks/  
* **Authentication:** A secret token sent in the request headers.  
* **Integration Notes:** The n8n Webhook Service component is responsible for managing these outbound calls. URLs are stored encrypted.

## **Core Workflows**

(Includes sequence diagrams for Initial Data Load, User Triggers an Automation, and n8n Reports Automation Completion.)

## **Database Schema**

The following SQL statements define the tables for our PostgreSQL database, to be managed via Supabase migrations. Row Level Security (RLS) must be enabled on all tables.

SQL

\-- Table for Clients (Organizations/Teams)  
CREATE TABLE public.clients (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  name text NOT NULL UNIQUE,  
  created\_at timestamptz DEFAULT now()  
);

\-- Table for user-specific data, extending Supabase Auth  
CREATE TABLE public.profiles (  
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
  client\_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,  
  full\_name text,  
  avatar\_url text,  
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))  
);

\-- Table for the core Automation entities  
CREATE TABLE public.automations (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  client\_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,  
  name text NOT NULL,  
  status text NOT NULL DEFAULT 'Stopped' CHECK (status IN ('Running', 'Stopped', 'Error', 'Stalled')),  
  last\_run\_at timestamptz,  
  avg\_duration\_ms integer,  
  success\_rate real DEFAULT 100.0 CHECK (success\_rate \>= 0 AND success\_rate \<= 100),  
  n8n\_run\_webhook\_url text NOT NULL,  
  n8n\_stop\_webhook\_url text  
);  
CREATE INDEX ON public.automations (client\_id);

\-- Table to log the history of each automation run  
CREATE TABLE public.automation\_runs (  
  id bigserial PRIMARY KEY,  
  automation\_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,  
  started\_at timestamptz NOT NULL DEFAULT now(),  
  completed\_at timestamptz,  
  duration\_ms integer,  
  status text NOT NULL CHECK (status IN ('success', 'error')),  
  error\_message text  
);  
CREATE INDEX ON public.automation\_runs (automation\_id);

## **Frontend Architecture**

(Details Component Architecture, State Management, Routing, and the Frontend Services Layer.)

## **Backend Architecture**

(Details the Serverless Function Architecture, Database Access Layer, and Authentication/Authorization flow.)

## **Unified Project Structure**

Plaintext

communitee-control-hub/  
├── docs/                     \# Project documentation (PRD, Specs, etc.)  
├── public/                   \# Static assets  
├── src/  
│   ├── app/                  \# Next.js App Router (UI Pages & API Routes)  
│   ├── components/           \# React Components  
│   └── lib/                  \# Shared libraries, services, repositories  
├── supabase/  
│   └── migrations/           \# Database migration scripts  
├── .env.local  
├── package.json  
└── vercel.json               \# Vercel-specific configurations

## **Development Workflow**

### **Local Development Setup**

**Prerequisites:**

* Node.js (LTS version)  
* pnpm (or npm/yarn)  
* Vercel CLI  
* A Supabase account and a new project created.

**Initial Setup:**

1. Clone the repository: git clone ...  
2. Install dependencies: pnpm install  
3. Set up environment variables: cp .env.example .env.local and fill in the values.  
4. Run database migrations: pnpm dlx supabase db push (requires Supabase CLI)  
5. Start the development server: pnpm dev

**Development Commands:**

* pnpm dev: Starts the Next.js development server on localhost:3000.  
* pnpm build: Creates a production-ready build of the application.  
* pnpm test: Runs the test suite using Vitest.  
* pnpm lint: Lints the codebase for errors and style issues.

### **Environment Configuration**

The .env.local file is required for local development and must contain the following variables:

Bash

\# Supabase Project Credentials  
NEXT\_PUBLIC\_SUPABASE\_URL="your\_supabase\_project\_url"  
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY="your\_supabase\_anon\_key"  
\# This is a secret key for backend server-to-server communication  
SUPABASE\_SERVICE\_ROLE\_KEY="your\_supabase\_service\_role\_key"

\# Secret for validating inbound webhooks from n8n  
N8N\_WEBHOOK\_SECRET="generate\_a\_strong\_random\_secret"

\# Next.js Auth Secret  
NEXTAUTH\_SECRET="generate\_a\_strong\_random\_secret\_for\_session\_encryption"

## **Deployment Architecture**

### **Deployment Strategy**

* **Frontend Deployment:** The Next.js frontend application will be deployed to **Vercel's global Edge Network**.  
* **Backend Deployment:** All backend logic within the Next.js API Routes will be deployed as individual **Serverless Functions** on Vercel's infrastructure.

### **CI/CD Pipeline**

We will use Vercel's native, Git-integrated CI/CD pipeline. Every Pull Request will generate a unique **Preview URL** for testing. Merges to the main branch will automatically trigger a **Production** deployment.

### **Environments**

| Environment | Frontend URL | Backend URL | Purpose & Trigger |
| :---- | :---- | :---- | :---- |
| **Development** | http://localhost:3000 | http://localhost:3000 | Local development by the team. |
| **Preview** | \[branch-name\]-project.vercel.app | (Same as Frontend) | Automatically deployed from every Pull Request for testing and review. |
| **Production** | \[your-production-domain.com\] | (Same as Frontend) | The live application for end-users. Automatically deployed from main. |

## **Security and Performance**

### **Security Requirements**

* **Frontend Security:** A strict Content Security Policy (CSP) will be implemented. JWTs will be stored in secure, HttpOnly cookies.  
* **Backend Security:** All API inputs will be rigorously validated. Vercel's built-in rate limiting will be configured for sensitive endpoints.  
* **Authentication Security:** Secure session and token refresh logic will be handled by the official Supabase client library.

### **Performance Optimization**

* **Frontend Performance:** We will use Server-Side Rendering (SSR), code-splitting, and skeleton loaders to achieve our Core Web Vitals goals.  
* **Backend Performance:** The 95th percentile (P95) latency for all core API routes should remain under 500ms. Database indexes will be used for all frequently queried columns.

## **Testing Strategy**

### **Testing Pyramid**

Our strategy is based on the Testing Pyramid, with a foundation of many fast unit tests, fewer integration tests, and a select few end-to-end tests.

### **Test Organization**

* **Frontend Unit/Integration Tests:** Co-located with the component files.  
* **Backend Unit/Integration Tests:** Located in \_\_tests\_\_ subdirectories within the API route structure.  
* **End-to-End (E2E) Tests:** Located in a separate top-level /tests directory.

### **Test Examples**

(Provides boilerplate examples for a Frontend Component Test with jest-axe, a Backend API Test, and an E2E Test with Playwright.)

## **Coding Standards**

### **Critical Fullstack Rules**

1. **Use the Repository Layer:** All database interactions **must** go through the defined Repository Layer.  
2. **End-to-End Type Safety:** Use shared TypeScript types; avoid using any.  
3. **Use the Centralized API Client:** Frontend components **must** use the centralized API client for all backend communication.  
4. **Isolate Environment Variables:** Access environment variables only through a dedicated configuration module.  
5. **Rely on Authentication Middleware:** Do not implement session checks inside individual API routes.

### **Naming Conventions**

| Element | Convention | Example |
| :---- | :---- | :---- |
| **React Components** | PascalCase | AutomationTable.tsx |
| **React Hooks** | useCamelCase | useAutomations.ts |
| **Database Tables** | snake\_case | automation\_runs |

## **Error Handling Strategy**

### **Error Response Format**

All errors returned by the backend API **must** conform to a standardized JSON structure including a user-friendly message, status code, and a request ID for tracing.

### **Frontend Error Handling**

The centralized API client will catch all non-2xx responses and trigger a global **Toast** notification with a user-friendly message.

### **Backend Error Handling**

All API routes will use a global try...catch block to ensure no unhandled exceptions are thrown. Custom error classes will be used to map to specific HTTP status codes.

## **Monitoring and Observability**

### **Monitoring Stack**

* **Frontend Monitoring:** **Vercel Analytics** for Core Web Vitals.  
* **Backend Monitoring:** **Vercel's Function Logs** for serverless function health.  
* **Error Tracking:** A dedicated service like **Sentry** will be integrated for detailed error reports.  
* **Database Monitoring:** **Supabase's built-in dashboard** for database health.

### **Key Metrics**

(Details key frontend and backend metrics to monitor, including error rates, P95 latency, and Core Web Vitals.)
