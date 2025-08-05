'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle2, XCircle, AlertCircle, Zap, Clock } from 'lucide-react'

interface AutomationStatsCardsProps {
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

export function AutomationStatsCards({ stats }: AutomationStatsCardsProps) {
  const cards = [
    {
      title: 'Total Automations',
      value: stats.total,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Running',
      value: stats.running,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      title: 'Success Rate',
      value: `${Math.round(stats.avgSuccessRate)}%`,
      icon: Zap,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: 'Avg Duration',
      value: `${Math.round(stats.avgDuration / 1000)}s`,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`relative overflow-hidden border ${card.borderColor} ${card.bgColor} backdrop-blur-sm`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  {card.title}
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
              {/* Decorative gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-50 pointer-events-none`} />
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}