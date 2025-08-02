// src/components/features/automations-data-table.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Play, Square, AlertCircle, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AutomationActionButtons } from "@/components/features/automation-action-buttons"

import {
  Automation,
  AutomationTableRow,
  AutomationStatus,
  STATUS_VARIANTS
} from "@/lib/types/automation"
import {
  mockAutomations,
  mockClients,
  formatDuration,
  formatLastRun
} from "@/lib/data/mock-automations"

/**
 * Status badge component with proper accessibility and color coding
 */
const StatusBadge: React.FC<{ status: AutomationStatus }> = ({ status }) => {
  const getStatusIcon = (status: AutomationStatus) => {
    switch (status) {
      case 'Running':
        return <Play className="h-3 w-3" aria-hidden="true" />
      case 'Stopped':
        return <Square className="h-3 w-3" aria-hidden="true" />
      case 'Error':
        return <AlertCircle className="h-3 w-3" aria-hidden="true" />
      case 'Stalled':
        return <Clock className="h-3 w-3" aria-hidden="true" />
      default:
        return null
    }
  }

  return (
    <Badge 
      variant={STATUS_VARIANTS[status]}
      className="flex items-center gap-1"
      aria-label={`Status: ${status}`}
    >
      {getStatusIcon(status)}
      {status}
    </Badge>
  )
}

/**
 * Props interface for AutomationsDataTable component
 * Expert consensus validated interface for real data integration
 */
interface AutomationsDataTableProps {
  automations?: Automation[]
  loading?: boolean
  error?: Error | null
  onStatusUpdate?: (automationId: string, status: 'Running' | 'Stopped' | 'Error' | 'Stalled') => void
}

/**
 * Transform automation data for table display
 * Now accepts automations array parameter for real data support
 */
const transformAutomationData = (automations: Automation[] = mockAutomations): AutomationTableRow[] => {
  return automations.map(automation => {
    const client = mockClients.find(c => c.id === automation.client_id)

    return {
      id: automation.id,
      name: automation.name,
      client: client?.name || 'Unknown Client',
      status: automation.status,
      lastRun: formatLastRun(automation.last_run_at),
      avgDuration: formatDuration(automation.avg_duration_ms),
      successRate: `${automation.success_rate.toFixed(1)}%`
    }
  })
}

/**
 * Create column definitions for the automations table
 */
function createColumns(
  automations?: Automation[], 
  onStatusUpdate?: (automationId: string, status: 'Running' | 'Stopped' | 'Error' | 'Stalled') => void
): ColumnDef<AutomationTableRow>[] {
  return [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label="Sort by automation name"
        >
          Automation Name
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium" title={row.getValue("name")}>
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "client",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label="Sort by client name"
        >
          Client
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div title={row.getValue("client")}>
        {row.getValue("client")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as AutomationStatus
      return <StatusBadge status={status} />
    },
  },
  {
    accessorKey: "lastRun",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label="Sort by last run time"
        >
          Last Run
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div title={`Last run: ${row.getValue("lastRun")}`}>
        {row.getValue("lastRun")}
      </div>
    ),
  },
  {
    accessorKey: "avgDuration",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label="Sort by average duration"
        >
          Avg Duration
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div title={`Average duration: ${row.getValue("avgDuration")}`}>
        {row.getValue("avgDuration")}
      </div>
    ),
  },
  {
    accessorKey: "successRate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          aria-label="Sort by success rate"
        >
          Success Rate
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const rate = row.getValue("successRate") as string
      const numericRate = parseFloat(rate)
      const colorClass = numericRate >= 95 ? "text-green-600" : 
                        numericRate >= 85 ? "text-yellow-600" : "text-red-600"
      
      return (
        <div className={`font-medium ${colorClass}`} title={`Success rate: ${rate}`}>
          {rate}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const automation = row.original

      // Get the original automation data from the automations array
      const originalAutomation = automations?.find(a => a.id === automation.id)
      
      if (!originalAutomation) {
        return <div className="text-muted-foreground">Actions unavailable</div>
      }

      return (
        <div className="flex items-center gap-2">
          {/* Run/Stop Action Buttons */}
          <AutomationActionButtons
            automation={originalAutomation}
            onActionComplete={(automationId, action, result) => {
              console.log('Action completed:', { automationId, action, result })
            }}
            onStatusUpdate={onStatusUpdate}
            size="sm"
          />

          {/* Additional Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={`More actions for ${automation.name}`}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>More Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(automation.id)}
              >
                Copy automation ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>View runs</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
  ]
}

/**
 * AutomationsDataTable component with full accessibility and functionality
 * Expert consensus validated implementation with real data support
 */
export function AutomationsDataTable({
  automations,
  loading = false,
  error = null,
  onStatusUpdate
}: AutomationsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Prepare data (must be before early returns to avoid hook order issues)
  const data = React.useMemo(() => transformAutomationData(automations), [automations])
  const columns = React.useMemo(() => createColumns(automations, onStatusUpdate), [automations, onStatusUpdate])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  // Loading state handling (UX Expert requirement)
  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="rounded-md border">
          <div className="h-12 bg-muted animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="h-16 border-t bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Error state handling (Quality Expert requirement)
  if (error) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-medium text-destructive">Failed to load automations</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred while loading automations.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No automations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Caption for Screen Readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Showing {table.getRowModel().rows.length} of {data.length} automations. 
        Table is sortable by clicking column headers.
      </div>
    </div>
  )
}
