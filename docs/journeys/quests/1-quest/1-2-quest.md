# Quest 1.1: Project Scaffolding & Environment Setup

## Status: Approved

## Quest

\* As a developer,  
\* I want a clean, configured project structure with all necessary credentials in place,  
\* so that I can begin building features efficiently and securely.

## Acceptance Criteria (ACs)

1\.  A monorepo is initialized and configured for the project.  
2\.  The frontend web application is scaffolded with the chosen framework (Next.js).  
3\.  The backend serverless function environment is set up within Next.js.  
4\.  A \`.env.example\` file is created at the project root, documenting all required environment variables.  
5\.  A local \`.env\` file is created and populated with valid development credentials for both Supabase and n8n.  
6\.  A basic "Hello World" version of the app, capable of loading these environment variables, is
    successfully deployed to a development environment (Vercel).

## Tasks / Subtasks

\- \[ \] Initialize a Git repository.  
\- \[ \] Use \`npx create-next-app@latest\` to initialize the project with TypeScript and Tailwind CSS.  
\- \[ \] Install core dependencies (\`shadcn-ui\`, \`zustand\`, \`@supabase/supabase-js\`, \`playwright\`).  
\- \[ \] Initialize \`shadcn-ui\`.  
\- \[ \] Create the top-level directory structure as defined in the Architecture Document (e.g.,
    \`/src/components\`, \`/src/lib\`, \`/docs\`, \`/supabase\`).  
\- \[ \] Create the \`.env.example\` and \`.env.local\` files with the required variables.  
\- \[ \] Make an initial commit with the scaffolded project.  
\- \[ \] Link the repository to a new Vercel project and confirm a successful initial deployment.

## Dev Notes

\* \*\*Architecture:\*\* This project is a Next.js App Router application. The full architecture is
  defined in \`docs/fullstack-architecture.md\`. Please adhere to the \*\*Unified Project Structure\*\*
  outlined in that document.  
\* \*\*Credentials:\*\* You will need to populate your local \`.env.local\` file with credentials from your
  Supabase project (URL, anon key, service role key) and a generated secret for the n8n webhook.

## Testing

No specific automated tests are required for this scaffolding quest. The primary validation is a successful deployment.

\*\*Manual Test Steps:\*\*  
\* Success is verified by visiting the Vercel preview URL generated from the initial
  deployment and seeing the default Next.js starter page.

\---

## Quest 1.2: User Authentication Setup

## Status: Approved (Continued)

## Quest (Continued)

\* As a user,  
\* I want to log in securely to the application,  
\* so that I can access my private dashboard.

## Acceptance Criteria (ACs) (Continued)

1\.  The application is integrated with the Supabase client, using the credentials from the \`.env\` file.  
2\.  A login page is created with functional UI components for signing up or signing in.  
3\.  The main dashboard is a protected route, redirecting unauthenticated users to the login page.  
4\.  A functional logout button is present in the UI, which securely clears the user's session.

## Tasks / Subtasks (Continued)

\- \[ \] Install the \`@supabase/supabase-js\` client library.  
\- \[ \] Create a Supabase client helper in \`/src/lib/\` to initialize and export a singleton client instance.  
\- \[ \] Create the UI for the login page at \`/src/app/(auth)/login/page.tsx\` using
    \`shadcn/ui\` components for inputs and buttons.  
\- \[ \] Implement the client-side logic for both sign-up and sign-in using the Supabase client methods.  
\- \[ \] Implement a Next.js middleware at \`/src/middleware.ts\` to protect all routes
    within the \`(dashboard)\` group.  
\- \[ \] Add a "Logout" button to the main dashboard layout that calls the Supabase \`signOut()\` method.

## Dev Notes (Continued)

\* \*\*Prerequisite:\*\* This quest assumes Quest 1.1 is complete. You must have a
  scaffolded Next.js project with valid Supabase environment variables in your
  \`.env.local\` file.  
\* \*\*Architecture:\*\* Authentication is handled exclusively by Supabase Auth. Refer to
  the official Supabase documentation for the latest best practices on implementing auth
  within the Next.js App Router.  
\* \*\*UI:\*\* The login form and buttons should be built using \`shadcn/ui\` components
  (\`\<Input\>\`, \`\<Button\>\`, \`\<Label\>\`, \`\<Card\>\`) to maintain consistency with the
  UI/UX Specification.

## Testing (Continued)

This is a critical feature and requires End-to-End (E2E) tests.

\* \*\*E2E Tests (Playwright):\*\*  
    \* A test case for a successful user login and redirection to \`/dashboard\`.  
    \* A test case for a failed login attempt with incorrect credentials.  
    \* A test case verifying that an unauthenticated user attempting to access
      \`/dashboard\` is redirected to \`/login\`.

## Manual Test Steps  

1\.  Navigate to the application URL.  
2\.  Attempt to access the \`/dashboard\` route directly; you should be redirected to \`/login\`.  
3\.  Use the form to create a new account.  
4\.  After being logged in, use the logout button.  
5\.  Log back in with the account you just created. You should be successfully redirected to the dashboard.  
