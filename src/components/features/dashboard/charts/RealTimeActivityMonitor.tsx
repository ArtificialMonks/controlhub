// src/components/features/dashboard/charts/RealTimeActivityMonitor.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts'
import { 
  Activity, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface RealTimeActivityMonitorProps {
  maxDataPoints?: number
  updateInterval?: number
}

interface ActivityEvent {
  id: string
  timestamp: Date
  type: 'start' | 'success' | 'error' | 'warning'
  automationName: string
  duration?: number
  message?: string
}

export function RealTimeActivityMonitor({
  maxDataPoints = 30,
  updateInterval = 3000
}: RealTimeActivityMonitorProps) {
  const [data, setData] = useState<{
    time: number
    active: number
    success: number
    error: number
    throughput: number
  }[]>([])
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [throughput, setThroughput] = useState(0)
  const [successRate, setSuccessRate] = useState(100)

  // Generate realistic activity data
  const generateActivityData = () => {
    const now = Date.now()
    const activeCount = Math.floor(Math.random() * 20) + 10
    const errorRate = Math.random() * 5
    const successCount = Math.floor(activeCount * (1 - errorRate / 100))
    const errorCount = activeCount - successCount
    
    return {
      time: now,
      active: activeCount,
      success: successCount,
      error: errorCount,
      throughput: Math.floor(Math.random() * 50) + 20
    }
  }

  // Generate activity events
  const generateEvent = (): ActivityEvent => {
    const types: ActivityEvent['type'][] = ['start', 'success', 'error', 'warning']
    const type = types[Math.floor(Math.random() * types.length)]
    const automations = [
      'Data Sync Workflow',
      'Email Campaign Processor',
      'Analytics Pipeline',
      'Customer Onboarding',
      'Report Generator',
      'Backup Automation',
      'API Integration Flow',
      'Data Validation Task'
    ]
    
    return {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      type,
      automationName: automations[Math.floor(Math.random() * automations.length)],
      duration: type === 'success' ? Math.floor(Math.random() * 5000) + 1000 : undefined,
      message: type === 'error' ? 'Connection timeout' : 
               type === 'warning' ? 'High latency detected' : undefined
    }
  }

  // Real-time data updates
  useEffect(() => {
    let isMounted = true

    const updateData = () => {
      if (!isMounted) return

      const newPoint = generateActivityData()

      setData(prevData => {
        const updated = [...prevData, newPoint]
        const sliced = updated.slice(-maxDataPoints)

        // Update success rate using the current data
        const recentData = sliced.slice(-10)
        const totalActive = recentData.reduce((sum, d) => sum + d.active, 0)
        const totalSuccess = recentData.reduce((sum, d) => sum + d.success, 0)
        if (totalActive > 0) {
          setSuccessRate(Math.round((totalSuccess / totalActive) * 100))
        }

        return sliced
      })

      // Update throughput
      setThroughput(newPoint.throughput)

      // Generate events randomly
      if (Math.random() < 0.3) {
        const newEvent = generateEvent()
        setEvents(prev => [newEvent, ...prev].slice(0, 5))
      }
    }

    // Initialize with some data gradually to avoid blocking
    const initializeData = () => {
      if (!isMounted) return

      const initialData = []
      for (let i = 0; i < 10; i++) { // Reduced from 20 to 10
        const point = generateActivityData()
        initialData.push(point)
      }
      setData(initialData)

      // Initialize some events
      const initialEvents = []
      for (let i = 0; i < 2; i++) { // Reduced from 3 to 2
        initialEvents.push(generateEvent())
      }
      setEvents(initialEvents)
    }

    // Initialize data with a small delay to avoid blocking
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        initializeData()
      }
    }, 100)

    // Start the interval for updates with a longer delay
    const intervalTimeout = setTimeout(() => {
      if (isMounted) {
        const interval = setInterval(() => {
          if (isMounted) {
            updateData()
          }
        }, updateInterval)

        return () => clearInterval(interval)
      }
    }, 500)

    return () => {
      isMounted = false
      clearTimeout(initTimeout)
      clearTimeout(intervalTimeout)
    }
  }, [updateInterval, maxDataPoints])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{
      value: number
    }>
  }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-black/95 backdrop-blur-xl p-3 rounded-lg shadow-xl border border-white/20"
        >
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground">Active:</span>
              <span className="text-sm font-bold text-blue-500">{payload[0]?.value}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground">Success:</span>
              <span className="text-sm font-bold text-green-500">{payload[1]?.value}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground">Error:</span>
              <span className="text-sm font-bold text-red-500">{payload[2]?.value}</span>
            </div>
          </div>
        </motion.div>
      )
    }
    return null
  }

  // Event icon based on type
  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'start': return <Clock className="h-4 w-4 text-blue-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="h-full"
    >
      <Card className="h-full border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 group">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="h-5 w-5 text-primary drop-shadow-lg" />
              </motion.div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Real-Time Activity
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Throughput Indicator */}
              <motion.div
                key={throughput}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1"
              >
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-500">{throughput}/min</span>
              </motion.div>

              {/* Success Rate */}
              <Badge 
                variant="secondary" 
                className={`bg-white/5 dark:bg-black/20 backdrop-blur-sm border ${
                  successRate >= 95 ? 'border-green-500/50 text-green-500' :
                  successRate >= 80 ? 'border-yellow-500/50 text-yellow-500' :
                  'border-red-500/50 text-red-500'
                }`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {successRate}%
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Real-time Chart */}
          <div className="h-24 sm:h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference lines */}
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
                <ReferenceLine y={15} stroke="#f59e0b" strokeDasharray="5 5" opacity={0.3} />
                
                {/* Lines */}
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={0}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={0}
                />
                <Line
                  type="monotone"
                  dataKey="error"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={0}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Feed */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <AnimatePresence>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-start gap-2 p-2 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10"
                  >
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.automationName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleTimeString()}
                        {event.duration && ` • ${(event.duration / 1000).toFixed(1)}s`}
                        {event.message && ` • ${event.message}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Live Indicators */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-500">Live</span>
              </div>
            </motion.div>
            
            <div className="text-center p-2 rounded-lg bg-white/5 dark:bg-black/20">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-sm font-bold">
                {data.length > 0 ? data[data.length - 1].active : 0}
              </p>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-white/5 dark:bg-black/20">
              <p className="text-xs text-muted-foreground">Queue</p>
              <p className="text-sm font-bold">
                {Math.floor(Math.random() * 10)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}