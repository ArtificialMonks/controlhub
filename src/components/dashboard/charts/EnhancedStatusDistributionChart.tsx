// src/components/dashboard/charts/EnhancedStatusDistributionChart.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Cell, 
  Pie, 
  PieChart, 
  RadialBar,
  RadialBarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer, 
  Tooltip,
  Sector
} from 'recharts'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  PieChart as PieChartIcon,
  BarChart3,
  Target,
  Activity
} from 'lucide-react'

interface EnhancedStatusDistributionChartProps {
  stats: {
    total: number
    running: number
    stopped: number
    error: number
    stalled: number
    avgSuccessRate: number
    avgDuration: number
  }
}

type ChartType = 'pie' | 'radial' | 'radar'

export function EnhancedStatusDistributionChart({ stats }: EnhancedStatusDistributionChartProps) {
  const [chartType, setChartType] = useState<ChartType>('pie')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  const data = [
    { 
      name: 'Running', 
      value: stats.running, 
      color: '#10b981',
      icon: CheckCircle,
      percentage: stats.total > 0 ? (stats.running / stats.total * 100).toFixed(1) : '0'
    },
    { 
      name: 'Stopped', 
      value: stats.stopped, 
      color: '#6b7280',
      icon: Clock,
      percentage: stats.total > 0 ? (stats.stopped / stats.total * 100).toFixed(1) : '0'
    },
    { 
      name: 'Error', 
      value: stats.error, 
      color: '#ef4444',
      icon: XCircle,
      percentage: stats.total > 0 ? (stats.error / stats.total * 100).toFixed(1) : '0'
    },
    { 
      name: 'Stalled', 
      value: stats.stalled, 
      color: '#f59e0b',
      icon: AlertCircle,
      percentage: stats.total > 0 ? (stats.stalled / stats.total * 100).toFixed(1) : '0'
    }
  ].filter(item => item.value > 0)

  // Radar chart data
  const radarData = [
    {
      metric: 'Availability',
      value: ((stats.running + stats.stopped) / stats.total * 100) || 0,
      fullMark: 100
    },
    {
      metric: 'Success Rate',
      value: stats.avgSuccessRate || 0,
      fullMark: 100
    },
    {
      metric: 'Performance',
      value: Math.max(0, 100 - (stats.avgDuration / 50)) || 0, // Normalize duration
      fullMark: 100
    },
    {
      metric: 'Reliability',
      value: stats.total > 0 ? ((stats.total - stats.error) / stats.total * 100) : 0,
      fullMark: 100
    },
    {
      metric: 'Efficiency',
      value: stats.total > 0 ? (stats.running / stats.total * 100) : 0,
      fullMark: 100
    }
  ]

  // Animate through segments
  useEffect(() => {
    if (!isAnimating || data.length === 0) return
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % data.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [data.length, isAnimating])

  // Custom active shape for pie chart
  const renderActiveShape = (props: unknown) => {
    const RADIAN = Math.PI / 180
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props as {
      cx: number
      cy: number
      midAngle: number
      innerRadius: number
      outerRadius: number
      startAngle: number
      endAngle: number
      fill: string
      payload: { name: string; percentage: string }
      value: number
    }
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-2xl font-bold">
          {payload.percentage}%
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-sm font-medium">
          {payload.name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`${value} automations`}
        </text>
      </g>
    )
  }

  // Enhanced tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{
      payload: {
        name: string
        value: number
        color: string
        icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
        percentage: string
      }
    }>
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const Icon = data.icon
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-black/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-white/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5" style={{ color: data.color }} />
            <p className="text-sm font-semibold">{data.name}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground">Count:</span>
              <span className="text-sm font-bold">{data.value}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground">Percentage:</span>
              <span className="text-sm font-bold">{data.percentage}%</span>
            </div>
          </div>
        </motion.div>
      )
    }
    return null
  }

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'radial':
        return (
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="20%" 
            outerRadius="90%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid stroke="none" />
            <PolarAngleAxis type="number" domain={[0, stats.total]} style={{ display: 'none' }} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill="#8884d8"
              label={{
                position: 'insideStart',
                fill: '#fff'
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </RadialBar>
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        )

      case 'radar':
        return (
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip 
              formatter={(value: number) => `${Math.round(value)}%`}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)'
              }}
            />
          </RadarChart>
        )

      default: // pie
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={isAnimating ? 800 : 0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
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
                Status Distribution
              </CardTitle>
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex gap-1 p-1 bg-white/5 dark:bg-black/20 rounded-lg">
              <Button
                variant={chartType === 'pie' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('pie')}
                className="h-8 w-8 p-0"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'radial' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('radial')}
                className="h-8 w-8 p-0"
              >
                <Target className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'radar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('radar')}
                className="h-8 w-8 p-0"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {chartType === 'radar' ? 'Performance metrics overview' : 'Current automation status breakdown'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success rate highlight */}
          <motion.div 
            className="text-center mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="inline-flex items-center justify-center">
              <div className="text-center p-4 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10">
                <motion.p 
                  className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-1"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  style={{ backgroundSize: "200% 100%" }}
                >
                  {Math.round(stats.avgSuccessRate)}%
                </motion.p>
                <p className="text-sm text-muted-foreground">
                  Overall Success Rate
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

          {/* Legend for pie/radial charts */}
          {chartType !== 'radar' && (
            <motion.div 
              className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {data.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div 
                    key={item.name}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 dark:hover:bg-black/20 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="relative">
                      <div 
                        className="w-3 h-3 rounded-full shadow-lg" 
                        style={{ 
                          backgroundColor: item.color,
                          boxShadow: `0 0 10px ${item.color}40`
                        }}
                      />
                      {activeIndex === index && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.name} ({item.value})
                    </span>
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs bg-white/5 dark:bg-black/20"
                    >
                      {item.percentage}%
                    </Badge>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Performance Indicators for radar chart */}
          {chartType === 'radar' && (
            <motion.div 
              className="grid grid-cols-3 gap-2 pt-4 border-t border-border/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {radarData.slice(0, 3).map((metric) => (
                <motion.div
                  key={metric.metric}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-2 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10"
                >
                  <p className="text-xs text-muted-foreground">{metric.metric}</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.round(metric.value)}%
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}