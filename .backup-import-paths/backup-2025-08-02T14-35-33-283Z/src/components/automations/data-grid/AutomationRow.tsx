'use client'

import { motion } from 'framer-motion'
import { TableCell, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  MoreHorizontal, 
  Play, 
  Square, 
  RefreshCw, 
  Settings, 
  Trash2,
  ChevronDown,
  Clock,
  Zap,
  Activity,
  AlertCircle
} from 'lucide-react'
import { Automation } from '@/lib/repositories/automation-repository'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { formatDateTime, getRelativeTime } from '@/lib/utils/date-formatting'
import { AutomationToggleButton } from '../controls/AutomationToggleButton'

interface Client {
  id: string
  name: string
}

interface AutomationRowProps {
  automation: Automation
  client?: Client
  isSelected: boolean
  isExpanded: boolean
  onSelect: (checked: boolean) => void
  onToggleExpand: () => void
  onUpdate: (updates: Partial<Automation>) => void
  onStateChange?: (id: string, newState: boolean) => void
  index: number
}

export function AutomationRow({
  automation,
  client,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onUpdate,
  onStateChange,
  index
}: AutomationRowProps) {
  const { toast } = useToast()

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ElementType }> = {
      Running: { color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: Play },
      Stopped: { color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', icon: Square },
      Error: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: AlertCircle },
      Stalled: { color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', icon: RefreshCw }
    }

    const variant = variants[status] || variants.Stopped
    const Icon = variant.icon

    return (
      <Badge variant="outline" className={cn('gap-1', variant.color)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatLastRun = (date: string | null) => {
    return getRelativeTime(date)
  }

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'run':
          // Call API to run automation
          onUpdate({ status: 'Running' })
          toast({
            title: "Automation started",
            description: `${automation.name} is now running.`
          })
          break
        case 'stop':
          // Call API to stop automation
          onUpdate({ status: 'Stopped' })
          toast({
            title: "Automation stopped",
            description: `${automation.name} has been stopped.`
          })
          break
        case 'restart':
          // Call API to restart automation
          toast({
            title: "Automation restarting",
            description: `${automation.name} is being restarted.`
          })
          break
        case 'delete':
          // Call API to delete automation
          toast({
            title: "Automation deleted",
            description: `${automation.name} has been deleted.`,
            variant: "destructive"
          })
          break
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: "Unable to perform the requested action.",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "group hover:bg-muted/50 transition-colors",
          isSelected && "bg-muted/30"
        )}
      >
        <TableCell className="w-[60px]">
          <div className="flex items-center gap-2">
            <AutomationToggleButton
              automationId={automation.id}
              automationName={automation.name}
              isRunning={automation.status === 'Running'}
              size="sm"
              onStateChange={(id, newState) => {
                onUpdate({ status: newState ? 'Running' : 'Stopped' })
                onStateChange?.(id, newState)
              }}
            />
          </div>
        </TableCell>
        <TableCell className="w-[50px]">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select ${automation.name}`}
          />
        </TableCell>
        <TableCell className="font-medium">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
            {automation.name}
          </button>
        </TableCell>
        <TableCell>{client?.name || 'Unknown'}</TableCell>
        <TableCell>{getStatusBadge(automation.status)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className={cn(
                automation.success_rate >= 80 ? 'text-green-600 dark:text-green-400' :
                automation.success_rate >= 50 ? 'text-orange-600 dark:text-orange-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {automation.success_rate}%
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {formatDuration(automation.avg_duration_ms)}
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatLastRun(automation.last_run_at)}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction('restart')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleAction('delete')}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </motion.tr>
      {isExpanded && (
        <motion.tr
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <TableCell colSpan={9} className="bg-muted/20 p-0">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Webhook URLs</p>
                  <p className="text-sm font-mono">
                    Run: {automation.n8n_run_webhook_url ? '••••••••' : 'Not configured'}
                  </p>
                  <p className="text-sm font-mono">
                    Stop: {automation.n8n_stop_webhook_url ? '••••••••' : 'Not configured'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {formatDateTime(automation.created_at)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Updated</p>
                  <p className="text-sm">
                    {formatDateTime(automation.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  View Logs
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
              </div>
            </div>
          </TableCell>
        </motion.tr>
      )}
    </>
  )
}