// src/components/dashboard/AutomationProgressSection.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface AutomationProgressSectionProps {
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

export function AutomationProgressSection({ stats }: AutomationProgressSectionProps) {
  const progressItems = [
    {
      label: 'Running',
      value: stats.running,
      total: stats.total,
      color: 'bg-green-500',
      icon: CheckCircle,
      percentage: stats.total > 0 ? Math.round((stats.running / stats.total) * 100) : 0
    },
    {
      label: 'Stopped',
      value: stats.stopped,
      total: stats.total,
      color: 'bg-yellow-500',
      icon: Clock,
      percentage: stats.total > 0 ? Math.round((stats.stopped / stats.total) * 100) : 0
    },
    {
      label: 'Error',
      value: stats.error,
      total: stats.total,
      color: 'bg-red-500',
      icon: AlertCircle,
      percentage: stats.total > 0 ? Math.round((stats.error / stats.total) * 100) : 0
    },
    {
      label: 'Stalled',
      value: stats.stalled,
      total: stats.total,
      color: 'bg-gray-500',
      icon: AlertCircle,
      percentage: stats.total > 0 ? Math.round((stats.stalled / stats.total) * 100) : 0
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Automation Status</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              {stats.total} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Current status distribution across all automations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {progressItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.color.replace('bg-', 'text-')}`} />
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {item.value}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={item.percentage} 
                    className="h-2"
                    style={{
                      '--progress-background': item.color
                    } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.percentage}%</span>
                    <span>of {item.total}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="pt-4 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(stats.avgSuccessRate)}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(stats.avgDuration)}ms
                </p>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.running + stats.stopped}
                </p>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
