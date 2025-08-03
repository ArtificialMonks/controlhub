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
          <Card className="relative overflow-hidden border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] group">
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color.replace('bg-', 'from-')}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <motion.div 
                    className={`p-3 rounded-xl ${card.color} shadow-lg relative overflow-hidden`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <card.icon className="h-6 w-6 text-white relative z-10" />
                  </motion.div>
                  
                  {/* Content */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
                      {card.title}
                    </p>
                    <motion.p 
                      className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      {card.value}
                    </motion.p>
                  </div>
                </div>

                {/* Trend indicator */}
                <motion.div 
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <Badge 
                    variant="secondary" 
                    className={`${getTrendColor(card.trend)} bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 text-xs font-medium group-hover:scale-110 transition-transform`}
                  >
                    <motion.div
                      animate={card.trend === 'up' ? { y: [0, -2, 0] } : card.trend === 'down' ? { y: [0, 2, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {getTrendIcon(card.trend)}
                    </motion.div>
                    <span className="ml-1">{card.trendValue}</span>
                  </Badge>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
