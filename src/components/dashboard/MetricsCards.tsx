// src/components/dashboard/MetricsCards.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Zap, 
  GitBranch, 
  Users, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface MetricsCardsProps {
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

export function MetricsCards({ stats }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Automations',
      value: `${stats.total}+`,
      icon: Zap,
      color: 'bg-yellow-500',
      trend: stats.total > 0 ? 'up' : 'neutral',
      trendValue: '+12%'
    },
    {
      title: 'Workflows',
      value: `${stats.running + stats.stopped}+`,
      icon: GitBranch,
      color: 'bg-cyan-500',
      trend: stats.running > stats.stopped ? 'up' : 'down',
      trendValue: stats.running > stats.stopped ? '+8%' : '-3%'
    },
    {
      title: 'Active Users',
      value: '150+',
      icon: Users,
      color: 'bg-orange-500',
      trend: 'up',
      trendValue: '+24%'
    }
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${card.color} shadow-lg`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {card.value}
                    </p>
                  </div>
                </div>

                {/* Trend indicator */}
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="secondary" 
                    className={`${getTrendColor(card.trend)} bg-transparent border-0 text-xs font-medium`}
                  >
                    {getTrendIcon(card.trend)}
                    <span className="ml-1">{card.trendValue}</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
