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
  MoreHorizontal, 
  Play, 
  Square, 
  Settings,
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
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Recent Automations</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Latest automation activity and status updates
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Automation</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Last Run</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
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
                    className="border-border/50 hover:bg-muted/50 transition-colors"
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
                        <p className="text-xs text-muted-foreground">
                          Success: {automation.success_rate}%
                        </p>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {automation.status === 'Running' ? (
                            <Square className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
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
