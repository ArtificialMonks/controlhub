---
type: "always_apply"
---

# A.V.A.R.I.C.E. Protocol Quality Prevention Rules

## 🎯 **EXECUTIVE SUMMARY**

Comprehensive prevention rules derived from resolving **82 TypeScript errors** (100% resolution rate) and
**comprehensive markdown quality analysis of 1,664 files**. Prevents recurrence of compilation errors, interface
compatibility issues, property access violations, and documentation quality issues.

## 🚨 **MANDATORY FIX-FIRST PROTOCOL (CRITICAL)**

### **IMMEDIATE ISSUE RESOLUTION MANDATE**

- **STOP-WORK ORDER**: When ANY issue, bug, failure, test failure, linting violation, or quality violation is detected, ALL new development work must IMMEDIATELY STOP
- **FIX-FIRST REQUIREMENT**: Issues must be fixed IMMEDIATELY upon detection, not deferred or documented for later
- **ZERO TOLERANCE**: NO progression to next phase, task, or activity until ALL detected issues are completely resolved
- **WORKING CODE MANDATE**: Every phase must end with 100% working code, zero test failures, zero linting violations
- **VERIFICATION-FIX LOOP**: After every verification layer, immediately fix what failed before proceeding
- **NO SKIPPING FIXES**: It is STRICTLY FORBIDDEN to skip fixing detected issues or violations

**Prevention Categories:**

- **TypeScript & Code Quality**: Interface compatibility, configuration mapping, property access, Neo4j integration,

error handling

- **Markdown Quality**: 7 critical violation types (PR-001 to PR-007), spelling errors, A.V.A.R.I.C.E. Protocol

documentation standards

- **Agent Integration**: Phase-specific validation requirements, quality gate enforcement, evidence collection standards

---

## 📋 **1. TYPESCRIPT PREVENTION RULES**

### **Critical TypeScript Rules**

#### Rule ICP-001: Result Type Disambiguation

- **Error**: `Type 'VerificationResult' is not assignable to type 'ValidationResult'`
- **Solution**: Always use `ValidationResult` for all validation operations

- **Pattern**:`const result: ValidationResult = { success: true, message: '...', data: artifact }`**Rule ICP-002: Property Access Safety**

- **Error**:`Object is possibly 'null' or 'undefined'`- **Solution**: Use optional chaining and nullish coalescing

- **Pattern**:`const value = result?.data?.someProperty ?? 'default-value'`**Rule CMS-001: QA Agent Config Interface**

- **Error**:`Property 'testGenerationConfig' does not exist on type 'AgentConfigBase'`- **Solution**: Extend`AgentConfigBase`for agent-specific configurations

- **Pattern**:`interface QAAgentConfig extends AgentConfigBase { testGenerationConfig: {...} }`**Rule MSV-001: Memory Handoff Method Signatures**

- **Error**:`Argument of type 'MemoryHandoffRequest' is not assignable to parameter`- **Solution**: Use consistent interface names across all method signatures

- **Pattern**:`async handoffMemory(request: HandoffRequest): Promise<HandoffResult>`**Rule NDI-001: Neo4j SessionMode Type Safety**

- **Error**:`Type 'string' is not assignable to type 'SessionMode'`- **Solution**: Use proper Neo4j constants

- **Pattern**:`session = driver.session({ defaultAccessMode: neo4j.session.READ })`**Rule ETH-001: Unknown Error Type Guards**

- **Error**:`Unknown error type in catch blocks`- **Solution**: Implement proper type guards for error handling

- **Pattern**:`if (error instanceof Error) { return error.message } else { return String(error) }`---

## 📋 **2. MARKDOWN QUALITY PREVENTION RULES**

### **Critical Markdown Rules (PR-001 to PR-007)**

#### Rule PR-001: Blanks Around Headings (MD022)

- **Error**: `MD022/blanks-around-headings Headings should be surrounded by blank lines`
- **Solution**: One blank line before and after every heading

- **Pattern**:`## Heading\n\nContent...`**Rule PR-002: Blanks Around Lists (MD032)**

- **Error**:`MD032/blanks-around-lists Lists should be surrounded by blank lines`- **Solution**: Blank line before and after lists

- **Pattern**:`Text\n\n- Item 1\n- Item 2\n\nNext text`**Rule PR-003: Multiple Blank Lines (MD012)**

- **Error**:`MD012/no-multiple-blanks Multiple consecutive blank lines`- **Solution**: Maximum one blank line between elements

- **Pattern**:`Section 1\n\nSection 2`**Rule PR-004: Blanks Around Fences (MD031)**

- **Error**:`MD031/blanks-around-fences Fenced code blocks should be surrounded by blank lines`- **Solution**: Blank line before and after code blocks

- **Pattern**:`Text\n\n```typescript\ncode\n```\n\nText`**Rule PR-005: Tiered Line Length System (MD013)**

- **Optimal Target**: 222 characters per line (recommended for readability)

- **Maximum Allowed**: 444 characters per line (standard compliance)

- **Exceptional Cases**: Up to 999 characters (only for highly complex, sophisticated files)

- **Error**:`MD013/line-length Line length [Expected: 222; Actual: XXX]`- **Solution**: Use tiered approach - aim for 222, allow up to 444, exceptional cases up to 999

- **Pattern**: Break long lines naturally at logical points, prioritize readability

#### Rule PR-006: Code Language Specification (MD040)

- **Error**: `MD040/fenced-code-language Fenced code blocks should have a language specified`
- **Solution**: Always specify language in code fences
- **Pattern**: `````typescript` not just ``` ```

#### Rule PR-007: Duplicate Headings (MD024)

- **Error**:`MD024/no-duplicate-heading Multiple headings with same content`- **Solution**: Make headings unique within document

- **Pattern**: Add context to differentiate similar headings

### **Spelling Error Prevention (SP-001)**

#### A.V.A.R.I.C.E. Term Truncation Prevention

- **Common Issues**: `utonomous`, `erification`, `daptive`, `obust`, `ntelligent`, `ompliant`, `fficient`
- **Solution**: Always spell out full A.V.A.R.I.C.E. terms

- **Validation**:`npm run spell:avarice`---

## 📋 **3. PHASE-SPECIFIC INTEGRATION**

### **Phase-Specific Prevention Rule Mapping**

| Phase | Agents | TypeScript Rules | Markdown Rules | Validation Commands |

|-------|--------|------------------|----------------|-------------------|
| **Phase 1** | Architect | ICP-001, CMS-001 | PR-001, PR-002 |`npm run validate:markdown-quality`|

| **Phase 2** | Architect, Scribe | ICP-002, MSV-001 | PR-004, PR-006 |`npm run lint:md:avarice`|
| **Phase 3** | All Agents | ETH-001, NDI-001 | PR-001, PR-002 |`npm run validate:markdown-quality`|

| **Phase 4** | Coder | ICP-001, ICP-002, MSV-001 | PR-004, PR-006 |`npm run lint:md:avarice`|

| **Phase 5** | QA, Logician | All TypeScript Rules | PR-001 to PR-007 |`npm run validate:avarice-docs`|

| **Phase 6** | Architect | CMS-001, NDI-001 | PR-001, PR-002 |`npm run validate:markdown-quality`|

| **Phase 7** | QA, Logician | All Rules Validation | PR-001 to PR-007 |`npm run validate:avarice-docs`|

| **Phase 8** | Scribe | Documentation Rules | SP-001 |`npm run spell:avarice`|

| **Phase 9** | All Agents | Final Validation | All Rules |`npm run validate:avarice-docs`|

### **Quality Gate Enforcement**

### Mandatory Validation Commands:```bash

## TypeScript validation

npx tsc --noEmit --strict

npm run lint:fix

## Markdown validation  

npm run validate:markdown-quality
npm run lint:md:avarice

npm run validate:avarice-docs
npm run spell:avarice

## Evidence validation

npm run validate:evidence

```text

**Quality Gate Thresholds:**

- **TypeScript Compilation**: 0 errors, 0 warnings

- **Markdownlint Violations**: 0 errors, 0 warnings  
- **Spelling Errors**: 0 unknown words (after whitelist updates)

- **A.V.A.R.I.C.E. Protocol Compliance**: 95%+ compliance score
- **Evidence Collection**: 100% compliance with standard format

---

## 📋 **4. AGENT RESPONSIBILITIES**

### **Agent-Specific Prevention Responsibilities**

**Architect Agent (Phases 1, 2, 6)**

- **TypeScript**: Interface standardization (ICP-001), Config mapping (CMS-001)
- **Markdown**: Strategic documentation validation (PR-001, PR-002)

- **Command**: `npm run validate:markdown-quality`**Coder Agent (Phase 4)**

- **TypeScript**: Property access safety (ICP-002), Method signatures (MSV-001)

- **Markdown**: Implementation documentation (PR-004, PR-006)
- **Command**:`npm run lint:md:avarice`**QA Agent (Phases 5, 7)**

- **TypeScript**: Comprehensive validation (All rules)
- **Markdown**: Complete validation (PR-001 to PR-007)

- **Command**:`npm run validate:avarice-docs`**Logician Agent (Phases 5, 7)**

- **TypeScript**: Error handling (ETH-001), Neo4j integration (NDI-001)
- **Markdown**: Protocol compliance (PR-003, PR-007)

- **Command**:`npm run validate:avarice-docs`**Scribe Agent (Phase 8)**

- **TypeScript**: Documentation and memory storage
- **Markdown**: Knowledge documentation spelling (SP-001)

- **Command**:`npm run spell:avarice`

---

## 📋 **5. ENFORCEMENT PROTOCOLS**

### **Zero Tolerance Quality Gates**

**Immediate Stop-Work Triggers:**

- Any TypeScript compilation error
- Any markdownlint violation
- Any spelling error in evidence documentation

- Any A.V.A.R.I.C.E. Protocol compliance failure

**Automated Enforcement:**

- Pre-commit hooks prevent violations
- CI/CD integration blocks non-compliant merges

- Phase-specific validation integrated into test orchestration
- Evidence collection automatic validation

**Agent Accountability:**

- Each agent must validate before phase completion
- Quality gate failures require immediate resolution
- All completion claims backed by concrete evidence
- Cross-phase validation consistency maintained

---

## 🎯 **CONCLUSION**

These prevention rules ensure **zero tolerance for quality violations** across TypeScript code and markdown
documentation in the A.V.A.R.I.C.E. Protocol. Implementation prevents:

**TypeScript & Code Quality:**

- ✅ **82 TypeScript compilation errors** → 0 errors
- ✅ **Interface compatibility issues** → Standardized patterns
- ✅ **Property access violations** → Safe null checking
- ✅ **Neo4j integration issues** → Proper type safety

**Markdown Quality & Documentation:**

- ✅ **7 critical markdownlint violations** → Prevention rules PR-001 to PR-007
- ✅ **116+ spelling errors** → Automated validation and prevention
- ✅ **A.V.A.R.I.C.E. Protocol documentation** → Phase-specific quality standards
- ✅ **Evidence collection quality** → Institutional memory preservation

**Enforcement**: Mandatory integration into all 9 A.V.A.R.I.C.E. Protocol phases with automated validation and
zero-tolerance quality gates.
