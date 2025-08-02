'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface StatusDistributionChartProps {
  stats: {
    running: number
    stopped: number
    error: number
    stalled: number
  }
}

export function StatusDistributionChart({ stats }: StatusDistributionChartProps) {
  const data = [
    { name: 'Running', value: stats.running, color: '#10b981' },
    { name: 'Stopped', value: stats.stopped, color: '#6b7280' },
    { name: 'Error', value: stats.error, color: '#ef4444' },
    { name: 'Stalled', value: stats.stalled, color: '#f59e0b' }
  ].filter(item => item.value > 0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-2 rounded-lg shadow-lg border">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Count: <span className="font-semibold">{payload[0].value}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {Math.round((payload[0].value / (stats.running + stats.stopped + stats.error + stats.stalled)) * 100)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="h-full backdrop-blur-sm bg-card/50 border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}