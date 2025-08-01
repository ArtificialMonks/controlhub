// src/app/integration-test/page.tsx
"use client"

import * as React from "react"
import { AutomationsView, type ViewMode } from "@/components/features/automations-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Automation } from "@/lib/types/automation"

// Mock automation data that matches the existing type structure
const mockAutomations: Automation[] = [
  {
    id: "1",
    user_id: "user-1",
    name: "Daily Sales Report",
    client_id: "client-1",
    n8n_run_webhook_url: "https://example.com/webhook1",
    n8n_stop_webhook_url: "https://example.com/stop1",
    status: "Running",
    last_run_at: "2025-01-01T10:00:00Z",
    avg_duration_ms: 5000,
    success_rate: 98,
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2025-01-01T10:00:00Z"
  },
  {
    id: "2",
    user_id: "user-1",
    name: "Customer Data Sync",
    client_id: "client-2",
    n8n_run_webhook_url: "https://example.com/webhook2",
    n8n_stop_webhook_url: "https://example.com/stop2",
    status: "Running",
    last_run_at: "2025-01-01T09:30:00Z",
    avg_duration_ms: 3000,
    success_rate: 95,
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2025-01-01T09:30:00Z"
  },
  {
    id: "3",
    user_id: "user-1",
    name: "Inventory Alert System",
    client_id: "client-3",
    n8n_run_webhook_url: "https://example.com/webhook3",
    n8n_stop_webhook_url: null,
    status: "Error",
    last_run_at: "2024-12-31T08:00:00Z",
    avg_duration_ms: 2000,
    success_rate: 87,
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2024-12-31T08:00:00Z"
  },
  {
    id: "4",
    user_id: "user-1",
    name: "Social Media Posting",
    client_id: "client-4",
    n8n_run_webhook_url: "https://example.com/webhook4",
    n8n_stop_webhook_url: "https://example.com/stop4",
    status: "Stopped",
    last_run_at: "2024-12-29T15:00:00Z",
    avg_duration_ms: 4000,
    success_rate: 92,
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2024-12-29T15:00:00Z"
  },
  {
    id: "5",
    user_id: "user-1",
    name: "Weekly Analytics",
    client_id: "client-5",
    n8n_run_webhook_url: "https://example.com/webhook5",
    n8n_stop_webhook_url: "https://example.com/stop5",
    status: "Running",
    last_run_at: "2024-12-31T23:00:00Z",
    avg_duration_ms: 6000,
    success_rate: 100,
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2024-12-31T23:00:00Z"
  },
  {
    id: "6",
    user_id: "user-1",
    name: "Lead Qualification",
    client_id: "client-6",
    n8n_run_webhook_url: "https://example.com/webhook6",
    n8n_stop_webhook_url: "https://example.com/stop6",
    status: "Running",
    last_run_at: "2025-01-01T11:55:00Z",
    avg_duration_ms: 1500,
    success_rate: 94,
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2025-01-01T11:55:00Z"
  }
]

export default function IntegrationTestPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Automation Cards Integration Test</h1>
          <p className="text-muted-foreground">
            Testing the integration of AutomationCard components with existing AutomationsDataTable
          </p>
        </div>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>View mode toggle and component integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Current View Mode:</p>
                <p className="capitalize text-primary">{viewMode}</p>
              </div>
              <div>
                <p className="font-medium">Data Source:</p>
                <p>Existing Automation Type</p>
              </div>
              <div>
                <p className="font-medium">Components:</p>
                <p>AutomationsView + AutomationsDataTable</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">✅ Integration Features:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• View mode toggle (List ↔ Grid)</li>
                <li>• Backward compatibility (defaults to list view)</li>
                <li>• Existing data type compatibility</li>
                <li>• Seamless switching between views</li>
                <li>• Maintains all filtering functionality</li>
                <li>• Preserves existing user experience</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* AutomationsView Component */}
        <Card>
          <CardHeader>
            <CardTitle>Automations Management</CardTitle>
            <CardDescription>Switch between list and card views</CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationsView
              automations={mockAutomations}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              loading={false}
              error={null}
            />
          </CardContent>
        </Card>

        {/* Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
            <CardDescription>How the integration works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold">🔧 Component Structure:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• AutomationsView (new wrapper component)</li>
                  <li>• AutomationsDataTable (existing table view)</li>
                  <li>• AutomationCard (new card components)</li>
                  <li>• View mode toggle with List/Grid icons</li>
                  <li>• Type conversion for compatibility</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🎯 Integration Points:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Dashboard content updated to use AutomationsView</li>
                  <li>• Existing Automation type preserved</li>
                  <li>• Default to list view for backward compatibility</li>
                  <li>• All existing functionality maintained</li>
                  <li>• No breaking changes to existing code</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
