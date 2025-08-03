'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Automation } from '@/lib/repositories/automation-repository'

interface PerformanceTrendChartProps {
  automations: Automation[]
}

export function PerformanceTrendChart({ }: PerformanceTrendChartProps) {
  // Generate trend data from last 7 days
  const generateTrendData = () => {
    const days = 7
    const data = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      
      // Simulate performance data (in production, this would come from actual data)
      const successRate = Math.random() * 30 + 70 // 70-100%
      const avgDuration = Math.random() * 2000 + 1000 // 1-3 seconds
      
      data.push({
        day: dateStr,
        successRate: Math.round(successRate),
        avgDuration: Math.round(avgDuration / 1000 * 10) / 10 // Convert to seconds with 1 decimal
      })
    }
    
    return data
  }

  const data = generateTrendData()

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 rounded-lg shadow-lg border">
          <p className="text-sm font-medium mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Success Rate: <span className="font-semibold text-green-600 dark:text-green-400">{payload[0].value}%</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Avg Duration: <span className="font-semibold text-blue-600 dark:text-blue-400">{payload[1].value}s</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="h-full backdrop-blur-sm bg-card/50 border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorSuccess)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="avgDuration"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorDuration)"
                strokeWidth={2}
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-400" />
              <span className="text-muted-foreground">Success Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span className="text-muted-foreground">Avg Duration</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}