
CREATE (execution:TestExecution {
  id: 'analyze:all-1-test-integration-1754131393388',
  scriptName: 'analyze:all',
  phase: 1,
  questId: 'test-integration',
  status: 'failed',
  executionTime: 242,
  timestamp: datetime('2025-08-02T10:39:48.254Z'),
  errorMessage: 'Command failed: npm run analyze:all
npm warn using --force Recommended protections disabled.
npm warn using --force Recommended protections disabled.
sh: knip: command not found
',
  output: '',
  evidencePath: '/docs/evidence/quest-test-integration/phase-evidence/phase-1-verification/'
});


MERGE (script:TestScript {name: 'analyze:all'})
ON CREATE SET 
  script.phases = [1],
  script.category = 'analysis',
  script.estimatedTime = 120000,
  script.successCriteria = 'No critical issues detected',
  script.executionCount = 0,
  script.successRate = 0.0,
  script.createdAt = datetime()
ON MATCH SET
  script.phases = CASE 
    WHEN 1 IN script.phases THEN script.phases 
    ELSE script.phases + [1] 
  END,
  script.lastUpdated = datetime();


MATCH (script:TestScript {name: 'analyze:all'})
MATCH (execution:TestExecution {scriptName: 'analyze:all', phase: 1, questId: 'test-integration'})
MERGE (script)-[:EXECUTED_IN]->(phase_node:Phase {number: 1, name: 'Phase 1'})
MERGE (execution)-[:BELONGS_TO]->(script)
MERGE (execution)-[:EXECUTED_IN]->(phase_node)
MERGE (execution)-[:PART_OF]->(quest:Quest {id: 'test-integration'});


CREATE (execution:TestExecution {
  id: 'ci:validate-1-test-integration-1754131393389',
  scriptName: 'ci:validate',
  phase: 1,
  questId: 'test-integration',
  status: 'failed',
  executionTime: 7769,
  timestamp: datetime('2025-08-02T10:39:56.023Z'),
  errorMessage: 'Command failed: npm run ci:validate
npm warn using --force Recommended protections disabled.
',
  output: '',
  evidencePath: '/docs/evidence/quest-test-integration/phase-evidence/phase-1-verification/'
});


MERGE (script:TestScript {name: 'ci:validate'})
ON CREATE SET 
  script.phases = [1],
  script.category = 'ci-cd',
  script.estimatedTime = 60000,
  script.successCriteria = 'CI/CD configuration valid',
  script.executionCount = 0,
  script.successRate = 0.0,
  script.createdAt = datetime()
ON MATCH SET
  script.phases = CASE 
    WHEN 1 IN script.phases THEN script.phases 
    ELSE script.phases + [1] 
  END,
  script.lastUpdated = datetime();


MATCH (script:TestScript {name: 'ci:validate'})
MATCH (execution:TestExecution {scriptName: 'ci:validate', phase: 1, questId: 'test-integration'})
MERGE (script)-[:EXECUTED_IN]->(phase_node:Phase {number: 1, name: 'Phase 1'})
MERGE (execution)-[:BELONGS_TO]->(script)
MERGE (execution)-[:EXECUTED_IN]->(phase_node)
MERGE (execution)-[:PART_OF]->(quest:Quest {id: 'test-integration'});


CREATE (execution:TestExecution {
  id: 'monitor:quality-1-test-integration-1754131393389',
  scriptName: 'monitor:quality',
  phase: 1,
  questId: 'test-integration',
  status: 'failed',
  executionTime: 90012,
  timestamp: datetime('2025-08-02T10:41:26.036Z'),
  errorMessage: 'spawnSync /bin/sh ETIMEDOUT',
  output: '',
  evidencePath: '/docs/evidence/quest-test-integration/phase-evidence/phase-1-verification/'
});


MERGE (script:TestScript {name: 'monitor:quality'})
ON CREATE SET 
  script.phases = [1],
  script.category = 'monitoring',
  script.estimatedTime = 90000,
  script.successCriteria = 'Quality baseline established',
  script.executionCount = 0,
  script.successRate = 0.0,
  script.createdAt = datetime()
ON MATCH SET
  script.phases = CASE 
    WHEN 1 IN script.phases THEN script.phases 
    ELSE script.phases + [1] 
  END,
  script.lastUpdated = datetime();


MATCH (script:TestScript {name: 'monitor:quality'})
MATCH (execution:TestExecution {scriptName: 'monitor:quality', phase: 1, questId: 'test-integration'})
MERGE (script)-[:EXECUTED_IN]->(phase_node:Phase {number: 1, name: 'Phase 1'})
MERGE (execution)-[:BELONGS_TO]->(script)
MERGE (execution)-[:EXECUTED_IN]->(phase_node)
MERGE (execution)-[:PART_OF]->(quest:Quest {id: 'test-integration'});