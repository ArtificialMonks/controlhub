'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Automation } from '@/lib/data/repositories/automation-repository'
import { AutomationRow } from './AutomationRow'

interface Client {
  id: string
  name: string
}

interface AutomationsDataTableProps {
  automations: Automation[]
  clients: Client[]
  selectedAutomations: string[]
  onSelectionChange: (selected: string[]) => void
  onAutomationUpdate: (id: string, updates: Partial<Automation>) => void
  onStateChange?: (id: string, newState: boolean) => void
}

type SortField = 'name' | 'status' | 'client' | 'lastRun' | 'successRate' | 'duration'
type SortDirection = 'asc' | 'desc'

export function AutomationsDataTable({
  automations,
  clients,
  selectedAutomations,
  onSelectionChange,
  onAutomationUpdate,
  onStateChange
}: AutomationsDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('lastRun')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  // Sorting logic
  const sortedAutomations = [...automations].sort((a, b) => {
    let aValue: string | number | null, bValue: string | number | null

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'client':
        aValue = clients.find(c => c.id === a.client_id)?.name || ''
        bValue = clients.find(c => c.id === b.client_id)?.name || ''
        break
      case 'lastRun':
        aValue = a.last_run_at ? new Date(a.last_run_at).getTime() : 0
        bValue = b.last_run_at ? new Date(b.last_run_at).getTime() : 0
        break
      case 'successRate':
        aValue = a.success_rate
        bValue = b.success_rate
        break
      case 'duration':
        aValue = a.avg_duration_ms || 0
        bValue = b.avg_duration_ms || 0
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(automations.map(a => a.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAutomations, id])
    } else {
      onSelectionChange(selectedAutomations.filter(selectedId => selectedId !== id))
    }
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-50" />
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Control</TableHead>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedAutomations.length === automations.length && automations.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
              <div className="flex items-center gap-2">
                Name
                <SortIcon field="name" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('client')}>
              <div className="flex items-center gap-2">
                Client
                <SortIcon field="client" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('successRate')}>
              <div className="flex items-center gap-2">
                Success Rate
                <SortIcon field="successRate" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('duration')}>
              <div className="flex items-center gap-2">
                Avg Duration
                <SortIcon field="duration" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('lastRun')}>
              <div className="flex items-center gap-2">
                Last Run
                <SortIcon field="lastRun" />
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {sortedAutomations.map((automation, index) => (
              <AutomationRow
                key={automation.id}
                automation={automation}
                client={clients.find(c => c.id === automation.client_id)}
                isSelected={selectedAutomations.includes(automation.id)}
                isExpanded={expandedRows.includes(automation.id)}
                onSelect={(checked) => handleSelectOne(automation.id, checked)}
                onToggleExpand={() => toggleRowExpansion(automation.id)}
                onUpdate={(updates) => onAutomationUpdate(automation.id, updates)}
                onStateChange={onStateChange}
                index={index}
              />
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>

      {automations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No automations found</p>
        </div>
      )}
    </div>
  )
}