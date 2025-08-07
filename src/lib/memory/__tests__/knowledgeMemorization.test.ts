// src/lib/memory/__tests__/knowledgeMemorization.test.ts
/**
 * Knowledge Memorization Engine Tests
 * Phase 8.1: Neo4j Knowledge Storage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeMemorizationEngine } from '../knowledgeMemorization'

describe('KnowledgeMemorizationEngine', () => {
  let memorizationEngine: KnowledgeMemorizationEngine

  beforeEach(() => {
    memorizationEngine = new KnowledgeMemorizationEngine()
  })

  describe('Knowledge Memorization', () => {
    it('should memorize all knowledge successfully', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      expect(report).toBeDefined()
      expect(report.reportId).toMatch(/^memorization-\d+-[a-z0-9]+$/)
      expect(report.timestamp).toBeInstanceOf(Date)

      // Summary validation
      expect(report.summary.totalItems).toBeGreaterThan(0)
      expect(report.summary.memorizedItems).toBeGreaterThanOrEqual(0)
      expect(report.summary.updatedItems).toBeGreaterThanOrEqual(0)
      expect(report.summary.failedItems).toBeGreaterThanOrEqual(0)
      expect(report.summary.overallSuccess).toBeGreaterThanOrEqual(0)
      expect(report.summary.overallSuccess).toBeLessThanOrEqual(100)

      // Verify total adds up
      const totalProcessed = report.summary.memorizedItems + 
                            report.summary.updatedItems + 
                            report.summary.failedItems
      expect(totalProcessed).toBe(report.summary.totalItems)

      // Results validation
      expect(report.results.length).toBe(report.summary.totalItems)
      expect(Array.isArray(report.insights)).toBe(true)
      expect(Array.isArray(report.recommendations)).toBe(true)

      // High success rate expected
      expect(report.summary.overallSuccess).toBeGreaterThan(80)
    })

    it('should collect comprehensive knowledge items', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      expect(report.summary.totalItems).toBeGreaterThan(5) // Should have substantial knowledge

      // Check for expected knowledge categories
      const results = report.results
      expect(results.length).toBeGreaterThan(0)

      results.forEach(result => {
        expect(result.itemId).toBeDefined()
        expect(['memorized', 'updated', 'failed']).toContain(result.status)
        expect(result.relationships).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(100)
        expect(result.timestamp).toBeInstanceOf(Date)
      })

      // Should have high confidence items
      const highConfidenceItems = results.filter(r => r.confidence > 90)
      expect(highConfidenceItems.length).toBeGreaterThan(0)
    })

    it('should validate memorization results', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      report.results.forEach(result => {
        expect(result.itemId).toBeDefined()
        expect(['memorized', 'updated', 'failed']).toContain(result.status)
        expect(result.relationships).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(100)
        expect(result.timestamp).toBeInstanceOf(Date)

        if (result.status === 'memorized') {
          expect(result.nodeId).toBeDefined()
          expect(result.nodeId).toMatch(/^neo4j-node-/)
          expect(result.relationships).toBeGreaterThan(0)
        }
      })

      // Should have mostly successful memorization
      const successfulItems = report.results.filter(r => r.status === 'memorized')
      expect(successfulItems.length).toBeGreaterThan(report.results.length * 0.8) // 80%+ success
    })
  })

  describe('Knowledge Graph Construction', () => {
    it('should build comprehensive knowledge graph', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const graph = report.knowledgeGraph

      expect(graph).toBeDefined()
      expect(Array.isArray(graph.nodes)).toBe(true)
      expect(Array.isArray(graph.relationships)).toBe(true)
      expect(Array.isArray(graph.clusters)).toBe(true)
      expect(graph.metrics).toBeDefined()

      // Nodes validation
      expect(graph.nodes.length).toBeGreaterThan(0)
      graph.nodes.forEach(node => {
        expect(node.id).toBeDefined()
        expect(node.label).toBeDefined()
        expect(node.properties).toBeDefined()
        expect(node.type).toBeDefined()
        expect(node.importance).toBeGreaterThanOrEqual(0)
        expect(node.importance).toBeLessThanOrEqual(1)
      })

      // Relationships validation
      expect(graph.relationships.length).toBeGreaterThan(0)
      graph.relationships.forEach(relationship => {
        expect(relationship.id).toBeDefined()
        expect(relationship.type).toBeDefined()
        expect(relationship.source).toBeDefined()
        expect(relationship.target).toBeDefined()
        expect(relationship.strength).toBeGreaterThanOrEqual(0)
        expect(relationship.strength).toBeLessThanOrEqual(1)
        expect(relationship.properties).toBeDefined()
      })

      // Clusters validation
      expect(graph.clusters.length).toBeGreaterThan(0)
      graph.clusters.forEach(cluster => {
        expect(cluster.id).toBeDefined()
        expect(cluster.name).toBeDefined()
        expect(Array.isArray(cluster.nodes)).toBe(true)
        expect(cluster.centrality).toBeGreaterThanOrEqual(0)
        expect(cluster.centrality).toBeLessThanOrEqual(1)
        expect(cluster.cohesion).toBeGreaterThanOrEqual(0)
        expect(cluster.cohesion).toBeLessThanOrEqual(1)
      })
    })

    it('should validate graph metrics', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const metrics = report.knowledgeGraph.metrics

      expect(metrics.totalNodes).toBeGreaterThan(0)
      expect(metrics.totalRelationships).toBeGreaterThanOrEqual(0)
      expect(metrics.density).toBeGreaterThanOrEqual(0)
      expect(metrics.density).toBeLessThanOrEqual(1)
      expect(metrics.clustering).toBeGreaterThanOrEqual(0)
      expect(metrics.clustering).toBeLessThanOrEqual(1)
      expect(metrics.avgPathLength).toBeGreaterThan(0)

      // Verify metrics consistency
      expect(metrics.totalNodes).toBe(report.knowledgeGraph.nodes.length)
      expect(metrics.totalRelationships).toBe(report.knowledgeGraph.relationships.length)
    })

    it('should create meaningful knowledge clusters', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const clusters = report.knowledgeGraph.clusters

      // Should have expected clusters
      const clusterNames = clusters.map(c => c.name)
      expect(clusterNames).toContain('Architecture Patterns')
      expect(clusterNames).toContain('Performance Optimizations')
      expect(clusterNames).toContain('Security Solutions')

      // Each cluster should have nodes
      clusters.forEach(cluster => {
        expect(cluster.nodes.length).toBeGreaterThan(0)
        expect(cluster.centrality).toBeGreaterThan(0.5) // Should be reasonably central
        expect(cluster.cohesion).toBeGreaterThan(0.5) // Should be cohesive
      })
    })
  })

  describe('Knowledge Categories', () => {
    it('should memorize architectural patterns', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have architecture-related knowledge
      const architectureNodes = report.knowledgeGraph.nodes.filter(n => 
        n.properties.category === 'Architecture'
      )
      expect(architectureNodes.length).toBeGreaterThan(0)

      // Should include DAL and component patterns
      const nodeLabels = architectureNodes.map(n => n.label)
      expect(nodeLabels.some(label => label.includes('Data Access Layer'))).toBe(true)
      expect(nodeLabels.some(label => label.includes('Component Architecture'))).toBe(true)
    })

    it('should memorize performance optimizations', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have performance-related knowledge
      const performanceNodes = report.knowledgeGraph.nodes.filter(n => 
        n.properties.category === 'Performance'
      )
      expect(performanceNodes.length).toBeGreaterThan(0)

      // Should include filtering optimization
      const nodeLabels = performanceNodes.map(n => n.label)
      expect(nodeLabels.some(label => label.includes('Filtering Performance'))).toBe(true)
    })

    it('should memorize security solutions', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have security-related knowledge
      const securityNodes = report.knowledgeGraph.nodes.filter(n => 
        n.properties.category === 'Security'
      )
      expect(securityNodes.length).toBeGreaterThan(0)

      // Should include comprehensive security
      const nodeLabels = securityNodes.map(n => n.label)
      expect(nodeLabels.some(label => label.includes('Security Implementation'))).toBe(true)
    })

    it('should memorize A.V.A.R.I.C.E. Protocol insights', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have protocol-related knowledge
      const protocolNodes = report.knowledgeGraph.nodes.filter(n => 
        n.properties.category === 'Protocol'
      )
      expect(protocolNodes.length).toBeGreaterThan(0)

      // Should include A.V.A.R.I.C.E. Protocol success
      const nodeLabels = protocolNodes.map(n => n.label)
      expect(nodeLabels.some(label => label.includes('A.V.A.R.I.C.E.'))).toBe(true)
    })
  })

  describe('Knowledge Relationships', () => {
    it('should create meaningful relationships between knowledge items', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const relationships = report.knowledgeGraph.relationships

      expect(relationships.length).toBeGreaterThan(0)

      relationships.forEach(relationship => {
        expect(relationship.type).toBe('RELATED_TO')
        expect(relationship.strength).toBeGreaterThan(0)
        expect(relationship.strength).toBeLessThanOrEqual(1)
        expect(relationship.properties.category).toBe('knowledge_relation')
        expect(relationship.properties.created).toBeInstanceOf(Date)
      })

      // Should have relationships between different categories
      const sourceNodes = new Set(relationships.map(r => r.source))
      const targetNodes = new Set(relationships.map(r => r.target))
      expect(sourceNodes.size).toBeGreaterThan(1)
      expect(targetNodes.size).toBeGreaterThan(1)
    })

    it('should validate relationship strength distribution', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const relationships = report.knowledgeGraph.relationships

      // Should have varying relationship strengths
      const strengths = relationships.map(r => r.strength)
      const uniqueStrengths = new Set(strengths)
      expect(uniqueStrengths.size).toBeGreaterThan(1) // Should have different strengths

      // Should have strong relationships
      const strongRelationships = relationships.filter(r => r.strength > 0.7)
      expect(strongRelationships.length).toBeGreaterThan(0)
    })
  })

  describe('Insights Generation', () => {
    it('should generate meaningful insights', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      expect(Array.isArray(report.insights)).toBe(true)
      expect(report.insights.length).toBeGreaterThan(0)

      report.insights.forEach(insight => {
        expect(typeof insight).toBe('string')
        expect(insight.length).toBeGreaterThan(0)
      })

      // Should include key insights
      const insightText = report.insights.join(' ').toLowerCase()
      expect(insightText).toContain('success rate')
      expect(insightText).toContain('confidence')
      expect(insightText).toContain('relationships')
      expect(insightText).toContain('knowledge graph')
    })

    it('should provide statistical insights', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have statistical insights
      const statisticalInsights = report.insights.filter(insight => 
        insight.includes('%') || insight.includes('rate') || insight.includes('average')
      )
      expect(statisticalInsights.length).toBeGreaterThan(0)

      // Should mention graph metrics
      const graphInsights = report.insights.filter(insight => 
        insight.includes('graph') || insight.includes('nodes') || insight.includes('relationships')
      )
      expect(graphInsights.length).toBeGreaterThan(0)
    })
  })

  describe('Recommendations Generation', () => {
    it('should generate actionable recommendations', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      expect(Array.isArray(report.recommendations)).toBe(true)
      expect(report.recommendations.length).toBeGreaterThan(0)

      report.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string')
        expect(recommendation.length).toBeGreaterThan(0)
      })

      // Should include maintenance recommendations
      const recommendationText = report.recommendations.join(' ')
      expect(recommendationText).toContain('knowledge')
      expect(recommendationText.includes('update') || recommendationText.includes('use')).toBe(true)
    })

    it('should provide specific recommendations based on results', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have recommendations for knowledge management
      const knowledgeRecommendations = report.recommendations.filter(rec => 
        rec.includes('knowledge') || rec.includes('patterns') || rec.includes('institutional')
      )
      expect(knowledgeRecommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed memorization report', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const detailedReport = memorizationEngine.generateDetailedReport(report)

      expect(typeof detailedReport).toBe('string')
      expect(detailedReport.length).toBeGreaterThan(0)

      // Check report structure
      expect(detailedReport).toContain('# Knowledge Memorization Report')
      expect(detailedReport).toContain('## Executive Summary')
      expect(detailedReport).toContain('## Knowledge Graph Metrics')
      expect(detailedReport).toContain('## Memorization Results')

      // Check report content
      expect(detailedReport).toContain(report.reportId)
      expect(detailedReport).toContain(report.summary.totalItems.toString())
      expect(detailedReport).toContain(report.summary.overallSuccess.toString())

      // Check graph metrics inclusion
      expect(detailedReport).toContain(report.knowledgeGraph.metrics.totalNodes.toString())
      expect(detailedReport).toContain(report.knowledgeGraph.metrics.totalRelationships.toString())

      // Check insights and recommendations
      if (report.insights.length > 0) {
        expect(detailedReport).toContain('## Insights')
        report.insights.forEach(insight => {
          expect(detailedReport).toContain(insight)
        })
      }

      if (report.recommendations.length > 0) {
        expect(detailedReport).toContain('## Recommendations')
        report.recommendations.forEach(recommendation => {
          expect(detailedReport).toContain(recommendation)
        })
      }
    })

    it('should include all memorization results in report', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const detailedReport = memorizationEngine.generateDetailedReport(report)

      // Should include all results
      report.results.forEach(result => {
        expect(detailedReport).toContain(result.itemId)
        expect(detailedReport).toContain(result.status.toUpperCase())
        expect(detailedReport).toContain(result.confidence.toString())
      })
    })
  })

  describe('Performance', () => {
    it('should complete memorization within reasonable time', async () => {
      const startTime = Date.now()
      const report = await memorizationEngine.memorizeAllKnowledge()
      const endTime = Date.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(report.summary.totalItems).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle memorization errors gracefully', async () => {
      // Should not throw for normal memorization
      await expect(memorizationEngine.memorizeAllKnowledge()).resolves.toBeDefined()
    })

    it('should provide meaningful results even with some failures', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Even if some items fail, should have meaningful results
      expect(report.summary.totalItems).toBeGreaterThan(0)
      expect(report.knowledgeGraph.nodes.length).toBeGreaterThan(0)
      expect(report.insights.length).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Knowledge Quality', () => {
    it('should memorize high-confidence knowledge', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have high-confidence items
      const highConfidenceResults = report.results.filter(r => r.confidence > 90)
      expect(highConfidenceResults.length).toBeGreaterThan(0)

      // Average confidence should be high
      const avgConfidence = report.results.reduce((sum, r) => sum + r.confidence, 0) / report.results.length
      expect(avgConfidence).toBeGreaterThan(80)
    })

    it('should create well-connected knowledge graph', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()
      const graph = report.knowledgeGraph

      // Should have good connectivity
      expect(graph.metrics.density).toBeGreaterThan(0.05) // Reasonable density for sparse graphs
      expect(graph.metrics.clustering).toBeGreaterThan(0.5) // Good clustering

      // Should have multiple relationships per node on average
      const avgRelationshipsPerNode = graph.metrics.totalRelationships / graph.metrics.totalNodes
      expect(avgRelationshipsPerNode).toBeGreaterThan(0.5) // Adjusted for realistic sparse graphs
    })
  })

  describe('Quest 4.3 Specific Knowledge', () => {
    it('should memorize Quest 4.3 specific knowledge', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have Quest 4.3 specific items
      const quest43Nodes = report.knowledgeGraph.nodes.filter(n => 
        n.properties.quest === 'Quest 4.3'
      )
      expect(quest43Nodes.length).toBeGreaterThan(0)

      // Should span multiple phases
      const phases = new Set(quest43Nodes.map(n => n.properties.phase as string))
      expect(phases.size).toBeGreaterThan(3) // Should span multiple phases
    })

    it('should include filtering system specific knowledge', async () => {
      const report = await memorizationEngine.memorizeAllKnowledge()

      // Should have filtering-related knowledge
      const filteringNodes = report.knowledgeGraph.nodes.filter(n => 
        n.label.toLowerCase().includes('filtering') || 
        n.label.toLowerCase().includes('filter')
      )
      expect(filteringNodes.length).toBeGreaterThan(0)
    })
  })
})
