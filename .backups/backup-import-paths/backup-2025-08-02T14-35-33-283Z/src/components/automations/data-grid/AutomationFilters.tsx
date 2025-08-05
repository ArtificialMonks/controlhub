'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Search, X } from 'lucide-react'
import { Automation } from '@/lib/repositories/automation-repository'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/date-formatting'

interface Client {
  id: string
  name: string
}

interface AutomationFiltersProps {
  automations: Automation[]
  clients: Client[]
  onFilterChange: (filtered: Automation[]) => void
}

export function AutomationFilters({ automations, clients, onFilterChange }: AutomationFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })

  useEffect(() => {
    let filtered = [...automations]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(automation =>
        automation.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(automation => automation.status === statusFilter)
    }

    // Client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(automation => automation.client_id === clientFilter)
    }

    // Date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(automation => {
        if (!automation.last_run_at) return false
        const lastRun = new Date(automation.last_run_at)
        return lastRun >= dateRange.from! && lastRun <= dateRange.to!
      })
    }

    onFilterChange(filtered)
  }, [searchQuery, statusFilter, clientFilter, dateRange, automations, onFilterChange])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setClientFilter('all')
    setDateRange({ from: undefined, to: undefined })
  }

  const activeFiltersCount = [
    searchQuery,
    statusFilter !== 'all',
    clientFilter !== 'all',
    dateRange.from && dateRange.to
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Running">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Running
              </div>
            </SelectItem>
            <SelectItem value="Stopped">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                Stopped
              </div>
            </SelectItem>
            <SelectItem value="Error">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Error
              </div>
            </SelectItem>
            <SelectItem value="Stalled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                Stalled
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Client Filter */}
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Picker */}
        <DatePickerWithRange 
          date={dateRange}
          onDateChange={setDateRange}
          className="w-full sm:w-auto"
        />

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSearchQuery('')}
              />
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setStatusFilter('all')}
              />
            </Badge>
          )}
          {clientFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Client: {clients.find(c => c.id === clientFilter)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setClientFilter('all')}
              />
            </Badge>
          )}
          {dateRange.from && dateRange.to && (
            <Badge variant="secondary" className="gap-1">
              Date: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setDateRange({ from: undefined, to: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}