// src/components/dashboard/charts/EnhancedPerformanceTrendChart.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Area, 
  AreaChart, 
  Bar,
  BarChart,
  Line,
  LineChart,
  ComposedChart,
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Brush
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart
} from 'lucide-react'
import type { Automation } from '@/lib/repositories/automation-repository'

interface EnhancedPerformanceTrendChartProps {
  automations: Automation[]
  timeRange?: '7d' | '30d' | '90d'
}

type ChartType = 'area' | 'line' | 'bar' | 'composed'

export function EnhancedPerformanceTrendChart({ 
  timeRange = '7d' 
}: EnhancedPerformanceTrendChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area')
  const [isAnimating] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'success' | 'duration'>('all')
  const [data, setData] = useState<{
    date: string
    fullDate: string
    successRate: number
    avgDuration: number
    executionCount: number
    errorRate: number
    throughput: number
    failureCount: number
  }[]>([])

  // Generate enhanced trend data with more metrics
  const generateEnhancedTrendData = React.useCallback(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const generatedData = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = timeRange === '7d' 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // Generate more realistic data patterns
      const baseSuccessRate = 85
      const successVariation = Math.sin(i * 0.3) * 10 + Math.random() * 5
      const successRate = Math.max(60, Math.min(100, baseSuccessRate + successVariation))
      
      const baseDuration = 2000
      const durationVariation = Math.cos(i * 0.2) * 500 + Math.random() * 300
      const avgDuration = Math.max(500, baseDuration + durationVariation)
      
      const executionCount = Math.floor(Math.random() * 50 + 100 - i * 2)
      const errorRate = 100 - successRate
      
      generatedData.push({
        date: dateStr,
        fullDate: date.toISOString(),
        successRate: Math.round(successRate),
        avgDuration: Math.round(avgDuration),
        executionCount,
        errorRate: Math.round(errorRate),
        throughput: Math.round(executionCount / 24), // per hour
        failureCount: Math.round(executionCount * errorRate / 100)
      })
    }
    
    return generatedData
  }, [timeRange])

  useEffect(() => {
    const newData = generateEnhancedTrendData()
    setData(newData)

    // Re-enable real-time updates with proper cleanup and longer intervals
    let isMounted = true

    const interval = setInterval(() => {
      if (!isMounted) return

      setData(prevData => {
        if (!isMounted || prevData.length === 0) return prevData

        const updatedData = [...prevData]
        const lastItem = updatedData[updatedData.length - 1]
        if (lastItem) {
          // Create a new object instead of mutating the existing one
          updatedData[updatedData.length - 1] = {
            ...lastItem,
            successRate: Math.min(100, Math.max(60, lastItem.successRate + Math.random() * 2 - 1)),
            avgDuration: Math.max(500, Math.min(5000, lastItem.avgDuration + Math.random() * 100 - 50))
          }
        }
        return updatedData
      })
    }, 10000) // Increased from 5000ms to 10000ms

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [generateEnhancedTrendData])

  // Calculate trend indicators
  const calculateTrend = () => {
    if (data.length < 2) return { trend: 'neutral', percentage: 0 }
    
    const recent = data.slice(-7)
    const previous = data.slice(-14, -7)
    
    const recentAvg = recent.reduce((sum, d) => sum + d.successRate, 0) / recent.length
    const previousAvg = previous.reduce((sum, d) => sum + d.successRate, 0) / previous.length
    
    const percentage = ((recentAvg - previousAvg) / previousAvg) * 100
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
    
    return { trend, percentage: Math.abs(percentage) }
  }

  const { trend, percentage } = calculateTrend()

  // Enhanced tooltip with more information
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      payload: {
        date: string
        successRate: number
        avgDuration: number
        executionCount: number
        throughput: number
      }
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-black/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-white/20"
        >
          <p className="text-sm font-semibold mb-2">{label}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Success Rate:</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {data.successRate}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Avg Duration:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {(data.avgDuration / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Executions:</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {data.executionCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Throughput:</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {data.throughput}/hr
              </span>
            </div>
          </div>
        </motion.div>
      )
    }
    return null
  }

  // Chart components based on type
  const renderChart = () => {
    const commonProps = {
      data: data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 }
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <defs>
              <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="url(#colorGrid)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedMetric !== 'duration' && (
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={isAnimating ? 1500 : 0}
              />
            )}
            {selectedMetric !== 'success' && (
              <Line
                type="monotone"
                dataKey="avgDuration"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                yAxisId="right"
                animationDuration={isAnimating ? 1500 : 0}
              />
            )}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="executionCount" 
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
              animationDuration={isAnimating ? 1000 : 0}
            />
            <Bar 
              dataKey="failureCount" 
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
              animationDuration={isAnimating ? 1000 : 0}
            />
          </BarChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="executionCount" fill="url(#colorBar)" />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="successRate" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <ReferenceLine 
              yAxisId="right" 
              y={85} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: "Target: 85%", position: "left" }}
            />
          </ComposedChart>
        )

      default: // area
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis 
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              domain={[0, 100]}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedMetric !== 'duration' && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorSuccess)"
                strokeWidth={2}
                animationDuration={isAnimating ? 2000 : 0}
              />
            )}
            {selectedMetric !== 'success' && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="avgDuration"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorDuration)"
                strokeWidth={2}
                animationDuration={isAnimating ? 2000 : 0}
              />
            )}
            <Brush 
              dataKey="date" 
              height={30} 
              stroke="#8884d8"
              opacity={0.3}
            />
          </AreaChart>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 group">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Activity className="h-5 w-5 text-primary drop-shadow-lg" />
              </motion.div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Performance Analytics
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* Trend Indicator */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={trend}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    trend === 'up' ? 'bg-green-500/10 text-green-500' : 
                    trend === 'down' ? 'bg-red-500/10 text-red-500' : 
                    'bg-gray-500/10 text-gray-500'
                  }`}
                >
                  {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : 
                   trend === 'down' ? <TrendingDown className="h-4 w-4" /> : null}
                  <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                </motion.div>
              </AnimatePresence>

              {/* Time Range Selector */}
              <Badge variant="secondary" className="bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}</span>
                <span className="sm:hidden">{timeRange}</span>
              </Badge>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex gap-1 p-1 bg-white/5 dark:bg-black/20 rounded-lg">
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('area')}
                className="h-8 px-3"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="h-8 px-3"
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="h-8 px-3"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'composed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('composed')}
                className="h-8 px-3"
              >
                <PieChart className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-1 p-1 bg-white/5 dark:bg-black/20 rounded-lg ml-auto">
              <Button
                variant={selectedMetric === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMetric('all')}
                className="h-8 px-3 text-xs"
              >
                All
              </Button>
              <Button
                variant={selectedMetric === 'success' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMetric('success')}
                className="h-8 px-3 text-xs"
              >
                Success
              </Button>
              <Button
                variant={selectedMetric === 'duration' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMetric('duration')}
                className="h-8 px-3 text-xs"
              >
                Duration
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

          {/* Summary Statistics */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { label: 'Avg Success', value: `${Math.round(data.reduce((sum, d) => sum + d.successRate, 0) / data.length || 0)}%`, color: 'text-green-500' },
              { label: 'Avg Duration', value: `${((data.reduce((sum, d) => sum + d.avgDuration, 0) / data.length || 0) / 1000).toFixed(1)}s`, color: 'text-blue-500' },
              { label: 'Total Runs', value: data.reduce((sum, d) => sum + d.executionCount, 0).toLocaleString(), color: 'text-purple-500' },
              { label: 'Throughput', value: `${Math.round(data.reduce((sum, d) => sum + d.throughput, 0) / data.length || 0)}/hr`, color: 'text-orange-500' }
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="text-center p-3 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10"
              >
                <p className={`text-lg font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}