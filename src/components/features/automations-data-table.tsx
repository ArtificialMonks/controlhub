"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { 
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
 * Transform automation data for table display
 */
const transformAutomationData = (): AutomationTableRow[] => {
  return mockAutomations.map(automation => {
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
 * Column definitions for the automations table
 */
const columns: ColumnDef<AutomationTableRow>[] = [
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
    enableHiding: false,
    cell: ({ row }) => {
      const automation = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0"
              aria-label={`Actions for ${automation.name}`}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
      )
    },
  },
]

/**
 * AutomationsDataTable component with full accessibility and functionality
 */
export function AutomationsDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  
  const data = React.useMemo(() => transformAutomationData(), [])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter automations..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            aria-label="Filter automations by name"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {data.length} automation(s)
        </div>
      </div>

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
            {table.getFilteredRowModel().rows?.length ? (
              table.getFilteredRowModel().rows.map((row) => (
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
        Showing {table.getFilteredRowModel().rows.length} of {data.length} automations. 
        Table is sortable by clicking column headers.
      </div>
    </div>
  )
}
