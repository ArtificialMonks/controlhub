// src/components/features/automations-view.tsx
"use client"

import * as React from "react"
import { Grid3X3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AutomationsDataTable } from "@/components/features/automations-data-table"
import { AutomationCard } from "@/components/automation/automation-card"
import type { Automation } from "@/lib/types/automation"

export type ViewMode = "list" | "grid"

interface AutomationsViewProps {
  automations: Automation[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  loading?: boolean
  error?: Error | null
  className?: string
}

// Convert existing automation type to new card type
function convertAutomationToCard(automation: Automation) {
  return {
    id: automation.id,
    name: automation.name,
    description: `Automation for ${automation.client_id}`, // Fallback description
    status: automation.status.toLowerCase() as "active" | "inactive" | "error" | "running",
    lastRun: automation.last_run_at ? new Date(automation.last_run_at).toLocaleDateString() : undefined,
    nextRun: "Scheduled", // Placeholder
    successRate: Math.round(automation.success_rate),
    totalRuns: Math.floor(Math.random() * 1000) + 100, // Placeholder
    category: "automation", // Placeholder
    tags: ["n8n", "workflow"] // Placeholder
  }
}

export function AutomationsView({
  automations,
  viewMode,
  onViewModeChange,
  loading = false,
  error = null,
  className
}: AutomationsViewProps) {
  const handleAutomationAction = (action: string, id: string) => {
    console.log(`${action} automation:`, id)
    // In real implementation, this would call the automation service
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">View:</span>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-r-none border-r"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="rounded-l-none"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Cards</span>
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {automations.length} automation{automations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "list" ? (
        <AutomationsDataTable
          automations={automations}
          loading={loading}
          error={error}
        />
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error.message}</p>
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No automations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {automations.map((automation) => {
                const cardData = convertAutomationToCard(automation)
                return (
                  <AutomationCard
                    key={automation.id}
                    automation={cardData}
                    onPlay={(id) => handleAutomationAction("play", id)}
                    onPause={(id) => handleAutomationAction("pause", id)}
                    onSettings={(id) => handleAutomationAction("settings", id)}
                    onMore={(id) => handleAutomationAction("more", id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
