# **Communitee Control Hub Product Requirements Document (PRD)**

## **Goals and Background Context**

### **Goals**

The primary goals of this Product Requirements Document (PRD) are to deliver a product that achieves the
following outcomes:

* Empower non-technical operators to confidently manage their n8n automations without developer
  assistance.
* Significantly reduce the time developers spend on routine operational support tasks.
* Deliver a high-value "Client View" portal that acts as a key differentiator for agencies.
* Ensure the end-user experience is defined by simplicity, clarity, and time-saving efficiency.

### **Background Context**

The core business problem is that managing n8n workflows is often too complex and technical for the
business users who depend on them. This creates operational bottlenecks and dependency on developer
resources for simple tasks like starting or stopping a workflow.

This PRD outlines the requirements for the Communitee Control Hub, a user-friendly management layer that
abstracts away this complexity. It will provide a centralized, simplified "mission-control" for
non-technical users to safely monitor and interact with their automations.

### **Change Log**

| Date | Version | Description | Author |
| :---- | :---- | :---- | :---- |
| 2025-07-31 | 1.0 | Initial PRD draft based on approved Project Brief. | John, Product Manager |

## **Requirements**

### **Functional**

* **FR1:** The system must provide secure user authentication via Supabase (magic-link or password) to a
  dedicated workspace1.

* **FR2:** The main view must display all automations in a data grid with columns for: **Automation Name**
  (reflecting the workflow's name in n8n) and **Client** (reflecting the name of the client's login), in
  addition to Status, Last Run, and Avg Duration2.

* **FR3:** The Status column must display a color-coded badge indicating the automation's health: Running
  (green, \#22c55e), Stopped (grey, \#9ca3af), or Error (red, \#ef4444)3.

* **FR4:** The interface must include a search field that filters the data grid in real-time by client or
  automation name444.

* **FR5:** The interface must include status filter chips (Running, Stopped, Error) that allow for
  multi-selection to filter the data grid5. When no chips are selected, all statuses are shown6.

* **FR6:** Each row in the data grid must have a "Run" button to trigger the individual automation7777.

* **FR7:** Each row in the data grid must have a "Stop" button to pause the individual automation8888.

* **FR8:** The interface must provide a "Run All Filtered" button that triggers every automation currently
  visible in the filtered data grid9999.

* **FR9:** The interface must provide a "Stop All Filtered" button that stops every automation currently
  visible in the filtered data grid10101010.

* **FR10:** The system must receive "start" and "completion" data from n8n via a two-way webhook system
  (Enhanced Telemetry).
* **FR11:** A user menu must contain a toggle for switching between light and dark modes, and this
  preference must be remembered by the browser11.

### **Non Functional**

* **NFR1:** All sensitive credentials, such as webhook URLs and API keys, must be encrypted at rest.  
* **NFR2:** The system architecture shall target 99.9% uptime.  
* **NFR3:** The system must be designed to support future internationalization (i18n), ensuring UI text
  is not hardcoded.
* **NFR4:** The UI, particularly the data grid and its filtering, must remain performant and responsive
  with up to 1,000 automations loaded.
* **NFR5:** The dark mode theme must use a deep navy gradient background (\#0a0b1f→ \#002bff) with white
  text12.

* **NFR6:** The light mode theme must use a white background (\#ffffff) with black text13.

* **NFR7:** All layout and controls must remain identical between light and dark modes; only colors should
  change14.

## **User Interface Design Goals**

### **Overall UX Vision**

The core UX vision is "Radical Simplicity for a Professional Tool". The interface must feel **sleek and
efficient**, while also being **friendly and helpful**. To achieve this balance, the interface will present
a simple, clean view by default, with options for power users to access more advanced filtering and data
columns as needed. The goal is to provide a sense of clarity, confidence, and effortless control, making
users feel like a commander at a mission-control board, not a developer.

### **Global Layout & Navigation**

The application will use a two-column layout featuring a persistent, **collapsible global sidebar** on the
left and a main content area on the right.

* **Sidebar Content (MVP):**  
  * **Automations:** The main dashboard view with the data grid.  
  * **Settings:** User and workspace settings.  
* **Sidebar Content (Post-MVP Brainstorm):** The sidebar will be designed to accommodate future expansion,
  including:
  * **Analytics:** The future home for the analytics and reporting dashboard.  
  * **Health:** A dedicated view for system health and logs.  
  * **Client Management:** A section for agencies to manage their clients and portal access permissions.
  * **Help & Docs:** A link to support resources.

### **Key Interaction Paradigms**

* **Data-Grid Centric:** The primary user interaction is with a single, comprehensive data grid.  
* **Direct Manipulation:** Users will directly manipulate the data set they see through real-time search
  and filter chips.  
* **One-Click Actions:** Core actions (Run, Stop) are performed with a single click, followed by a clear
  confirmation dialog.
* **Customizable Data View:** To support advanced user workflows, the architect should plan for the data
  grid to support **column resizing and reordering**.

### **Core Screens and Views**

The project will consist of the following core views:

* **Login Screen:** For Supabase authentication.  
* **Main Dashboard:** The primary screen, accessed via the "Automations" sidebar link.  
* **Empty State View:** A well-designed and helpful view that appears for new users with no automations or
  when a filter returns no results. This screen should guide the user on their next steps.
* **Settings View:** A screen for managing user and workspace settings.  
* **User Menu:** A simple dropdown for the theme toggle and logout function.

### **Accessibility**

The application should be designed to meet **WCAG 2.1 AA** standards.

### **Branding**

The branding will be clean and professional.

* **Light Mode:** Black text on a white background15.

* **Dark Mode:** White text on a deep navy-blue gradient background (\#0a0b1f→ \#002bff), with a dark
  gradient blue accent color16. No purple or violet tones are to be used17.

### **Target Device and Platforms**

The application must be **fully responsive**. It must provide a tailored and fully functional experience
on all screen sizes, from mobile phones to tablets and large desktops.

## **Technical Assumptions**

### **Repository Structure: Monorepo**

To streamline development between the user interface and the backend webhook listeners, a **Monorepo**
structure is recommended. This will allow for shared code (like data types) and simplified, unified
deployment pipelines. The final decision rests with the Architect.

### **Service Architecture: Serverless**

Given the event-driven nature of the application (reacting to user clicks and incoming webhooks), a
**Serverless** architecture is recommended. Using cloud functions (e.g., Vercel Functions, AWS Lambda) for
the backend will be cost-effective and highly scalable, as we only consume resources when actions are
performed.

### **Testing requirements**

A comprehensive testing strategy is required, including:

* **Unit Tests:** For individual components and functions to ensure they work in isolation.  
* **Integration Tests:** To verify the interactions between our services, such as the UI calling the
  backend and the backend correctly processing a webhook.
* **End-to-End (E2E) Tests:** To simulate and validate critical user flows from the browser.

### **Additional Technical Assumptions and Requests**

* **Authentication:** The system **must** use Supabase for user authentication.  
* **Webhook Integration:** The backend **must** be designed to support the "Enhanced Telemetry" two-way
  webhook system.
* **Database:** It is strongly recommended to use the integrated Supabase Postgres database to simplify the
  architecture and leverage Supabase's existing capabilities.

---

Please review this complete document. Once you confirm, I will proceed with the final validation checklist
to ensure its quality and readiness for the architecture phase.
