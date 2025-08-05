# Quest {{QUEST_ID}}: {{QUEST_TITLE}}

<!-- 
QUEST TEMPLATE USAGE INSTRUCTIONS:
1. Replace all {{PLACEHOLDER}} variables with project-specific content
2. Remove sections that don't apply to your quest type
3. Ensure all markdown follows PR-001 through PR-007 prevention rules
4. Validate with: npm run validate:markdown-quality
5. Update quest dependencies in parent journey documentation
-->

## Status: {{STATUS}}

<!-- 
STATUS OPTIONS:
- Draft: Initial planning phase
- Approved: Ready for implementation
- In Progress: Currently being worked on
- Completed: Successfully finished
- Blocked: Waiting for dependencies
- Cancelled: No longer needed
-->

## Quest

* As a {{USER_ROLE}},
* I want {{DESIRED_FUNCTIONALITY}},
* so that {{BUSINESS_VALUE}}.

<!-- 
USER STORY GUIDELINES:
- USER_ROLE: developer, user, operator, admin, etc.
- DESIRED_FUNCTIONALITY: Clear, specific feature or capability
- BUSINESS_VALUE: Why this matters to the user/business
-->

## Acceptance Criteria (ACs)

1. {{ACCEPTANCE_CRITERION_1}}
2. {{ACCEPTANCE_CRITERION_2}}
3. {{ACCEPTANCE_CRITERION_3}}
4. {{ACCEPTANCE_CRITERION_4}}
5. {{ACCEPTANCE_CRITERION_5}}

<!-- 
ACCEPTANCE CRITERIA GUIDELINES:
- Use numbered list format
- Each criterion should be testable and measurable
- Focus on WHAT, not HOW
- Include both functional and non-functional requirements
- Consider edge cases and error scenarios
-->

## Tasks / Subtasks

* [ ] {{TASK_1}}
* [ ] {{TASK_2}}
* [ ] {{TASK_3}}
* [ ] {{TASK_4}}
* [ ] {{TASK_5}}

<!-- 
TASK GUIDELINES:
- Use checkbox format for tracking progress
- Break down into implementable chunks (20-30 min each)
- Include technical implementation details
- Specify file paths and component names where applicable
- Order tasks logically by dependencies
-->

## Dev Notes

**Prerequisite:** {{PREREQUISITE_QUESTS}}

**Architecture:** {{ARCHITECTURAL_GUIDANCE}}

**{{TECHNOLOGY_STACK}}:** {{TECHNOLOGY_SPECIFIC_NOTES}}

**UI/UX:** {{UI_UX_REQUIREMENTS}}

<!-- 
DEV NOTES GUIDELINES:
- Prerequisites: List dependent quests/features that must be complete
- Architecture: High-level technical approach and patterns
- Technology Stack: Framework-specific implementation notes
- UI/UX: Design system requirements and component specifications
-->

## Testing

{{TESTING_APPROACH}}

**{{TEST_TYPE_1}} ({{TEST_FRAMEWORK}}):**

```text
* {{TEST_CASE_1}}
* {{TEST_CASE_2}}
* {{TEST_CASE_3}}
```

**{{TEST_TYPE_2}} ({{TEST_FRAMEWORK}}):**

```text
* {{TEST_CASE_4}}
* {{TEST_CASE_5}}
* {{TEST_CASE_6}}
```

<!-- 
TESTING GUIDELINES:
- TESTING_APPROACH: Brief description of testing strategy
- TEST_TYPE: Component Tests, E2E Tests, Integration Tests, Manual Tests
- TEST_FRAMEWORK: Vitest, Playwright, Jest, etc.
- Include accessibility testing where applicable
- Specify performance requirements if relevant
-->

## Manual Test Steps

1. {{MANUAL_TEST_STEP_1}}
2. {{MANUAL_TEST_STEP_2}}
3. {{MANUAL_TEST_STEP_3}}
4. {{MANUAL_TEST_STEP_4}}
5. {{MANUAL_TEST_STEP_5}}

<!-- 
MANUAL TESTING GUIDELINES:
- Provide step-by-step user journey
- Include expected outcomes for each step
- Cover both happy path and error scenarios
- Specify browser/device requirements if applicable
- Include accessibility testing steps
-->

---

<!-- 
QUEST TEMPLATE METADATA:
- Template Version: 1.0
- Compatible with: A.V.A.R.I.C.E. Protocol
- Markdown Quality: PR-001 through PR-007 compliant
- Created: 2025-08-05
- Last Updated: 2025-08-05
-->

<!-- 
COMMON QUEST PATTERNS:

FRONTEND QUEST PATTERN:
- Focus on UI components and user interactions
- Include component tests and E2E tests
- Specify shadcn/ui or design system requirements
- Include accessibility testing

BACKEND QUEST PATTERN:
- Focus on API endpoints and data processing
- Include integration tests and unit tests
- Specify database schema changes
- Include security and performance requirements

INFRASTRUCTURE QUEST PATTERN:
- Focus on deployment and configuration
- Include deployment verification steps
- Specify environment requirements
- Include monitoring and logging setup

INTEGRATION QUEST PATTERN:
- Focus on connecting systems/services
- Include end-to-end integration tests
- Specify API contracts and data flows
- Include error handling and retry logic
-->

<!-- 
PLACEHOLDER REFERENCE:

REQUIRED PLACEHOLDERS:
{{QUEST_ID}} - Unique quest identifier (e.g., "1.1", "2.3")
{{QUEST_TITLE}} - Descriptive quest name
{{STATUS}} - Current quest status
{{USER_ROLE}} - Target user type
{{DESIRED_FUNCTIONALITY}} - What the user wants
{{BUSINESS_VALUE}} - Why it matters
{{ACCEPTANCE_CRITERION_X}} - Testable success criteria
{{TASK_X}} - Implementation tasks
{{PREREQUISITE_QUESTS}} - Dependencies
{{ARCHITECTURAL_GUIDANCE}} - Technical approach
{{TECHNOLOGY_STACK}} - Framework/library name
{{TECHNOLOGY_SPECIFIC_NOTES}} - Implementation details
{{UI_UX_REQUIREMENTS}} - Design specifications
{{TESTING_APPROACH}} - Testing strategy
{{TEST_TYPE_X}} - Type of testing
{{TEST_FRAMEWORK}} - Testing tool
{{TEST_CASE_X}} - Specific test scenarios
{{MANUAL_TEST_STEP_X}} - User testing steps

OPTIONAL PLACEHOLDERS:
{{PROJECT_NAME}} - Project identifier
{{COMPONENT_PATH}} - File system location
{{API_ENDPOINT}} - Service URL
{{DATABASE_TABLE}} - Data model
{{ENVIRONMENT}} - Deployment target
-->
