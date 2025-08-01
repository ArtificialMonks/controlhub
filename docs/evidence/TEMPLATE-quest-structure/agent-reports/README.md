# Agent Reports Directory

## Overview

This directory contains agent-specific reports and outputs from all A.V.A.R.I.C.E. Protocol agents.

## Agent-Specific Structure

### Architect Agent (`architect-agent/`)

**Primary Phases**: 1, 3, 6, 9
**Capabilities**: Strategic planning, architecture analysis, expert council coordination

Subdirectories:

- `strategic-plans/`: Strategic execution plans and task breakdowns
- `architectural-reviews/`: Architectural compliance assessments
- `design-decisions/`: Design pattern decisions and rationale

### Coder Agent (`coder-agent/`)

**Primary Phases**: 4, 7, 8
**Capabilities**: Code generation, implementation, integration

Subdirectories:

- `implementation-reports/`: Code implementation reports and metrics
- `code-generation/`: Generated code artifacts and documentation
- `integration-results/`: Integration testing and validation results

### QA Agent (`qa-agent/`)

**Primary Phases**: 5, 7
**Capabilities**: Quality assurance, testing, validation

Subdirectories:

- `test-reports/`: Comprehensive testing reports and results
- `quality-assessments/`: Quality gate assessments and metrics
- `validation-results/`: Validation results and compliance evidence

### Logician Agent (`logician-agent/`)

**Primary Phases**: 5, 7
**Capabilities**: Formal verification, logical validation, mathematical proofs

Subdirectories:

- `formal-proofs/`: Mathematical proofs and formal verification results
- `logical-validation/`: Logical consistency validation reports
- `verification-results/`: Comprehensive verification results and confidence scores

### Scribe Agent (`scribe-agent/`)

**Primary Phases**: 8, 9
**Capabilities**: Documentation, knowledge capture, institutional memory

Subdirectories:

- `documentation/`: Comprehensive documentation artifacts
- `knowledge-capture/`: Knowledge extraction and pattern recognition
- `institutional-memory/`: Institutional memory documentation and transfer

## Report Requirements

### Content Standards

- All reports must include agent identification and version
- All reports must include timestamp and quest context
- All reports must include concrete evidence and metrics
- All reports must support audit trail requirements

### Format Standards

- Use Markdown format for all text reports
- Include structured data in JSON format where applicable
- Include screenshots and visual evidence where relevant
- Maintain consistent naming conventions

### Integration Requirements

- All reports must reference quest-specific context
- All reports must integrate with Neo4j memory storage
- All reports must support cross-agent coordination
- All reports must maintain evidence chain integrity

## Agent Memory Patterns

### Memory Retention Policies

- **Architect Agent**: Core (365 days), Semantic (365 days), Procedural (365 days), Knowledge Vault (730 days)
- **Coder Agent**: Core (180 days), Procedural (365 days), Resource (90 days)
- **QA Agent**: Procedural (180 days), Episodic (90 days), Resource (60 days)
- **Logician Agent**: Semantic (365 days), Knowledge Vault (365 days), Procedural (180 days)
- **Scribe Agent**: All 6 memory types with institutional storage mandate (365-730 days)

### Cross-Agent Coordination

- All agent reports must support handoff procedures
- All agent reports must maintain context continuity
- All agent reports must enable autonomous transitions
- All agent reports must preserve institutional knowledge
