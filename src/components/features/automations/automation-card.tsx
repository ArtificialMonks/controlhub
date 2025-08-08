// src/components/features/automations/automation-card.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Play, 
  Pause, 
  Settings, 
  MoreVertical, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from "lucide-react"

export interface Automation {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "error" | "running"
  lastRun?: string
  nextRun?: string
  successRate: number
  totalRuns: number
  category: string
  tags: string[]
}

interface AutomationCardProps {
  automation: Automation
  variant?: "default" | "compact" | "detailed"
  onPlay?: (id: string) => void
  onPause?: (id: string) => void
  onSettings?: (id: string) => void
  onMore?: (id: string) => void
  className?: string
}

export function AutomationCard({
  automation,
  variant = "default",
  onPlay,
  onPause,
  onSettings,
  onMore,
  className
}: AutomationCardProps) {
  const getStatusIcon = (status: Automation["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <Pause className="h-4 w-4 text-gray-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <AlertCircle className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: Automation["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (variant === "compact") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {getStatusIcon(automation.status)}
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{automation.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {automation.category}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={getStatusColor(automation.status)}>
                {automation.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMore?.(automation.id)}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-lg leading-none truncate">
              {automation.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {automation.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {getStatusIcon(automation.status)}
            <Badge variant="secondary" className={getStatusColor(automation.status)}>
              {automation.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Success Rate</p>
            <p className="font-medium">{automation.successRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Runs</p>
            <p className="font-medium">{automation.totalRuns}</p>
          </div>
        </div>

        {/* Timing */}
        {(automation.lastRun || automation.nextRun) && (
          <div className="space-y-2 text-sm">
            {automation.lastRun && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Last run:</span>
                <span>{automation.lastRun}</span>
              </div>
            )}
            {automation.nextRun && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Next run:</span>
                <span>{automation.nextRun}</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {automation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {automation.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {automation.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{automation.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {automation.status === "active" || automation.status === "running" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPause?.(automation.id)}
              className="flex-1 min-h-[44px]" // Touch-friendly height
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onPlay?.(automation.id)}
              className="flex-1 min-h-[44px]" // Touch-friendly height
            >
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSettings?.(automation.id)}
            className="min-h-[44px] min-w-[44px]" // Touch-friendly size
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMore?.(automation.id)}
            className="min-h-[44px] min-w-[44px]" // Touch-friendly size
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
