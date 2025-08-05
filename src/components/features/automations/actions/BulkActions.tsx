'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Play, Square, RefreshCw, Trash2, ChevronDown } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  onAction: (action: 'run' | 'stop' | 'restart' | 'delete') => void
}

export function BulkActions({ selectedCount, onAction }: BulkActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            Bulk Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction('run')}>
            <Play className="h-4 w-4 mr-2" />
            Run Selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('stop')}>
            <Square className="h-4 w-4 mr-2" />
            Stop Selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('restart')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onAction('delete')}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}