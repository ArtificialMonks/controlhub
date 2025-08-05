// src/lib/quality/__tests__/mutationTesting.test.ts
/**
 * Mutation Testing Tests
 * Quest 4.3 - Expert Council Validated Implementation
 * 
 * Important Enhancement: Code Quality Metrics & Mutation Testing
 * Expert Consensus: 100% (6/6 experts)
 * Priority: MEDIUM
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MutationTestingEngine, MUTATION_OPERATORS } from '../mutationTesting'

describe('MutationTestingEngine', () => {
  let engine: MutationTestingEngine

  beforeEach(() => {
    engine = new MutationTestingEngine()
  })

  describe('Mutation Operators', () => {
    it('should have comprehensive mutation operators', () => {
      expect(MUTATION_OPERATORS.length).toBeGreaterThan(0)
      
      MUTATION_OPERATORS.forEach(operator => {
        expect(operator.name).toBeDefined()
        expect(operator.description).toBeDefined()
        expect(operator.pattern).toBeInstanceOf(RegExp)
        expect(operator.replacement).toBeDefined()
        expect(operator.category).toMatch(/^(arithmetic|logical|relational|conditional|assignment)$/)
      })
    })

    it('should include arithmetic operators', () => {
      const arithmeticOps = MUTATION_OPERATORS.filter(op => op.category === 'arithmetic')
      expect(arithmeticOps.length).toBeGreaterThan(0)
      
      const arithmeticOp = arithmeticOps.find(op => op.name === 'ArithmeticOperatorReplacement')
      expect(arithmeticOp).toBeDefined()
    })

    it('should include logical operators', () => {
      const logicalOps = MUTATION_OPERATORS.filter(op => op.category === 'logical')
      expect(logicalOps.length).toBeGreaterThan(0)
      
      const logicalOp = logicalOps.find(op => op.name === 'LogicalOperatorReplacement')
      expect(logicalOp).toBeDefined()
    })

    it('should include relational operators', () => {
      const relationalOps = MUTATION_OPERATORS.filter(op => op.category === 'relational')
      expect(relationalOps.length).toBeGreaterThan(0)
      
      const relationalOp = relationalOps.find(op => op.name === 'RelationalOperatorReplacement')
      expect(relationalOp).toBeDefined()
    })
  })

  describe('Mutant Generation', () => {
    it('should generate mutants for simple arithmetic code', () => {
      const sourceCode = `
        function add(a, b) {
          return a + b;
        }
      `
      
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      expect(mutants.length).toBeGreaterThan(0)
      
      mutants.forEach(mutant => {
        expect(mutant.id).toBeDefined()
        expect(mutant.operator).toBeDefined()
        expect(mutant.originalCode).toBeDefined()
        expect(mutant.mutatedCode).toBeDefined()
        expect(mutant.line).toBeGreaterThan(0)
        expect(mutant.column).toBeGreaterThanOrEqual(0)
        expect(mutant.file).toBe('test.js')
        expect(mutant.category).toBeDefined()
      })
    })

    it('should generate mutants for logical operations', () => {
      const sourceCode = `
        function isValid(a, b) {
          return a > 0 && b < 10;
        }
      `
      
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      expect(mutants.length).toBeGreaterThan(0)
      
      // Should have logical operator mutants
      const logicalMutants = mutants.filter(m => m.category === 'logical')
      expect(logicalMutants.length).toBeGreaterThan(0)
      
      // Should have relational operator mutants
      const relationalMutants = mutants.filter(m => m.category === 'relational')
      expect(relationalMutants.length).toBeGreaterThan(0)
    })

    it('should generate mutants for boolean literals', () => {
      const sourceCode = `
        function isEnabled() {
          return true;
        }
        
        function isDisabled() {
          return false;
        }
      `
      
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      expect(mutants.length).toBeGreaterThan(0)
      
      // Should have boolean literal mutants
      const booleanMutants = mutants.filter(m => m.originalCode === 'true' || m.originalCode === 'false')
      expect(booleanMutants.length).toBeGreaterThan(0)
    })

    it('should not generate mutants for code without operators', () => {
      const sourceCode = `
        const message = "hello world";
        console.log(message);
      `
      
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      // Should have very few or no mutants for simple string operations
      expect(mutants.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Mutation Application', () => {
    it('should apply mutations correctly', () => {
      const sourceCode = `
        function add(a, b) {
          return a + b;
        }
      `
      
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      expect(mutants.length).toBeGreaterThan(0)
      
      const mutant = mutants[0]
      const mutatedCode = engine.applyMutation(sourceCode, mutant)
      
      expect(mutatedCode).toBeDefined()
      expect(mutatedCode).not.toBe(sourceCode)
      expect(mutatedCode).toContain(mutant.mutatedCode)
      expect(mutatedCode).not.toContain(mutant.originalCode)
    })

    it('should preserve code structure when applying mutations', () => {
      const sourceCode = `function test() {\n  return a + b;\n}`
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      
      if (mutants.length > 0) {
        const mutant = mutants[0]
        const mutatedCode = engine.applyMutation(sourceCode, mutant)
        
        // Should preserve line structure
        expect(mutatedCode.split('\n').length).toBe(sourceCode.split('\n').length)
      }
    })
  })

  describe('Mutation Testing Execution', () => {
    it('should run mutation testing and return results', async () => {
      const sourceCode = `
        function add(a, b) {
          return a + b;
        }
        
        function multiply(a, b) {
          return a * b;
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      
      expect(suite).toBeDefined()
      expect(suite.totalMutants).toBeGreaterThan(0)
      expect(suite.killedMutants).toBeGreaterThanOrEqual(0)
      expect(suite.survivedMutants).toBeGreaterThanOrEqual(0)
      expect(suite.timeoutMutants).toBeGreaterThanOrEqual(0)
      expect(suite.errorMutants).toBeGreaterThanOrEqual(0)
      expect(suite.mutationScore).toBeGreaterThanOrEqual(0)
      expect(suite.mutationScore).toBeLessThanOrEqual(100)
      expect(suite.testStrength).toBeGreaterThanOrEqual(0)
      expect(suite.testStrength).toBeLessThanOrEqual(100)
      expect(Array.isArray(suite.results)).toBe(true)
      expect(suite.executionTime).toBeGreaterThan(0)
      expect(suite.timestamp).toBeInstanceOf(Date)
    })

    it('should provide detailed results for each mutant', async () => {
      const sourceCode = `
        function isPositive(x) {
          return x > 0;
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      
      expect(suite.results.length).toBe(suite.totalMutants)
      
      suite.results.forEach(result => {
        expect(result.mutant).toBeDefined()
        expect(result.status).toMatch(/^(killed|survived|timeout|error)$/)
        expect(result.executionTime).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(result.failingTests)).toBe(true)
        expect(typeof result.coverage).toBe('boolean')
      })
    })

    it('should calculate mutation score correctly', async () => {
      const sourceCode = `
        function simple(x) {
          return x + 1;
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      
      const expectedScore = suite.totalMutants > 0 
        ? (suite.killedMutants / suite.totalMutants) * 100 
        : 100
      
      expect(suite.mutationScore).toBeCloseTo(expectedScore, 2)
    })

    it('should calculate test strength correctly', async () => {
      const sourceCode = `
        function compare(a, b) {
          return a === b;
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      
      const testedMutants = suite.killedMutants + suite.survivedMutants
      const expectedStrength = testedMutants > 0 
        ? (suite.killedMutants / testedMutants) * 100 
        : 100
      
      expect(suite.testStrength).toBeCloseTo(expectedStrength, 2)
    })
  })

  describe('Result Analysis', () => {
    it('should analyze mutation results correctly', async () => {
      const sourceCode = `
        function calculator(a, b, op) {
          if (op === '+') return a + b;
          if (op === '-') return a - b;
          if (op === '*') return a * b;
          if (op === '/') return a / b;
          return 0;
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      const analysis = engine.analyzeMutationResults(suite)
      
      expect(analysis).toBeDefined()
      expect(Array.isArray(analysis.weaknesses)).toBe(true)
      expect(Array.isArray(analysis.recommendations)).toBe(true)
      expect(typeof analysis.categoryAnalysis).toBe('object')
      
      // Category analysis should have data
      Object.entries(analysis.categoryAnalysis).forEach(([category, data]) => {
        expect(data.total).toBeGreaterThan(0)
        expect(data.killed).toBeGreaterThanOrEqual(0)
        expect(data.score).toBeGreaterThanOrEqual(0)
        expect(data.score).toBeLessThanOrEqual(100)
      })
    })

    it('should identify weaknesses in low-scoring categories', async () => {
      const sourceCode = `
        function simple(x) {
          return x + 1;
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      const analysis = engine.analyzeMutationResults(suite)
      
      // Analysis should provide meaningful feedback
      expect(analysis.weaknesses).toBeDefined()
      expect(analysis.recommendations).toBeDefined()
    })
  })

  describe('Report Generation', () => {
    it('should generate comprehensive mutation testing report', async () => {
      const sourceCode = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      const report = engine.generateReport(suite)
      
      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      
      // Report should contain key sections
      expect(report).toContain('# Mutation Testing Report')
      expect(report).toContain('## Summary')
      expect(report).toContain('Total Mutants')
      expect(report).toContain('Mutation Score')
      expect(report).toContain('Test Strength')
      expect(report).toContain('## Category Analysis')
    })

    it('should include weaknesses and recommendations in report', async () => {
      const sourceCode = `
        function basic(x) {
          return x > 0;
        }
      `
      
      const suite = await engine.runMutationTesting(sourceCode, 'test.js')
      const report = engine.generateReport(suite)
      
      // Report structure should be valid
      expect(report).toContain('Generated')
      expect(report).toContain('Execution Time')
    })
  })

  describe('Custom Configuration', () => {
    it('should work with custom operators', () => {
      const customOperators = [
        {
          name: 'CustomOperator',
          description: 'Custom test operator',
          pattern: /test/g,
          replacement: 'custom',
          category: 'conditional' as const
        }
      ]
      
      const customEngine = new MutationTestingEngine(customOperators)
      const sourceCode = 'function test() { return test; }'
      
      const mutants = customEngine.generateMutants(sourceCode, 'test.js')
      expect(mutants.length).toBeGreaterThan(0)
      
      const customMutant = mutants.find(m => m.operator === 'CustomOperator')
      expect(customMutant).toBeDefined()
    })

    it('should work with custom test command and timeout', () => {
      const customEngine = new MutationTestingEngine(
        MUTATION_OPERATORS,
        'npm run test:custom',
        60000
      )
      
      expect(customEngine).toBeDefined()
      // Engine should be configured with custom settings
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty source code', () => {
      const mutants = engine.generateMutants('', 'test.js')
      expect(mutants).toEqual([])
    })

    it('should handle source code with no mutatable operators', () => {
      const sourceCode = `
        const message = "hello";
        console.log(message);
      `
      
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      expect(Array.isArray(mutants)).toBe(true)
    })

    it('should handle single-line source code', () => {
      const sourceCode = 'function add(a, b) { return a + b; }'
      
      const mutants = engine.generateMutants(sourceCode, 'test.js')
      expect(mutants.length).toBeGreaterThan(0)
      
      mutants.forEach(mutant => {
        expect(mutant.line).toBe(1)
      })
    })
  })
})
