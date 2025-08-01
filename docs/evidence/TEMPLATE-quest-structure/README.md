# Quest Evidence Directory Template

## Overview

This template provides the standardized directory structure for A.V.A.R.I.C.E. Protocol
evidence collection. All quest evidence **MUST** follow this exact structure to ensure
consistency and compliance.

## Directory Structure

```text
docs/evidence/quest-{quest-number}/
├── README.md                     # Quest-specific evidence overview
├── phase-evidence/               # Evidence from each of the 9 phases
│   ├── phase-1-strategic-planning/
│   │   ├── execution-logs/
│   │   ├── validation-results/
│   │   ├── screenshots/
│   │   └── neo4j-confirmations/
│   ├── phase-2-contextual-grounding/
│   │   ├── research-synthesis/
│   │   ├── knowledge-graph/
│   │   ├── mcp-execution-logs/
│   │   └── context-validation/
│   ├── phase-3-expert-council/
│   │   ├── expert-research/
│   │   ├── debate-transcripts/
│   │   ├── consensus-documentation/
│   │   └── decision-validation/
│   ├── phase-4-implementation/
│   │   ├── code-artifacts/
│   │   ├── compilation-logs/
│   │   ├── integration-tests/
│   │   └── functionality-validation/
│   ├── phase-5-multi-layer-verification/
│   │   ├── static-analysis/
│   │   ├── formal-verification/
│   │   ├── quality-assurance/
│   │   └── agent-coordination/
│   ├── phase-6-architectural-review/
│   │   ├── compliance-assessment/
│   │   ├── design-validation/
│   │   ├── performance-benchmarks/
│   │   └── security-validation/
│   ├── phase-7-protocol-validation/
│   │   ├── protocol-compliance/
│   │   ├── system-integration/
│   │   ├── end-to-end-testing/
│   │   └── complete-audit-trail/
│   ├── phase-8-knowledge-memorization/
│   │   ├── knowledge-extraction/
│   │   ├── memory-consolidation/
│   │   ├── neo4j-storage/
│   │   └── institutional-memory/
│   └── phase-9-autonomous-termination/
│       ├── termination-decision/
│       ├── system-shutdown/
│       ├── next-quest-preparation/
│       └── final-validation/
├── agent-reports/                # Agent-specific reports and outputs
│   ├── architect-agent/
│   │   ├── strategic-plans/
│   │   ├── architectural-reviews/
│   │   └── design-decisions/
│   ├── coder-agent/
│   │   ├── implementation-reports/
│   │   ├── code-generation/
│   │   └── integration-results/
│   ├── qa-agent/
│   │   ├── test-reports/
│   │   ├── quality-assessments/
│   │   └── validation-results/
│   ├── logician-agent/
│   │   ├── formal-proofs/
│   │   ├── logical-validation/
│   │   └── verification-results/
│   └── scribe-agent/
│       ├── documentation/
│       ├── knowledge-capture/
│       └── institutional-memory/
├── quality-gates/               # Quality gate validation results
│   ├── typescript-validation/
│   │   ├── compilation-results/
│   │   ├── type-checking/
│   │   └── strict-mode-compliance/
│   ├── eslint-compliance/
│   │   ├── linting-results/
│   │   ├── code-quality/
│   │   └── style-compliance/
│   ├── test-execution/
│   │   ├── unit-tests/
│   │   ├── integration-tests/
│   │   └── e2e-tests/
│   └── security-validation/
│       ├── vulnerability-scans/
│       ├── security-assessments/
│       └── compliance-checks/
└── memorization/               # Neo4j memory storage confirmations
    ├── knowledge-graph-storage/
    │   ├── data-model-validation/
    │   ├── cypher-queries/
    │   └── storage-confirmations/
    ├── memory-handoff-logs/
    │   ├── phase-transitions/
    │   ├── agent-handoffs/
    │   └── context-preservation/
    └── institutional-memory/
        ├── organizational-knowledge/
        ├── pattern-recognition/
        └── lessons-learned/
```

## Usage Instructions

### 1. Quest Directory Creation

- Replace `{quest-number}` with actual quest number (e.g., `quest-1.1`, `quest-2.3`)
- Use format: `quest-{major}.{minor}` (NO combined quests like `quest-2.1-2.2`)

### 2. Evidence Storage Requirements

- **ALL** evidence must be stored in appropriate subdirectories
- **NO** evidence storage outside the quest-specific structure
- **AUTOMATIC** validation during A.V.A.R.I.C.E. Protocol execution

### 3. Directory Creation Process

1. Copy this template directory structure
2. Rename to appropriate quest number
3. Create all required subdirectories
4. Add quest-specific README.md with overview

### 4. Validation Requirements

- Evidence paths validated during protocol execution
- Directory structure compliance enforced
- Zero tolerance for deviations from this template

## Compliance Notes

- This structure is **MANDATORY** for all A.V.A.R.I.C.E. Protocol executions
- Deviations from this structure will trigger immediate stop-work orders
- All agents must reference quest-specific evidence paths
- Neo4j integration must point to quest-specific directories

## Template Version

- Version: 1.0
- Last Updated: 2025-01-08
- Compliance: A.V.A.R.I.C.E. Protocol Standards
