'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, CheckCircle2, Zap, Clock } from 'lucide-react'

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
      color: 'bg-blue-500',
      iconColor: 'text-white',
      trendColor: 'text-blue-500'
    },
    {
      title: 'Running',
      value: stats.running,
      icon: CheckCircle2,
      color: 'bg-green-500',
      iconColor: 'text-white',
      trendColor: 'text-green-500'
    },
    {
      title: 'Success Rate',
      value: `${Math.round(stats.avgSuccessRate)}%`,
      icon: Zap,
      color: 'bg-purple-500',
      iconColor: 'text-white',
      trendColor: 'text-purple-500'
    },
    {
      title: 'Avg Duration',
      value: `${Math.round(stats.avgDuration / 1000)}s`,
      icon: Clock,
      color: 'bg-orange-500',
      iconColor: 'text-white',
      trendColor: 'text-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] group cursor-pointer">
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color.replace('bg-', 'from-')}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {card.title}
                    </p>
                    <motion.p 
                      className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      {card.value}
                    </motion.p>
                  </div>
                  {/* Icon with enhanced styling */}
                  <motion.div 
                    className={`p-2 rounded-lg ${card.color} shadow-lg relative overflow-hidden`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Icon className={`h-4 w-4 ${card.iconColor} relative z-10`} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}