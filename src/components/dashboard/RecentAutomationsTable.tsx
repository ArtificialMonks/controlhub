// src/components/dashboard/RecentAutomationsTable.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatLastRun } from '@/lib/utils/client-safe'
import type { Automation } from '@/lib/repositories/automation-repository'

interface RecentAutomationsTableProps {
  automations: Automation[]
  clients: Array<{ id: string; name: string }>
}

export function RecentAutomationsTable({ automations, clients }: RecentAutomationsTableProps) {
  // Get the 5 most recent automations
  const recentAutomations = automations
    .sort((a, b) => new Date(b.last_run_at || 0).getTime() - new Date(a.last_run_at || 0).getTime())
    .slice(0, 5)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Running':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Stopped':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'Error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'Stalled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'Running': 'default',
      'Stopped': 'secondary',
      'Error': 'destructive',
      'Stalled': 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown Client'
  }

  const getClientInitials = (clientName: string) => {
    return clientName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 group">
        <CardHeader className="pb-6 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Recent Automations
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-primary/10 hover:border-primary/30 hover:scale-105 transition-all duration-300"
            >
              View All
            </Button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Monitor your most recent automation executions and performance metrics
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Client</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Automation</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Last Run</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAutomations.map((automation, index) => {
                const clientName = getClientName(automation.client_id)
                return (
                  <motion.tr
                    key={automation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="border-border/30 hover:bg-white/5 dark:hover:bg-black/20 hover:shadow-sm transition-all duration-200 group backdrop-blur-sm"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/avatars/${clientName.toLowerCase().replace(' ', '-')}.jpg`} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getClientInitials(clientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {automation.client_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground text-sm">{automation.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Success: {automation.success_rate}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {automation.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(automation.status)}
                        {getStatusBadge(automation.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">
                        {formatLastRun(automation.last_run_at)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <p className="text-sm text-foreground font-medium">
                          {automation.avg_duration_ms ? `${Math.round(automation.avg_duration_ms / 1000)}s` : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Avg Duration
                        </p>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
