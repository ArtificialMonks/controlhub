---
type: "always_apply"
---

# A.V.A.R.I.C.E. Protocol Rules & Guidelines

## **CRITICAL PROHIBITIONS**

### **STRICTLY PROHIBITED TECHNOLOGIES**
- **JAVASCRIPT CREATION**: Strictly prohibited to create, code, and use JavaScript in any form
- **THEORETICAL FRAMEWORKS**: Creating testing frameworks, validation systems, or verification tools WITHOUT executing them is prohibited
- **PARTIAL COMPLETION**: "Mostly working," "good enough," or partial completion status is strictly prohibited
- **ASSUMPTION-BASED WORK**: Never speculate or make assumptions - verify every action, claim, and connection

## **MANDATORY EXECUTION PROTOCOLS**

### **TEST EXECUTION REQUIREMENT**
- **EXECUTION MANDATE**: Every test, validation, or verification activity must be ACTUALLY EXECUTED with documented results
- **EVIDENCE REQUIREMENT**: Provide concrete proof including logs, metrics, screenshots, or other artifacts
- **THEORETICAL PROHIBITION**: Theoretical frameworks without execution evidence are incomplete
- **PROOF REQUIREMENT**: Claims of "tests created" or "validation implemented" are meaningless without concrete execution evidence

### **IMMEDIATE ISSUE RESOLUTION PROTOCOL**
- **STOP-WORK ORDER**: When ANY issue, bug, failure, or quality violation is detected, ALL new development work must IMMEDIATELY STOP
- **RESOLUTION MANDATE**: Issues must be fixed at root cause level, not patched or worked around
- **RE-TESTING REQUIREMENT**: After issue resolution, complete test suite must be re-executed
- **ESCALATION PROTOCOL**: Issues that cannot be auto-healed must be escalated

### **PRE-CREATION CODEBASE SCANNING MANDATE**
- **MANDATORY SCAN**: Before creating ANY new component, scan existing codebase using Native Augment Context Engine
- **REUSE REQUIREMENT**: If similar functionality exists, enhance/extend existing tools rather than creating duplicates
- **INTEGRATION MANDATE**: New tools must integrate seamlessly with existing validation infrastructure
- **DOCUMENTATION UPDATE**: All enhancements must be documented with clear change logs and impact analysis

## **QUALITY GATES & STANDARDS**

### **FILE CREATION QUALITY GATES**

**TypeScript Files:**
- **MANDATORY EXECUTION**: Syntax & type checking (strict TypeScript, no any/unknown) - MUST BE ACTUALLY EXECUTED
- **MANDATORY EXECUTION**: Linting & formatting (ESLint, Prettier) - MUST BE ACTUALLY EXECUTED
- **EVIDENCE REQUIREMENT**: Provide concrete proof of successful validation with logs and metrics
- **IMMEDIATE ISSUE RESOLUTION**: Fix ALL issues before proceeding - zero tolerance for quality debt

**Python Files:**
- **MANDATORY EXECUTION**: Syntax & type checking (mypy strict mode, full type annotations) - MUST BE ACTUALLY EXECUTED
- **MANDATORY EXECUTION**: Linting & formatting (ruff/flake8, black) - MUST BE ACTUALLY EXECUTED
- **MANDATORY EXECUTION**: Code quality (no bare except, proper imports, docstrings) - MUST BE ACTUALLY EXECUTED
- **EVIDENCE REQUIREMENT**: Provide concrete proof of successful validation with logs and metrics

**Markdown Files:**
- **MANDATORY EXECUTION**: Markdown validation (links, headers, structure) - MUST BE ACTUALLY EXECUTED
- **MANDATORY EXECUTION**: Link verification and accessibility testing - MUST BE ACTUALLY EXECUTED
- **EVIDENCE REQUIREMENT**: Provide concrete proof of successful validation

### **UNIVERSAL FILE CREATION ENFORCEMENT**
- **PRE-CREATION SCAN**: Before creating ANY file, scan existing codebase for similar functionality
- **IMMEDIATE VALIDATION**: ALL files must pass validation before any subsequent work
- **ZERO TOLERANCE**: No file creation is complete without 100% validation success and concrete evidence

## **CODEBASE STRUCTURE & ORGANIZATION**

### **ENTERPRISE-GRADE DIRECTORY STRUCTURE**
- **FILE DIRECTORY AWARENESS**: Use enterprise-grade structure explained in `/STRUCTURE.md`
- **ROOT LEVEL OPTIMIZATION**: Only essential files at root level - create logical hierarchy for all other files
- **STRUCTURE UPDATES**: When creating new folders/subfolders, add them to `STRUCTURE.md`
- **MODULARITY PRIORITY**: Follow established best practices for enterprise-grade directory structuring
- **SEPARATION OF CONCERNS**: Maintain scalability, clarity, and ease of navigation

### **LOGGING STANDARDS**
- **LOG STORAGE**: All logs stored within `/logs` directory
- **LOGGING GUIDELINES**: Follow logging standards in `/docs/LOGGING_STANDARDS.md`
- **DOCUMENTATION STORAGE**: All documentation stored within `/docs` directory

### **ZERO ISOLATION POLICY**
- **NO ORPHANED MODULES**: All components must be properly connected with no orphaned modules
- **INTEGRATION REQUIREMENT**: Ensure all new components are fully integrated and wired into the application
- **CONNECTION MANDATE**: Never delete references - create missing functionality instead
- **PATHWAY VERIFICATION**: Connect correct import/export pathways, create optimized connections if missing

## **DEVELOPMENT STANDARDS**

### **CODE QUALITY REQUIREMENTS**
- **CLEAN CODE**: Write clean, modular code following project conventions
- **INTEGRATION INTEGRITY**: Ensure all new components are fully integrated and wired
- **COMPILATION VALIDATION**: All code must be ACTUALLY COMPILED/VALIDATED with concrete evidence
- **VERIFICATION LOOP**: After creating ANY new file, await verification with concrete results

### **PACKAGE MANAGEMENT**
- **USE PACKAGE MANAGERS**: Always use appropriate package managers for dependency management
- **NO MANUAL EDITING**: Never manually edit package.json, requirements.txt, Cargo.toml, go.mod, etc.
- **CORRECT COMMANDS**: Use proper package manager commands for each language/framework
- **EXCEPTION RULE**: Only edit package files directly for complex configuration changes that cannot be accomplished through package manager commands

### **TESTING REQUIREMENTS**
- **ACTUAL EXECUTION**: ALL tests must be ACTUALLY EXECUTED with concrete results, timing data, and pass/fail status
- **EVIDENCE COLLECTION**: Every verification must provide concrete evidence including logs, screenshots, performance metrics
- **LANGUAGE MATCHING**: Write tests in correct language (TypeScript components need TypeScript tests, avoid JavaScript)
- **100% PASS REQUIREMENT**: All tests must pass 100% before proceeding

## **MCP SERVER GUIDELINES**

### **CONTEXT7 MCP USAGE**
- **INTERNAL RAG**: Use for synchronizing with entire codebase and documentation
- **KNOWLEDGE GRAPH**: Ensure project's Knowledge Graph is current and complete
- **HALLUCINATION DETECTION**: Use for hallucination detection and verification

### **EXA MCP USAGE**
- **EXTERNAL RESEARCH**: Use for pre-emptive research on latest best practices and external libraries
- **CURRENT INFORMATION**: Preferably 2025 or earliest 2024 information
- **AGENTIC WEB SEARCH**: Use for intelligent web search capabilities

### **FIRECRAWL MCP USAGE**
- **WEB SCRAPING**: Use for deep information extraction from web pages
- **CONTENT EXTRACTION**: Use when detailed web content analysis is required

## **MEMORY & KNOWLEDGE MANAGEMENT**

### **NEO4J MEMORY INTEGRATION**
- **MEMORY INITIALIZATION**: Each operation must initialize appropriate memory layers
- **KNOWLEDGE PERSISTENCE**: All discoveries, patterns, and insights must be stored in Neo4j memory layers
- **CROSS-PHASE CONTINUITY**: Memory handoffs between phases are mandatory with evidence of transfer
- **EVIDENCE INTEGRATION**: All evidence must be stored in memory with retrieval capabilities and audit trails

### **AGENT MEMORY PATTERNS**
- **Architect Agent**: Core (365 days), Semantic (365 days), Procedural (365 days), Knowledge Vault (730 days)
- **Coder Agent**: Core (180 days), Procedural (365 days), Resource (90 days)
- **StaticAnalyzer Agent**: Core (365 days), Procedural (365 days), Semantic (180 days), Episodic (90 days)
- **QA Agent**: Procedural (180 days), Episodic (90 days), Resource (60 days)
- **Logician Agent**: Semantic (365 days), Knowledge Vault (365 days), Procedural (180 days)
- **Scribe Agent**: All 6 memory types with institutional storage mandate (365-730 days)

## **VERIFICATION & VALIDATION STANDARDS**

### **MULTI-LAYER VERIFICATION REQUIREMENTS**
- **STATIC ANALYSIS**: Linting tool execution, 5-layer hallucination detection, import/export connectivity analysis
- **DYNAMIC TESTING**: Automated test case generation, execution via Executor agent, UI testing frameworks
- **FORMAL VERIFICATION**: Advanced verification for critical components, counter-example analysis
- **SECURITY TESTING**: Guardrails testing for security vulnerabilities
- **PERFORMANCE VALIDATION**: Actual performance benchmarks with real timing data

### **CORRECTION PROTOCOL**
- **STRUCTURED REPORTING**: If any layer fails, send structured report with root cause analysis
- **REPEAT UNTIL PASS**: Continue correction cycles until all layers pass
- **IMMEDIATE RESOLUTION**: Fix issues immediately upon detection
- **COMPLETE RE-TESTING**: Re-execute complete test suite after fixes

## **COMPLIANCE & STANDARDS**

### **ARCHITECTURAL COMPLIANCE**
- **DESIGN PRINCIPLES**: Follow project-specific design principles and style guides
- **PERFORMANCE THRESHOLDS**: Ensure code meets performance thresholds and quality standards
- **STANDARD ADHERENCE**: Verify adherence to all project standards and guidelines
- **DOCUMENTATION COMPLIANCE**: Maintain comprehensive documentation with all changes

### **DEFINITION OF DONE REQUIREMENTS**
- **CHECKLIST VERIFICATION**: Verify every item in Definition of Done checklist
- **100% COMPLETION**: No work is complete until ALL DoD criteria are met
- **EVIDENCE BACKING**: All completion claims must be backed by concrete, measurable evidence
- **INDEPENDENT VERIFICATION**: Evidence must be independently verifiable

## **ENFORCEMENT PROTOCOLS**

### **ZERO TOLERANCE QUALITY GATE**
- **100% COMPLETION REQUIREMENT**: No advancement until ALL tests pass 100%, ALL issues are resolved, and ALL evidence is provided
- **VERIFICATION CHAIN**: Provide complete verification chain showing all validation activities were executed successfully
- **ACCOUNTABILITY MEASURE**: All completion claims must be backed by concrete, measurable evidence

### **ESCALATION REQUIREMENTS**
- **AUTO-HEALING RULE**: Issues that cannot be auto-healed must be escalated
- **ROOT CAUSE ANALYSIS**: Provide detailed root cause analysis and proposed resolution strategies
- **DOCUMENTATION MANDATE**: All escalations must be documented with impact analysis

## **TOOL USAGE REQUIREMENTS**

### **NATIVE AUGMENT TOOLS**
- **CONTEXT ENGINE**: Always use Native Augment Context Engine for codebase awareness
- **CODE WRITER**: Use Native Augment Code Writer for all code writing and editing
- **TASK MANAGER**: Use native Augment Task Manager for task hierarchy and management

### **NATIVE AUGMENT FILE OPERATIONS**
- **FILE MODIFICATIONS**: Use Native Augment str-replace-editor for all existing file modifications
- **FILE READING**: Use Native Augment view tool for reading and searching files
- **FILE MANAGEMENT**: Use Native Augment tools for comprehensive file management operations

### **SEQUENTIAL THINKING**
- **COMPLEX PROBLEMS**: Use Sequential Thinking for deep complex problems analysis
- **TASK STRUCTURING**: Use for analyzing and structuring complex tasks
- **PROBLEM SOLVING**: Use when relevant for comprehensive problem-solving approaches

---

**VIOLATION CONSEQUENCES**: Not following these strict rules and guidelines is unacceptable and must be reported immediately. Failure to comply violates task boundaries and compromises code responsibility and auditability.
