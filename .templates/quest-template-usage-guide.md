# Quest Template Usage Guide

Comprehensive guide for using the project-agnostic quest template to create consistent, high-quality quest documentation
across different projects and domains.

## Overview

The quest template (`quest-template.md`) provides a standardized structure for creating quest documentation that follows
the proven patterns from the Communitee Control Hub project while remaining adaptable to any project type.

## Template Structure Analysis

### Core Sections Identified

Based on analysis of existing quest files, the template includes these standardized sections:

* **Quest Header**: Title with unique identifier
* **Status Tracking**: Current quest state
* **User Story**: As-a/I-want/So-that format
* **Acceptance Criteria**: Numbered, testable requirements
* **Tasks/Subtasks**: Checkbox-based implementation breakdown
* **Dev Notes**: Technical guidance and prerequisites
* **Testing**: Comprehensive testing strategy
* **Manual Test Steps**: User validation procedures

### Structural Patterns

* **Consistent Numbering**: Quest IDs follow `X.Y` format (e.g., "1.2", "2.1")
* **Status Values**: Draft, Approved, In Progress, Completed, Blocked, Cancelled
* **Checkbox Tasks**: All implementation tasks use `* [ ]` format for progress tracking
* **Code Blocks**: All code examples specify language for syntax highlighting
* **Line Length**: Maximum 120 characters per line (PR-005 compliance)

## Placeholder Variables

### Required Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{QUEST_ID}}` | Unique quest identifier | "2.1", "3.4" |
| `{{QUEST_TITLE}}` | Descriptive quest name | "Implement Toolbar & Filter UI" |
| `{{STATUS}}` | Current quest status | "Approved", "In Progress" |
| `{{USER_ROLE}}` | Target user type | "developer", "operator", "admin" |
| `{{DESIRED_FUNCTIONALITY}}` | What the user wants | "see all filter controls" |
| `{{BUSINESS_VALUE}}` | Why it matters | "prepare to narrow down automations" |

### Content Placeholders

| Placeholder | Description | Usage |
|-------------|-------------|-------|
| `{{ACCEPTANCE_CRITERION_X}}` | Testable success criteria | Replace X with numbers 1-5 |
| `{{TASK_X}}` | Implementation tasks | Specific, actionable items |
| `{{PREREQUISITE_QUESTS}}` | Dependencies | "Journey 1 must be complete" |
| `{{ARCHITECTURAL_GUIDANCE}}` | Technical approach | Framework patterns, design principles |
| `{{TECHNOLOGY_STACK}}` | Framework/library name | "Next.js", "React", "TypeScript" |

### Testing Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{TESTING_APPROACH}}` | Testing strategy | "Component and E2E tests required" |
| `{{TEST_TYPE_X}}` | Type of testing | "Component Tests", "E2E Tests" |
| `{{TEST_FRAMEWORK}}` | Testing tool | "Vitest", "Playwright", "Jest" |
| `{{TEST_CASE_X}}` | Specific test scenarios | "Verify controls are rendered" |

## Usage Instructions

### Step 1: Copy Template

```bash
cp .templates/quest-template.md docs/journeys/quests/[journey]/[quest-id]-quest.md
```

### Step 2: Replace Placeholders

1. **Quest Identification**
   * Replace `{{QUEST_ID}}` with unique identifier
   * Replace `{{QUEST_TITLE}}` with descriptive name
   * Set `{{STATUS}}` to appropriate value

2. **User Story**
   * Define `{{USER_ROLE}}` (developer, user, operator, admin)
   * Specify `{{DESIRED_FUNCTIONALITY}}` clearly
   * Articulate `{{BUSINESS_VALUE}}` concisely

3. **Acceptance Criteria**
   * Replace `{{ACCEPTANCE_CRITERION_X}}` with testable requirements
   * Ensure each criterion is measurable
   * Include both functional and non-functional requirements

4. **Implementation Tasks**
   * Replace `{{TASK_X}}` with specific, actionable items
   * Break down into 20-30 minute chunks
   * Include file paths and component names

5. **Technical Guidance**
   * Set `{{PREREQUISITE_QUESTS}}` dependencies
   * Define `{{ARCHITECTURAL_GUIDANCE}}` approach
   * Specify `{{TECHNOLOGY_STACK}}` requirements

6. **Testing Strategy**
   * Define `{{TESTING_APPROACH}}` methodology
   * Specify `{{TEST_TYPE_X}}` and `{{TEST_FRAMEWORK}}`
   * Detail `{{TEST_CASE_X}}` scenarios

### Step 3: Remove Unused Sections

* Delete placeholder sections that don't apply
* Remove unused comment blocks
* Clean up empty placeholder variables

### Step 4: Validate Quality

```bash
# Validate markdown quality
npx markdownlint "docs/journeys/quests/[journey]/[quest-id]-quest.md"

# Check spelling
npx cspell "docs/journeys/quests/[journey]/[quest-id]-quest.md"

# Validate A.V.A.R.I.C.E. Protocol compliance
npm run validate:markdown-quality
```

## Quest Type Patterns

### Frontend Quest Pattern

* Focus on UI components and user interactions
* Include component tests and E2E tests
* Specify design system requirements (shadcn/ui)
* Include accessibility testing requirements

### Backend Quest Pattern

* Focus on API endpoints and data processing
* Include integration tests and unit tests
* Specify database schema changes
* Include security and performance requirements

### Infrastructure Quest Pattern

* Focus on deployment and configuration
* Include deployment verification steps
* Specify environment requirements
* Include monitoring and logging setup

### Integration Quest Pattern

* Focus on connecting systems/services
* Include end-to-end integration tests
* Specify API contracts and data flows
* Include error handling and retry logic

## Quality Standards

### Markdown Compliance

* **PR-001**: Blank lines around headings
* **PR-002**: Blank lines around lists
* **PR-003**: No multiple blank lines
* **PR-004**: Blank lines around code fences
* **PR-005**: Line length under 120 characters
* **PR-006**: Language specified for code blocks
* **PR-007**: Unique headings within document

### Content Standards

* **Clear User Stories**: Follow As-a/I-want/So-that format
* **Testable Criteria**: Each AC must be measurable
* **Actionable Tasks**: Specific implementation steps
* **Comprehensive Testing**: Multiple test types included
* **Technical Guidance**: Clear prerequisites and architecture notes

## Common Patterns

### Task Breakdown Example

```markdown
* [ ] Create component at `/src/components/features/[feature]/[Component].tsx`
* [ ] Implement state management using `useState` or Zustand store
* [ ] Add `shadcn/ui` components: `<Input>`, `<Button>`, `<Select>`
* [ ] Integrate with existing data flow from parent component
* [ ] Add component to main page layout
```

### Testing Example

```markdown
**Component Tests (Vitest):**

* Verify all controls are rendered correctly
* Test state management and user interactions
* Include accessibility checks with `jest-axe`
* Mock external dependencies appropriately

**E2E Tests (Playwright):**

* Test complete user workflow end-to-end
* Verify integration with backend services
* Test error scenarios and edge cases
* Include cross-browser compatibility checks
```

## Validation Checklist

* [ ] All placeholder variables replaced
* [ ] Quest ID follows numbering convention
* [ ] User story follows As-a/I-want/So-that format
* [ ] Acceptance criteria are testable and measurable
* [ ] Tasks are specific and actionable
* [ ] Prerequisites clearly identified
* [ ] Testing strategy comprehensive
* [ ] Manual test steps detailed
* [ ] Markdown quality validation passed
* [ ] Spell check validation passed
* [ ] A.V.A.R.I.C.E. Protocol compliance verified

---

**Template Integrity**: This usage guide ensures consistent, high-quality quest documentation across all projects while
maintaining compatibility with A.V.A.R.I.C.E. Protocol standards and markdown quality requirements.
