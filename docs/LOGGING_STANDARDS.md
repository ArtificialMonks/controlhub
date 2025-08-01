# Logging Standards for A.V.A.R.I.C.E. Protocol

## Overview

This document defines comprehensive logging standards for the A.V.A.R.I.C.E. Protocol, integrating with the standardized quest-specific evidence storage structure and existing application logging infrastructure.

## Logging Architecture

### Primary Logging Locations

#### 1. Application Logs (`/logs/`)
**Purpose**: Runtime application logs and system operations
- `app.log`: General application logs
- `error.log`: Error logs and exceptions
- `access.log`: Access logs and request tracking

#### 2. Evidence Logs (`/docs/evidence/quest-{quest-number}/`)
**Purpose**: A.V.A.R.I.C.E. Protocol execution evidence and audit trails
- `phase-evidence/`: Phase-specific execution logs
- `agent-reports/`: Agent-specific operation logs
- `quality-gates/`: Quality validation and compliance logs
- `memorization/`: Neo4j operations and memory storage logs

### Integration with Existing Logger

The existing logger service (`src/lib/monitoring/logger.ts`) is extended to support A.V.A.R.I.C.E. Protocol evidence logging:

```typescript
import { Logger, LogLevel } from '@/lib/monitoring/logger'

// A.V.A.R.I.C.E. Protocol Logger Extension
export class AvariceProtocolLogger extends Logger {
  constructor(
    private questId: string,
    private phase: string,
    private agent: string,
    component?: string
  ) {
    super(component)
  }

  // Evidence logging with quest-specific paths
  async logEvidence(
    category: 'phase-evidence' | 'agent-reports' | 'quality-gates' | 'memorization',
    subcategory: string,
    evidence: any,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const evidencePath = `docs/evidence/${this.questId}/${category}/${subcategory}`
    const logEntry = {
      timestamp: new Date().toISOString(),
      questId: this.questId,
      phase: this.phase,
      agent: this.agent,
      category,
      subcategory,
      evidence,
      metadata,
      evidencePath
    }
    
    // Log to both application logs and evidence directory
    this.info('Evidence logged', logEntry)
    await this.writeEvidenceFile(evidencePath, logEntry)
  }
}
```

## Logging Standards by Category

### Phase Evidence Logging

#### Phase 1: Strategic Planning
**Location**: `docs/evidence/quest-{quest-number}/phase-evidence/phase-1-strategic-planning/execution-logs/`

**Required Logs**:
- Task breakdown execution logs
- Strategic planning validation results
- Agent capability verification logs
- Neo4j storage operation logs

**Log Format**:
```json
{
  "timestamp": "2025-01-08T12:00:00Z",
  "questId": "quest-1.2",
  "phase": "phase-1-strategic-planning",
  "agent": "architect-agent",
  "operation": "strategic-planning-execution",
  "status": "success",
  "details": {
    "tasksCreated": 8,
    "validationScore": 95.5,
    "neo4jOperations": ["validate_data_model_neo4j"],
    "executionTime": 1847
  },
  "evidence": {
    "taskManagerScreenshots": ["task-breakdown-complete.png"],
    "validationResults": ["strategic-plan-validation.json"],
    "neo4jConfirmations": ["data-model-validation.json"]
  }
}
```

#### Phase 5: Multi-Layer Verification
**Location**: `docs/evidence/quest-{quest-number}/phase-evidence/phase-5-multi-layer-verification/`

**Required Logs**:
- Static analysis execution logs (`static-analysis/`)
- Formal verification logs (`formal-verification/`)
- Quality assurance logs (`quality-assurance/`)
- Agent coordination logs (`agent-coordination/`)

#### Phase 8: Knowledge Memorization
**Location**: `docs/evidence/quest-{quest-number}/memorization/`

**Required Logs**:
- Knowledge extraction logs (`knowledge-extraction/`)
- Memory consolidation logs (`memory-consolidation/`)
- Neo4j storage logs (`neo4j-storage/`)
- Institutional memory logs (`institutional-memory/`)

### Agent-Specific Logging

#### Architect Agent
**Location**: `docs/evidence/quest-{quest-number}/agent-reports/architect-agent/`

**Log Categories**:
- Strategic planning decisions and rationale
- Architectural review assessments
- Expert council coordination logs
- Design pattern validation results

#### Coder Agent
**Location**: `docs/evidence/quest-{quest-number}/agent-reports/coder-agent/`

**Log Categories**:
- Code generation execution logs
- Implementation validation results
- Integration testing logs
- Bug fixing and optimization logs

#### QA Agent
**Location**: `docs/evidence/quest-{quest-number}/agent-reports/qa-agent/`

**Log Categories**:
- Test execution results and coverage
- Quality gate validation logs
- Performance testing results
- Security validation logs

### Quality Gates Logging

#### TypeScript Validation
**Location**: `docs/evidence/quest-{quest-number}/quality-gates/typescript-validation/`

**Required Logs**:
```bash
# Compilation results
npx tsc --noEmit --strict > compilation-results/tsc-validation-$(date +%Y%m%d-%H%M%S).log 2>&1

# Type checking results
npx tsc --noEmit --strict --listFiles > type-checking/type-validation-$(date +%Y%m%d-%H%M%S).log 2>&1
```

#### ESLint Compliance
**Location**: `docs/evidence/quest-{quest-number}/quality-gates/eslint-compliance/`

**Required Logs**:
```bash
# ESLint validation
npx eslint src --ext .ts --format json > linting-results/eslint-results-$(date +%Y%m%d-%H%M%S).json

# Code quality metrics
npx eslint src --ext .ts --format unix > code-quality/eslint-quality-$(date +%Y%m%d-%H%M%S).log
```

### Neo4j Memory Logging

#### Knowledge Graph Storage
**Location**: `docs/evidence/quest-{quest-number}/memorization/knowledge-graph-storage/`

**Required Logs**:
- Data model validation results
- Cypher query execution logs
- Storage confirmation evidence
- Relationship validation logs

**Log Format**:
```json
{
  "timestamp": "2025-01-08T12:00:00Z",
  "questId": "quest-1.2",
  "operation": "neo4j-storage",
  "tool": "validate_data_model_neo4j",
  "status": "success",
  "dataModel": {
    "nodes": 5,
    "relationships": 8,
    "validationScore": 100
  },
  "evidence": {
    "validationResults": "data-model-validation-20250108-120000.json",
    "cypherQueries": "storage-queries-20250108-120000.cypher",
    "storageConfirmation": "neo4j-storage-confirmation-20250108-120000.json"
  }
}
```

## Logging Implementation Guidelines

### Log Level Standards
- **DEBUG**: Detailed execution flow and variable states
- **INFO**: Normal operation events and milestones
- **WARN**: Potential issues that don't stop execution
- **ERROR**: Errors that require immediate attention

### Timestamp Standards
- Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Include timezone information
- Maintain consistent timestamp format across all logs

### Quest Context Requirements
All logs must include:
- `questId`: Quest identifier (e.g., "quest-1.2")
- `phase`: Current protocol phase
- `agent`: Responsible agent identifier
- `timestamp`: ISO 8601 timestamp
- `evidencePath`: Path to related evidence artifacts

### Error Handling Standards
```typescript
// Error logging with quest context
try {
  await executePhaseOperation()
} catch (error) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    questId: this.questId,
    phase: this.phase,
    agent: this.agent,
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    },
    context: {
      operation: 'phase-execution',
      evidencePath: `docs/evidence/${this.questId}/phase-evidence/${this.phase}/`
    }
  }
  
  this.error('Phase execution failed', errorLog)
  throw error
}
```

## Audit Trail Requirements

### Evidence Chain Integrity
- All logs must maintain evidence chain integrity
- Cross-reference logs with evidence artifacts
- Ensure traceability from logs to concrete evidence
- Validate log completeness during protocol execution

### Compliance Documentation
- All logs must support audit trail requirements
- Include sufficient detail for compliance verification
- Maintain logs for required retention periods
- Ensure logs are tamper-evident and verifiable

### Integration with Monitoring
- Integrate with existing monitoring infrastructure
- Support real-time log analysis and alerting
- Enable log aggregation and search capabilities
- Maintain performance monitoring integration

## Validation and Enforcement

### Automated Validation
- Validate log format compliance during protocol execution
- Ensure all required logs are generated
- Verify evidence path consistency
- Check log completeness and integrity

### Quality Assurance
- Regular log quality audits
- Compliance verification procedures
- Performance impact assessment
- Security and privacy validation

This logging standard ensures comprehensive evidence collection while integrating seamlessly with the existing application logging infrastructure and the new quest-specific evidence storage structure.
