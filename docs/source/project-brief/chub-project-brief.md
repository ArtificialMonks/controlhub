# **Project Brief: Communitee Control Hub**

## **Executive Summary**

This project brief provides the charter for the project team building the **Communitee Control Hub**, a browser-based "mission-control board" for n8n automations. The core problem we are solving is the technical complexity that prevents non-technical professionals from confidently managing their own workflows.

Our solution is a user-friendly dashboard centered around a powerful data grid. This interface will allow operators to intuitively monitor, trigger, and stop their "helper robots" (automations) via real-time filtering and single-click bulk actions, completely abstracting away the need to interact with the n8n admin panel.

Key features that define this product include:

* A permission-based **"Client View" Portal** for agency-client transparency.  
* A **Professional Gamification** system based on uptime and success rates to encourage best practices.  
* A subtle, **Proactive Insight System** to flag potential automation issues without overwhelming the user.

The technical foundation will be built on **Supabase** for secure authentication and a crucial **"Enhanced Telemetry"** system. This system will use a two-way webhook architecture (a "start" webhook and a "completion" webhook) to provide the rich, real-time status updates that power the dashboard's core functionality.

## 

## 

## 

## 

## **Problem Statement**

The core problem is that managing n8n automations is an unnecessarily technical and complex task for the very professional users who rely on them. Currently, operators must often interact with a developer-centric admin panel, use scattered webhook URLs, or execute commands just to monitor and control their workflows1111.

This creates several pain points:

* **High Technical Barrier:** The process is intimidating and requires technical knowledge, preventing non-technical users from confidently managing the automations their work depends on.  
* **Inefficiency and Dependency:** Simple operational tasks, like restarting a failed workflow or checking the status of a batch job, require intervention from a developer, creating a bottleneck and wasting valuable technical resources.  
* **Lack of a Unified View:** There is no single, user-friendly "mission-control" panel to see the health and status of all automations at a glance, which is especially challenging when managing workflows for multiple clients or departments2222.

The impact is a significant loss of efficiency and empowerment. The existing solutions are built for developers to *create* automations, not for operators to *manage* them.

## 

## 

## 

## **Proposed Solution**

The proposed solution is the **Communitee Control Hub**: a single, user-friendly, browser-based panel designed for the safe management and monitoring of all n8n automations. The core of the solution is a clean, intuitive data grid that lists every "helper robot" (workflow) and provides at-a-glance health status, replacing scattered webhook URLs and technical screens3333.

Key features of the proposed solution include:

* **Centralized Control:** A powerful data grid with instant search and filtering capabilities by client, name, or status44444444444444.

* **Simplified Actions:** One-click buttons to run or stop individual automations, as well as bulk buttons to manage filtered groups of workflows5555555555.

* **Enhanced Telemetry:** A two-way webhook system will provide rich, real-time data on automation status, duration, and success, enabling insightful monitoring.  
* **Client View Portal:** A secure, permission-based view for end-clients to see the status of their specific automations, adding significant value for agencies.  
* **Intelligent Insights & Gamification:** A subtle system will provide proactive health insights and use professional gamification based on success rates to encourage best practices.

This solution will succeed because it is purpose-built for the non-technical operator. By abstracting the deep technical complexity of the n8n backend and focusing entirely on the operator's need for clear, simple control, it empowers users and frees up developer time.

## **Target Users**

### **Primary User Segment: The Non-Technical Operator**

* **Profile:** This user could be in Marketing, Operations, or an account manager at an agency. They are tech-savvy in the sense that they are proficient with various SaaS applications, but they are not developers and do not write code.  
* **Current Behaviors & Workflows:** They currently rely on technical team members to check on or restart automations. This dependency creates delays and means they lack direct control over the tools critical to their job.  
* **Needs & Pain Points:** Their primary pain point is the "black box" nature of complex automation systems. They need a simple, visual way to confirm workflows are running correctly and a safe way to perform basic actions (like starting or stopping a job) without fear of breaking something.  
* **Goals:** To become self-sufficient in managing their operational workflows, to have confidence in the system's health at a glance, and to reduce their reliance on developers for routine tasks.

### **Secondary User Segment: The End-Client**

* **Profile:** This is an external client whose business relies on the automations being managed by our primary user (e.g., an agency's customer).  
* **Current Behaviors & Workflows:** They receive periodic status updates via email or have to ask their account manager for information, leading to a lack of real-time visibility.  
* **Needs & Pain Points:** They need transparency and peace of mind. Their pain point is not knowing if the services they are paying for are operating correctly at any given moment.  
* **Goals:** To have on-demand, read-only access to the status of their specific automations, increasing their trust and satisfaction with the service provider.

### **Secondary User Segment: The Developer / Administrator**

* **Profile:** The technical user who initially sets up the n8n workflows and the Communitee Control Hub itself.  
* **Current Behaviors & Workflows:** They are currently the only ones who can safely interact with the n8n backend, making them a bottleneck for simple operational requests.  
* **Needs & Pain Points:** They are frequently interrupted with requests for status updates or to perform simple start/stop tasks. They need a way to safely delegate this operational oversight.  
* **Goals:** To empower non-technical colleagues and clients with a secure management interface, freeing up their own time to focus on building and improving automations rather than just maintaining them.

## 

## 

## 

## 

## 

## **Goals & Success Metrics**

### **Business Objectives**

* **Reduce Developer Overhead:** Decrease developer hours spent on routine operational requests by **50% within 3 months of launch** by empowering operators with self-service tools.  
* **Increase Value for Agencies:** Launch the "Client View" portal as a key value-add feature, aiming for a **25% adoption rate by agency clients within 6 months**.  
* **Improve Operational Efficiency:** Enable operators to manage 100% of routine tasks (starting, stopping, and checking status) without any developer assistance from day one.

### **User Success Metrics**

* **Confidence & Time-to-Value:** A new non-technical operator can confidently perform a core action (run/stop an automation) in **under 5 minutes** during their first session. *(Measured via product analytics).*  
* **Transparency & Trust:** End-clients with portal access log in at least once per month, demonstrably reducing status inquiry emails to the service provider. *(Measured by client login rates and qualitative feedback).*  
* **Time Saved:** Daily operational checks should take an operator **less than 5 minutes**, a significant reduction from previous manual methods. *(Measured via user interviews).*

### **Key Performance Indicators (KPIs)**

* **User Engagement (DAU/MAU):** Achieve **50 Monthly Active Users (MAU)** within 6 months of launch.  
* **Core Feature Adoption:** Target over **100** bulk and individual actions ("Run"/"Stop") performed via the dashboard per week by the end of the second month.  
* **Portal Utilization:** Achieve a **25% adoption rate** among clients who are offered the "Client View" portal within 6 months.

## **MVP Scope**

### **Core Features (Must Have)**

* **Secure Authentication:** Users can log in securely to their workspace using Supabase magic-link or password.  
* **Centralized Automation Grid:** A clean data grid that lists every workflow with its client, status (Running, Stopped, Error), last run time, and average duration. 666666 We will also include columns for a user-friendly "Playful Name/Description" and "Success Rate %" to enhance clarity.

* **Real-time Filtering & Search:** The grid must be instantly filterable by a main search bar (for client or automation name), status toggle-chips, and a client selector drop-down. 777777777777777777777777

* **Individual & Bulk Actions:** Users can trigger or stop individual workflows via row buttons, and perform bulk actions ("Run All Filtered" / "Stop All Filtered") on the visible set of automations. 8888888888888888

* **Light/Dark Theme:** A theme toggle allows users to switch between a light mode and a consistent dark mode with a deep navy-blue gradient background. 999999999

### **Out of Scope for MVP**

To ensure a focused initial launch, the following features will be planned for future phases:

* **Health & Logs Page:** A dedicated page to view detailed, step-by-step execution logs and analyze aggregated health KPIs. 10

* **Advanced Analytics:** Time-series charts and the ability to export data to CSV. 11

* **Notification System:** A system for sending email or Slack notifications for repeated workflow failures.  
* **In-App Error Resolution:** The ability to debug or edit the n8n workflows from within the dashboard itself.  
* **Client View Portal & Gamification:** The client portal and the professional gamification system (success scores, etc.) are planned as fast-follow features after the core MVP is stable.

### **MVP Success Criteria**

* The MVP is successful when a non-technical operator can use it to confidently monitor the status of all their automations and perform run/stop actions without developer assistance.  
* All core features (grid, filtering, actions, themes) are fully functional, stable, and receive positive feedback from initial users.  
* The "Enhanced Telemetry" (two-way webhook system) is successfully implemented and provides accurate, real-time data to the dashboard.

## **Post-MVP Vision**

### **Phase 2 Features**

Once the MVP is stable, we will focus on these high-value enhancements:

* Client View Portal (with Granular Permissions):  
  The top priority is to build the secure, permission-based portal for end-clients. This feature will be more than just a single view; it will include configurable permission levels to provide flexibility for the agency.  
  * **Admin-Defined Roles:** The primary user (the agency) can define access tiers for their clients.  
  * **Tier 1: "Read-Only Access":** The default tier, allowing clients to view the status, run history, and success rates of only their assigned automations.  
  * **Tier 2: "Action-Enabled Access":** For trusted clients, permission can be granted to use the "Run" and "Stop" buttons for their own workflows.  
* Professional Gamification (with Reliability Score):  
  We will introduce a gamification system to encourage best practices.  
  * **"Reliability Score":** The system will calculate a score for each automation based on a weighted algorithm of its uptime (successful runs vs. errors) and run frequency over a 30-day rolling period.  
  * **Leaderboard (Optional):** A private leaderboard could rank automations by their Reliability Score, helping operators quickly identify which ones are most stable and which need attention.

### **Long-term Vision**

Looking further ahead, the platform will evolve from a control panel into an intelligence hub.

* **Health & Logs Page:** Introduce a dedicated Health dashboard with trends and detailed, step-by-step execution logs for easier troubleshooting. 12

* Advanced Analytics (to Answer Key Questions):  
  The goal of the advanced analytics feature is to provide actionable insights by answering key operational questions, such as:  
  * **Performance Analysis:** Which automations are the slowest on average? Which ones have the highest resource consumption?  
  * **Error Analysis:** Which automations are the most error-prone? Are there patterns to the failures?  
  * **Usage Patterns:** What are our busiest times of day or week? Which automations are triggered most frequently?  
* **Intelligent Notifications:** A configurable system to send email or Slack notifications if a specific workflow fails repeatedly.

### **Expansion Opportunities**

The platform's architecture should allow for future strategic integrations.

* **Priority 1: Ticketing Systems (e.g., Jira, Asana):** To automatically create a support ticket when a critical automation fails, streamlining the resolution process.  
* **Priority 2: Communication Platforms (e.g., Slack, Microsoft Teams):** To send rich, configurable alerts directly into team channels, moving beyond simple email.  
* **Priority 3: Business Intelligence Tools (e.g., Tableau, Power BI):** To allow for the export of the platform's analytics data for inclusion in broader company dashboards.

## 

## 

## **Technical Considerations**

### **Platform Requirements**

* **Target Platforms:** This will be a responsive, browser-based web application.  
* **Browser/OS Support:** The application should support the latest versions of modern browsers (Chrome, Firefox, Safari, Edge).  
* **Performance Requirements:** The UI, particularly the data grid, must remain fast and responsive with real-time filtering, even when managing hundreds of automations.  
* **Scalability:** The system architecture must be designed to support up to **1,000 automations** and their corresponding real-time status updates with minimal UI latency. The design should have a clear path to scale to 10,000+ automations in future phases.  
* **Availability:** The service should be designed for high availability, targeting a **99.9% uptime**.

### **Technology Preferences**

* **Authentication:** The project will use Supabase for secure user login via magic-link or password.  
* **Enhanced Telemetry Data Flow:** A foundational requirement is the two-way webhook architecture. The "completion" webhook from n8n is expected to provide a JSON payload containing at least: final\_status (e.g., 'success', 'error'), error\_message (if applicable), execution\_time\_ms, and steps\_completed.  
* **Frontend & Backend Frameworks:** To be determined by the Architect, but should be modern and suitable for the project's requirements.

### **Architecture Considerations**

* **Repository & Service Architecture:** The specific structure (e.g., Monorepo vs. Polyrepo, Monolith vs. Microservices) will be determined by the Architect.  
* **Integration Requirements:** The architecture must be built around a robust integration with n8n's webhook system.  
* **Security:** The system must securely handle sensitive information. Specifically, all credentials such as webhook URLs and client API keys **must be encrypted at rest** in the database.  
* **Internationalization (i18n):** The architecture should be designed to support multiple languages in the future. Text displayed in the UI should not be hardcoded and should be managed via a localization framework to facilitate this.

## **Constraints & Assumptions**

### **Constraints**

* **Management-Only Tool:** Error resolution and workflow editing must happen outside this application. It is designed for management and monitoring only.  
* **Telemetry Dependency:** The dashboard's core functionality is critically dependent on the "Enhanced Telemetry" system receiving detailed data from n8n.  
* **Throttling Mechanism:** All bulk actions must adhere to the defined throttling mechanism: a maximum of 200 workflows per batch with a 4-minute delay between batches.

### **Key Assumptions**

* **Webhook Feasibility:** It is assumed to be technically feasible to implement a reliable, two-way webhook system with n8n.  
* **Load Handling:** It is assumed that the chosen infrastructure (e.g., Supabase) can handle potential spikes in write operations resulting from simultaneous webhook completions.  
* **UI Preference:** It is assumed that non-technical users will prefer a clean, data-grid view over a more illustrative, card-based UI for this professional tool.

## **Risks & Open Questions**

### **Key Risks**

* **Technical Risk: "Enhanced Telemetry" Feasibility:** The entire project depends on getting rich data back from n8n. If this is not technically feasible or reliable, the project is at risk.  
  * **Mitigation:** The first development task will be a **Technical Spike** to create a Proof of Concept (PoC) validating the two-way webhook communication with n8n.  
* **User Risk: Misuse of Bulk Actions:** A non-technical user could accidentally stop critical business workflows.  
  * **Mitigation:** Implement a clear and descriptive **confirmation dialog** that specifies exactly which automations will be affected before a bulk action is executed.  
* **Scope Risk: Client Portal Complexity:** The "Client View Portal" is a significant feature whose complexity around permissions and security could be underestimated.  
  * **Mitigation:** A separate, focused **discovery and design phase** will be conducted for the Client View Portal before its development begins post-MVP.

### **Open Questions**

* What is the most effective and resilient technical approach for implementing the bulk action throttling queue? (For the Architect)  
* What is the best method for implementing the "Stale Job Detection" timeout? (e.g., a fixed timeout, or one dynamically calculated based on the automation's average run time?) (For the Architect)

## **Next Steps**

### **Immediate Actions**

1. Review and get final approval for this Project Brief.  
2. Save this document as docs/project-brief.md in the project repository.  
3. Initiate the next phase of the QQ-Protocol: PRD Generation with the Product Manager.

### **PM Handoff**

This Project Brief provides the full context for the Communitee Control Hub. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.