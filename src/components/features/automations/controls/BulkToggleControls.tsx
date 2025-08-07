'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { BulkAutomationToggleButton } from './AutomationToggleButton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Automation } from '@/lib/data/repositories/automation-repository'
import { cn } from '@/lib/utils'

interface BulkToggleControlsProps {
  selectedAutomations: string[]
  filteredAutomations: Automation[]
  allAutomations: Automation[]
  onBulkAction: (action: 'run' | 'stop', automationIds: string[]) => Promise<void>
  onClearSelection: () => void
  className?: string
}

export function BulkToggleControls({
  selectedAutomations,
  filteredAutomations,
  allAutomations,
  onBulkAction,
  onClearSelection,
  className
}: BulkToggleControlsProps) {
  const [isLoading, setIsLoading] = useState<'run' | 'stop' | null>(null)
  const { toast } = useToast()

  // Calculate statistics for selected automations
  const selectedAutomationData = allAutomations.filter(a => 
    selectedAutomations.includes(a.id)
  )
  
  const runningCount = selectedAutomationData.filter(a => a.status === 'Running').length
  const stoppedCount = selectedAutomationData.filter(a => 
    a.status === 'Stopped' || a.status === 'Error' || a.status === 'Stalled'
  ).length

  // Calculate filtered automation statistics
  const filteredRunningCount = filteredAutomations.filter(a => a.status === 'Running').length
  const filteredStoppedCount = filteredAutomations.filter(a => 
    a.status === 'Stopped' || a.status === 'Error' || a.status === 'Stalled'
  ).length

  const handleBulkAction = async (action: 'run' | 'stop', type: 'selected' | 'filtered') => {
    setIsLoading(action)
    
    try {
      const targetAutomations = type === 'selected' 
        ? selectedAutomations 
        : filteredAutomations.map(a => a.id)

      if (targetAutomations.length === 0) {
        toast({
          title: 'No automations to process',
          description: `No ${type} automations available for ${action} operation.`,
          variant: 'destructive'
        })
        return
      }

      await onBulkAction(action, targetAutomations)

      toast({
        title: `Bulk ${action} initiated`,
        description: `${action === 'run' ? 'Starting' : 'Stopping'} ${targetAutomations.length} ${type} automations.`,
        duration: 4000,
      })

      // Clear selection after successful bulk action on selected items
      if (type === 'selected') {
        onClearSelection()
      }
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
      toast({
        title: `Bulk ${action} failed`,
        description: 'Some automations may not have been processed. Please check individual statuses.',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setIsLoading(null)
    }
  }

  // Don't render if no automations are available
  if (filteredAutomations.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected Automations Controls */}
      <AnimatePresence mode="wait">
        {selectedAutomations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 rounded-lg p-4 space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {selectedAutomations.length} Selected
                </Badge>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{runningCount} running</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span>{stoppedCount} stopped</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClearSelection}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              {stoppedCount > 0 && (
                <BulkAutomationToggleButton
                  action="run"
                  count={stoppedCount}
                  disabled={isLoading !== null}
                  isLoading={isLoading === 'run'}
                  onAction={() => handleBulkAction('run', 'selected')}
                />
              )}
              
              {runningCount > 0 && (
                <BulkAutomationToggleButton
                  action="stop"
                  count={runningCount}
                  disabled={isLoading !== null}
                  isLoading={isLoading === 'stop'}
                  onAction={() => handleBulkAction('stop', 'selected')}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtered Automations Controls */}
      <div className="relative overflow-hidden border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md hover:bg-white/10 dark:hover:bg-black/30 transition-all duration-300 rounded-lg p-4 space-y-3 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <XCircle className="w-3 h-3" />
              {filteredAutomations.length} Filtered
            </Badge>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{filteredRunningCount} running</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span>{filteredStoppedCount} stopped</span>
              </div>
            </div>
          </div>

          <span className="text-xs text-muted-foreground">
            Apply to all filtered results
          </span>
        </div>

        <div className="flex items-center gap-2">
          {filteredStoppedCount > 0 && (
            <BulkAutomationToggleButton
              action="run"
              count={filteredStoppedCount}
              disabled={isLoading !== null}
              isLoading={isLoading === 'run'}
              onAction={() => handleBulkAction('run', 'filtered')}
            />
          )}
          
          {filteredRunningCount > 0 && (
            <BulkAutomationToggleButton
              action="stop"
              count={filteredRunningCount}
              disabled={isLoading !== null}
              isLoading={isLoading === 'stop'}
              onAction={() => handleBulkAction('stop', 'filtered')}
            />
          )}
        </div>

        {/* Quick action info */}
        <div className="text-xs text-muted-foreground">
          Quick actions will affect all automations matching your current filters.
        </div>
      </div>

      {/* Action Summary */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden border border-blue-500/20 bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-md rounded-lg p-3"
        >
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>
              Processing bulk {isLoading} operation... This may take a few moments.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

