// src/components/dashboard/MetricsCards.tsx
'use client'

import { useState } from 'react'
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
import { DrillDownModal } from '@/components/ui/drill-down-modal'
import { AutomationsDrillDown } from '@/components/dashboard/drill-down/AutomationsDrillDown'
import { WorkflowsDrillDown } from '@/components/dashboard/drill-down/WorkflowsDrillDown'
import { ActiveUsersDrillDown } from '@/components/dashboard/drill-down/ActiveUsersDrillDown'
import type { Automation } from '@/lib/repositories/automation-repository'

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
  automations?: Automation[]
}

export function MetricsCards({ stats, automations = [] }: MetricsCardsProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const cards = [
    {
      id: 'automations',
      title: 'Automations',
      value: `${stats.total}+`,
      icon: Zap,
      color: 'bg-yellow-500',
      trend: stats.total > 0 ? 'up' : 'neutral',
      trendValue: '+12%'
    },
    {
      id: 'workflows',
      title: 'Workflows',
      value: `${stats.running + stats.stopped}+`,
      icon: GitBranch,
      color: 'bg-cyan-500',
      trend: stats.running > stats.stopped ? 'up' : 'down',
      trendValue: stats.running > stats.stopped ? '+8%' : '-3%'
    },
    {
      id: 'users',
      title: 'Active Users',
      value: '150+',
      icon: Users,
      color: 'bg-orange-500',
      trend: 'up',
      trendValue: '+24%'
    }
  ]

  const handleExport = () => {
    // Export functionality
    const data = {
      automations: stats,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metrics-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveModal(card.id)}
          >
            <Card className="relative overflow-hidden border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] group cursor-pointer">
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
                    <span className="ml-1 hidden sm:inline">{card.trendValue}</span>
                  </Badge>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>

    <DrillDownModal
      isOpen={activeModal === 'automations'}
      onClose={() => setActiveModal(null)}
      title="Automations Details"
      icon={<Zap className="h-6 w-6 text-white" />}
      color="yellow"
      onExport={handleExport}
      breadcrumbs={[
        { label: 'Dashboard', onClick: () => setActiveModal(null) },
        { label: 'Automations' }
      ]}
    >
      <AutomationsDrillDown
        automations={automations}
        totalCount={stats.total}
      />
    </DrillDownModal>

    <DrillDownModal
      isOpen={activeModal === 'workflows'}
      onClose={() => setActiveModal(null)}
      title="Workflows Analysis"
      icon={<GitBranch className="h-6 w-6 text-white" />}
      color="cyan"
      onExport={handleExport}
      breadcrumbs={[
        { label: 'Dashboard', onClick: () => setActiveModal(null) },
        { label: 'Workflows' }
      ]}
    >
      <WorkflowsDrillDown
        automations={automations}
        runningCount={stats.running}
        stoppedCount={stats.stopped}
      />
    </DrillDownModal>

    <DrillDownModal
      isOpen={activeModal === 'users'}
      onClose={() => setActiveModal(null)}
      title="Active Users Overview"
      icon={<Users className="h-6 w-6 text-white" />}
      color="orange"
      onExport={handleExport}
      breadcrumbs={[
        { label: 'Dashboard', onClick: () => setActiveModal(null) },
        { label: 'Active Users' }
      ]}
    >
      <ActiveUsersDrillDown activeUsers={150} />
    </DrillDownModal>
    </>
  )
}
