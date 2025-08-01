// src/app/responsive-test/page.tsx
"use client"

import * as React from "react"
import { AutomationCard, type Automation } from "@/components/automation/automation-card"
import { AutomationsToolbar, type FilterState } from "@/components/automation/automations-toolbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Mock data
const mockAutomations: Automation[] = [
  {
    id: "1",
    name: "Daily Sales Report",
    description: "Automatically generates and sends daily sales reports to the management team",
    status: "active",
    lastRun: "2 hours ago",
    nextRun: "Tomorrow at 9:00 AM",
    successRate: 98,
    totalRuns: 245,
    category: "reporting",
    tags: ["sales", "daily", "email"]
  },
  {
    id: "2",
    name: "Customer Data Sync",
    description: "Syncs customer data between CRM and marketing platform every 4 hours",
    status: "running",
    lastRun: "30 minutes ago",
    nextRun: "In 3.5 hours",
    successRate: 95,
    totalRuns: 1024,
    category: "data-sync",
    tags: ["crm", "marketing", "sync"]
  },
  {
    id: "3",
    name: "Inventory Alert System",
    description: "Monitors inventory levels and sends alerts when stock is low",
    status: "error",
    lastRun: "1 day ago",
    nextRun: "Paused",
    successRate: 87,
    totalRuns: 156,
    category: "notifications",
    tags: ["inventory", "alerts", "stock"]
  },
  {
    id: "4",
    name: "Social Media Posting",
    description: "Automatically posts scheduled content to social media platforms",
    status: "inactive",
    lastRun: "3 days ago",
    nextRun: "Not scheduled",
    successRate: 92,
    totalRuns: 89,
    category: "integration",
    tags: ["social", "content", "scheduling"]
  },
  {
    id: "5",
    name: "Weekly Analytics",
    description: "Compiles weekly performance analytics and distributes to stakeholders",
    status: "active",
    lastRun: "Yesterday",
    nextRun: "Next Monday",
    successRate: 100,
    totalRuns: 52,
    category: "reporting",
    tags: ["analytics", "weekly", "performance"]
  },
  {
    id: "6",
    name: "Lead Qualification",
    description: "Automatically qualifies and scores incoming leads based on predefined criteria",
    status: "active",
    lastRun: "5 minutes ago",
    nextRun: "Continuous",
    successRate: 94,
    totalRuns: 2341,
    category: "data-sync",
    tags: ["leads", "qualification", "scoring"]
  }
]

export default function ResponsiveTestPage() {
  const [filters, setFilters] = React.useState<FilterState>({
    search: "",
    status: "",
    category: "",
    tags: []
  })
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [isMobile, setIsMobile] = React.useState(false)

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter automations
  const filteredAutomations = mockAutomations.filter((automation) => {
    if (filters.search && !automation.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !automation.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && automation.status !== filters.status) {
      return false
    }
    if (filters.category && automation.category !== filters.category) {
      return false
    }
    if (filters.tags.length > 0 && !filters.tags.some(tag => automation.tags.includes(tag))) {
      return false
    }
    return true
  })

  const handleAutomationAction = (action: string, id: string) => {
    console.log(`${action} automation:`, id)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Responsive Design Test</h1>
          <p className="text-muted-foreground">
            Testing grid-to-card transformation and mobile-first responsive design
          </p>
        </div>

        {/* Responsive Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Features</CardTitle>
            <CardDescription>Current responsive state and features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Current Mode:</p>
                <p className={isMobile ? "text-orange-600" : "text-blue-600"}>
                  {isMobile ? "Mobile" : "Desktop"}
                </p>
              </div>
              <div>
                <p className="font-medium">Screen Width:</p>
                <p>{typeof window !== 'undefined' ? window.innerWidth : 'Unknown'}px</p>
              </div>
              <div>
                <p className="font-medium">View Mode:</p>
                <p className="capitalize">{viewMode}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">✅ Responsive Features:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• CSS Grid responsive layout (auto-fit, minmax)</li>
                <li>• Mobile-first toolbar with slide-out filter drawer</li>
                <li>• Touch-friendly 44px minimum touch targets</li>
                <li>• Progressive disclosure on mobile</li>
                <li>• Responsive card layouts (compact on mobile)</li>
                <li>• Adaptive navigation and controls</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Toolbar */}
        <AutomationsToolbar
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateNew={() => console.log("Create new automation")}
          isMobile={isMobile}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAutomations.length} of {mockAutomations.length} automations
          </p>
        </div>

        {/* Automations Grid/List */}
        <div className={cn(
          "transition-all duration-300",
          viewMode === "grid" ? (
            isMobile 
              ? "grid grid-cols-1 gap-4" // Mobile: single column
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" // Desktop: responsive grid
          ) : "space-y-4" // List view
        )}>
          {filteredAutomations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              variant={viewMode === "list" || isMobile ? "compact" : "default"}
              onPlay={(id) => handleAutomationAction("play", id)}
              onPause={(id) => handleAutomationAction("pause", id)}
              onSettings={(id) => handleAutomationAction("settings", id)}
              onMore={(id) => handleAutomationAction("more", id)}
              className={cn(
                "transition-all duration-200",
                viewMode === "list" && !isMobile && "hover:shadow-md"
              )}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredAutomations.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No automations found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
            <CardDescription>Technical implementation of responsive design</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold">🎯 CSS Grid Implementation:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Mobile: grid-cols-1 (single column)</li>
                  <li>• Tablet: grid-cols-2 (two columns)</li>
                  <li>• Desktop: grid-cols-3 (three columns)</li>
                  <li>• Large: grid-cols-4 (four columns)</li>
                  <li>• Auto-fit with minmax(300px, 1fr)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">📱 Mobile Optimizations:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 44px minimum touch targets</li>
                  <li>• Slide-out filter drawer</li>
                  <li>• Compact card variant</li>
                  <li>• Progressive disclosure</li>
                  <li>• Touch-friendly spacing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
