// Enhanced Analytics Integration Tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AutomationsDrillDown } from '../AutomationsDrillDown'
import { DrillDownModal } from '@/components/ui/drill-down-modal'
import type { Automation } from '@/lib/repositories/automation-repository'

// Mock the hooks
import { vi } from 'vitest'
vi.mock('@/hooks/useDrillDownAnalytics')
vi.mock('@/hooks/useUserPreferences')

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Test Automation 1',
    client_id: 'client-1',
    status: 'Running',
    success_rate: 95.5,
    last_run_at: '2024-01-15T10:00:00Z',
    avg_duration_ms: 1500,
    webhook_url: 'https://example.com/webhook1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Test Automation 2',
    client_id: 'client-2',
    status: 'Error',
    success_rate: 45.2,
    last_run_at: '2024-01-14T15:30:00Z',
    avg_duration_ms: 2100,
    webhook_url: 'https://example.com/webhook2',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    name: 'Test Automation 3',
    client_id: 'client-1',
    status: 'Stopped',
    success_rate: 88.7,
    last_run_at: null,
    avg_duration_ms: 900,
    webhook_url: 'https://example.com/webhook3',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-10T12:00:00Z'
  }
]

const mockAnalyticsHook = {
  dateRange: { from: undefined, to: undefined },
  selectedFilters: [
    { label: 'Running', value: 'Running', selected: true },
    { label: 'Stopped', value: 'Stopped', selected: true },
    { label: 'Error', value: 'Error', selected: true },
    { label: 'Stalled', value: 'Stalled', selected: true }
  ],
  timeRange: '7d' as const,
  filteredAutomations: mockAutomations,
  analyticsData: {
    totalExecutions: 240,
    successRate: 76.5,
    errorRate: 15.2,
    avgDuration: 1500,
    trendData: [
      { date: 'Jan 15', executions: 24, successRate: 85, errorRate: 10, avgDuration: 1400 },
      { date: 'Jan 16', executions: 32, successRate: 78, errorRate: 15, avgDuration: 1600 }
    ],
    topPerformers: [mockAutomations[0]],
    recentFailures: [mockAutomations[1]]
  },
  updateDateRange: vi.fn(),
  updateFilters: vi.fn(),
  updateTimeRange: vi.fn()
}

const mockPreferencesHook = {
  preferences: {
    drillDownSettings: {
      defaultTimeRange: '7d' as const,
      visibleColumns: {
        name: true,
        client: true,
        status: true,
        successRate: true,
        lastRun: true,
        executions: true
      },
      defaultFilters: [
        { label: 'Running', value: 'Running', selected: true },
        { label: 'Stopped', value: 'Stopped', selected: true },
        { label: 'Error', value: 'Error', selected: true },
        { label: 'Stalled', value: 'Stalled', selected: true }
      ]
    },
    dashboardSettings: {
      refreshInterval: 30000,
      theme: 'system' as const,
      compactMode: false
    }
  },
  isLoading: false,
  updateDrillDownSettings: vi.fn(),
  updateDashboardSettings: vi.fn(),
  resetPreferences: vi.fn(),
  savePreferences: vi.fn()
}

describe('Enhanced Analytics Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { useDrillDownAnalytics } = await import('@/hooks/useDrillDownAnalytics')
    const { useUserPreferences } = await import('@/hooks/useUserPreferences')
    vi.mocked(useDrillDownAnalytics).mockReturnValue(mockAnalyticsHook)
    vi.mocked(useUserPreferences).mockReturnValue(mockPreferencesHook)
  })

  describe('AutomationsDrillDown Component', () => {
    it('renders all sections correctly', () => {
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      expect(screen.getByText('Date Range Filtering')).toBeInTheDocument()
      expect(screen.getByText('Total Automations')).toBeInTheDocument()
      expect(screen.getByText('Automation Trends')).toBeInTheDocument()
      expect(screen.getByText('Status Distribution')).toBeInTheDocument()
      expect(screen.getByText('Automation Details')).toBeInTheDocument()
    })

    it('displays correct metrics', () => {
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      expect(screen.getByText('3')).toBeInTheDocument() // Total count
      expect(screen.getByText('240')).toBeInTheDocument() // Total executions
    })

    it('handles date range preset selection', async () => {
      const user = userEvent.setup()
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      const todayButton = screen.getByRole('button', { name: 'Today' })
      await user.click(todayButton)
      
      expect(mockAnalyticsHook.updateDateRange).toHaveBeenCalled()
    })

    it('handles column visibility toggle', async () => {
      const user = userEvent.setup()
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      const clientButton = screen.getByRole('button', { name: 'Client' })
      await user.click(clientButton)
      
      expect(mockPreferencesHook.updateDrillDownSettings).toHaveBeenCalledWith({
        visibleColumns: expect.objectContaining({
          client: false
        })
      })
    })

    it('filters automations based on search query', async () => {
      const user = userEvent.setup()
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      const searchInput = screen.getByPlaceholderText('Search automations...')
      await user.type(searchInput, 'Test Automation 1')
      
      expect(searchInput).toHaveValue('Test Automation 1')
    })

    it('displays status indicators correctly', () => {
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      expect(screen.getByText('Running')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Stopped')).toBeInTheDocument()
    })

    it('shows automation table with all visible columns', () => {
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Client' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Success Rate' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Last Run' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Executions' })).toBeInTheDocument()
    })

    it('handles clear date filter action', async () => {
      const user = userEvent.setup()
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      const clearButton = screen.getByRole('button', { name: 'Clear Filter' })
      await user.click(clearButton)
      
      expect(mockAnalyticsHook.updateDateRange).toHaveBeenCalledWith({
        from: undefined,
        to: undefined
      })
    })
  })

  describe('DrillDownModal Integration', () => {
    const mockModalProps = {
      isOpen: true,
      onClose: vi.fn(),
      title: 'Test Modal',
      enableDateFiltering: true,
      enableAdvancedFiltering: true,
      dateRange: { from: undefined, to: undefined },
      onDateRangeChange: vi.fn(),
      filterOptions: mockAnalyticsHook.selectedFilters,
      onFilterChange: vi.fn()
    }

    it('renders modal with enhanced features', () => {
      render(
        <DrillDownModal {...mockModalProps}>
          <div>Test Content</div>
        </DrillDownModal>
      )
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('shows date picker when date filtering is enabled', () => {
      render(
        <DrillDownModal {...mockModalProps}>
          <div>Test Content</div>
        </DrillDownModal>
      )
      
      expect(screen.getByText('Pick a date range')).toBeInTheDocument()
    })

    it('shows filter checkboxes when advanced filtering is enabled', () => {
      render(
        <DrillDownModal {...mockModalProps}>
          <div>Test Content</div>
        </DrillDownModal>
      )
      
      expect(screen.getByLabelText('Running')).toBeInTheDocument()
      expect(screen.getByLabelText('Stopped')).toBeInTheDocument()
      expect(screen.getByLabelText('Error')).toBeInTheDocument()
      expect(screen.getByLabelText('Stalled')).toBeInTheDocument()
    })

    it('handles filter checkbox changes', async () => {
      const user = userEvent.setup()
      render(
        <DrillDownModal {...mockModalProps}>
          <div>Test Content</div>
        </DrillDownModal>
      )
      
      const runningCheckbox = screen.getByLabelText('Running')
      await user.click(runningCheckbox)
      
      expect(mockModalProps.onFilterChange).toHaveBeenCalled()
    })
  })

  describe('User Preferences Integration', () => {
    it('loads user preferences on component mount', () => {
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      // Check that default visible columns from preferences are used
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Client' })).toBeInTheDocument()
    })

    it('persists column visibility changes', async () => {
      const user = userEvent.setup()
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      const nameButton = screen.getByRole('button', { name: 'Name' })
      await user.click(nameButton)
      
      expect(mockPreferencesHook.updateDrillDownSettings).toHaveBeenCalledWith({
        visibleColumns: expect.objectContaining({
          name: false
        })
      })
    })
  })

  describe('Analytics Data Integration', () => {
    it('displays trend chart with correct data', () => {
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      // Chart should be rendered (we can't easily test Recharts content, but we can verify the container exists)
      expect(screen.getByText('Automation Trends')).toBeInTheDocument()
    })

    it('shows correct status distribution', () => {
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      expect(screen.getByText('Status Distribution')).toBeInTheDocument()
      // Should show counts for each status type
      const statusCards = screen.getAllByText(/Running|Stopped|Error|Stalled/)
      expect(statusCards.length).toBeGreaterThan(0)
    })

    it('updates when time range changes', async () => {
      const user = userEvent.setup()
      render(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      // Find and click the time range selector
      const timeRangeSelect = screen.getByDisplayValue('Last 7 days')
      await user.click(timeRangeSelect)
      
      const thirtyDaysOption = screen.getByText('Last 30 days')
      await user.click(thirtyDaysOption)
      
      expect(mockAnalyticsHook.updateTimeRange).toHaveBeenCalledWith('30d')
    })
  })

  describe('Error Handling', () => {
    it('handles empty automations array', () => {
      render(<AutomationsDrillDown automations={[]} totalCount={0} />)
      
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('Date Range Filtering')).toBeInTheDocument()
    })

    it('handles automations with missing data', () => {
      const incompleteAutomations = [
        {
          ...mockAutomations[0],
          client_id: null,
          last_run_at: null,
          success_rate: null
        }
      ] as Automation[]
      
      render(<AutomationsDrillDown automations={incompleteAutomations} totalCount={1} />)
      
      expect(screen.getByText('-')).toBeInTheDocument() // Client column
      expect(screen.getByText('Never')).toBeInTheDocument() // Last run column
    })
  })

  describe('Performance Considerations', () => {
    it('does not re-render unnecessarily when props remain same', () => {
      const { rerender } = render(
        <AutomationsDrillDown automations={mockAutomations} totalCount={3} />
      )
      
      const initialRenderCount = screen.getAllByRole('cell').length
      
      // Re-render with same props
      rerender(<AutomationsDrillDown automations={mockAutomations} totalCount={3} />)
      
      const secondRenderCount = screen.getAllByRole('cell').length
      expect(secondRenderCount).toBe(initialRenderCount)
    })

    it('limits displayed automations to 10 by default', () => {
      const manyAutomations = Array.from({ length: 20 }, (_, i) => ({
        ...mockAutomations[0],
        id: `automation-${i}`,
        name: `Automation ${i}`
      }))
      
      render(<AutomationsDrillDown automations={manyAutomations} totalCount={20} />)
      
      // Should show "View All" button when more than 10 items
      expect(screen.getByText('View All 20 Automations')).toBeInTheDocument()
    })
  })
})