// src/components/dashboard/drill-down/WorkflowsDrillDown.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  DrillDownSection, 
  DrillDownMetric 
} from '@/components/ui/drill-down-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'
import { 
  GitBranch, 
  Activity, 
  Layers, 
  Cpu,
  Clock,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import type { Automation } from '@/lib/repositories/automation-repository'

interface WorkflowsDrillDownProps {
  automations: Automation[]
  runningCount: number
  stoppedCount: number
}

export function WorkflowsDrillDown({ 
  automations, 
  runningCount, 
  stoppedCount 
}: WorkflowsDrillDownProps) {
  const [timeRange, setTimeRange] = useState('7d')
  const [viewType, setViewType] = useState<'timeline' | 'distribution'>('timeline')

  // Calculate workflow metrics
  const metrics = useMemo(() => {
    const activeWorkflows = runningCount + stoppedCount
    const avgDuration = automations.reduce((sum, a) => sum + (a.avg_duration_ms || 0), 0) / automations.length / 1000
    const totalRuns = automations.length * 8 // Estimated based on available data
    
    // Group by complexity (based on duration)
    const simple = automations.filter(a => (a.avg_duration_ms || 0) < 30000).length
    const moderate = automations.filter(a => (a.avg_duration_ms || 0) >= 30000 && (a.avg_duration_ms || 0) < 120000).length
    const complex = automations.filter(a => (a.avg_duration_ms || 0) >= 120000).length

    return {
      activeWorkflows,
      avgDuration,
      totalRuns,
      efficiency: runningCount / activeWorkflows * 100,
      simple,
      moderate,
      complex
    }
  }, [automations, runningCount, stoppedCount])

  // Generate timeline data
  const timelineData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        active: Math.floor(Math.random() * 10) + runningCount - 5,
        completed: Math.floor(Math.random() * 50) + 20,
        failed: Math.floor(Math.random() * 5),
        avgDuration: Math.floor(Math.random() * 60) + 30
      }
    })
  }, [timeRange, runningCount])

  // Workflow distribution by client
  const clientDistribution = useMemo(() => {
    const clientCounts: Record<string, number> = {}
    automations.forEach(a => {
      const client = a.client_id || 'Unassigned'
      clientCounts[client] = (clientCounts[client] || 0) + 1
    })
    
    return Object.entries(clientCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [automations])

  // Complexity distribution data
  const complexityData = [
    { name: 'Simple', value: metrics.simple, color: '#10b981' },
    { name: 'Moderate', value: metrics.moderate, color: '#3b82f6' },
    { name: 'Complex', value: metrics.complex, color: '#8b5cf6' }
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{ 
      value: number; 
      name: string; 
      dataKey?: string; 
      color?: string;
      payload?: { date?: string };
      unit?: string;
    }> 
  }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-black/95 backdrop-blur-xl p-3 rounded-lg shadow-xl border border-white/20"
        >
          <p className="text-sm font-semibold mb-2">{payload[0]?.payload?.date || payload[0]?.name}</p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground capitalize">{entry.dataKey || entry.name}:</span>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {entry.value}{entry.unit || ''}
              </span>
            </div>
          ))}
        </motion.div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DrillDownMetric
          label="Active Workflows"
          value={metrics.activeWorkflows}
          icon={<GitBranch className="h-5 w-5 text-cyan-500" />}
        />
        <DrillDownMetric
          label="Workflow Efficiency"
          value={`${metrics.efficiency.toFixed(1)}%`}
          trend={metrics.efficiency > 80 ? 'up' : 'down'}
          trendValue={metrics.efficiency > 80 ? '+8%' : '-3%'}
          icon={<Activity className="h-5 w-5 text-green-500" />}
        />
        <DrillDownMetric
          label="Avg Duration"
          value={`${metrics.avgDuration.toFixed(1)}s`}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
        />
        <DrillDownMetric
          label="Total Runs"
          value={metrics.totalRuns.toLocaleString()}
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      {/* Workflow Activity Chart */}
      <DrillDownSection 
        title="Workflow Activity"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('timeline')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Timeline
            </Button>
            <Button
              variant={viewType === 'distribution' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('distribution')}
            >
              <PieChartIcon className="h-4 w-4 mr-2" />
              Distribution
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="h-64 w-full">
          {viewType === 'timeline' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Complexity Distribution */}
              <div className="flex flex-col items-center justify-center">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">By Complexity</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={complexityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {complexityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Client Distribution */}
              <div className="flex flex-col items-center justify-center">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">By Client</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={clientDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {clientDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </DrillDownSection>

      {/* Workflow Complexity Breakdown */}
      <DrillDownSection title="Workflow Complexity">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {complexityData.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5" style={{ color: item.color }} />
                  <h4 className="font-medium">{item.name}</h4>
                </div>
                <Badge variant="secondary">{item.value}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Workflows</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Percentage</span>
                  <span className="font-medium">
                    {((item.value / automations.length) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / automations.length) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </DrillDownSection>

      {/* Performance Insights */}
      <DrillDownSection title="Performance Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-5 w-5 text-green-500" />
              <h4 className="font-medium">Optimal Performance</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {runningCount} workflows are currently running smoothly with an average success rate of 95%.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">Recommendations</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Consider optimizing {metrics.complex} complex workflows to improve overall efficiency.
            </p>
          </div>
        </div>
      </DrillDownSection>
    </div>
  )
}