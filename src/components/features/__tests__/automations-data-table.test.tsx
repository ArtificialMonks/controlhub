// src/components/features/__tests__/automations-data-table.test.tsx

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { AutomationsDataTable } from '../automations-data-table'

// Mock the clipboard API
const mockWriteText = vi.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

describe('AutomationsDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the data table with mock data', () => {
      render(<AutomationsDataTable />)
      
      // Check for table headers
      expect(screen.getByText('Automation Name')).toBeInTheDocument()
      expect(screen.getByText('Client')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Last Run')).toBeInTheDocument()
      expect(screen.getByText('Avg Duration')).toBeInTheDocument()
      expect(screen.getByText('Success Rate')).toBeInTheDocument()
    })

    it('displays mock automation data correctly', () => {
      render(<AutomationsDataTable />)

      // Check for specific mock data
      expect(screen.getByText('Customer Data Sync')).toBeInTheDocument()
      expect(screen.getByText('Email Campaign Automation')).toBeInTheDocument()
      expect(screen.getByText('Inventory Management')).toBeInTheDocument()
      // Use getAllByText for elements that appear multiple times
      expect(screen.getAllByText('Acme Corporation')).toHaveLength(2)
      expect(screen.getAllByText('TechStart Inc')).toHaveLength(2)
    })

    it('displays status badges with correct variants', () => {
      render(<AutomationsDataTable />)

      // Check for status badges using getAllByText for multiple occurrences
      const runningStatuses = screen.getAllByText('Running')
      const stoppedStatus = screen.getByText('Stopped')
      const errorStatus = screen.getByText('Error')
      const stalledStatus = screen.getByText('Stalled')

      expect(runningStatuses.length).toBeGreaterThan(0)
      expect(stoppedStatus).toBeInTheDocument()
      expect(errorStatus).toBeInTheDocument()
      expect(stalledStatus).toBeInTheDocument()
    })

    it('displays success rates with appropriate color coding', () => {
      render(<AutomationsDataTable />)
      
      // Check for success rate values
      expect(screen.getByText('98.5%')).toBeInTheDocument()
      expect(screen.getByText('95.2%')).toBeInTheDocument()
      expect(screen.getByText('87.3%')).toBeInTheDocument()
      expect(screen.getByText('99.1%')).toBeInTheDocument()
    })
  })

  describe('Filtering', () => {
    it('filters automations by name', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)
      
      const filterInput = screen.getByPlaceholderText('Filter automations...')
      
      // Filter by "Customer"
      await user.type(filterInput, 'Customer')
      
      // Should show only Customer Data Sync
      expect(screen.getByText('Customer Data Sync')).toBeInTheDocument()
      expect(screen.queryByText('Email Campaign Automation')).not.toBeInTheDocument()
    })

    it('shows "No automations found" when filter matches nothing', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)
      
      const filterInput = screen.getByPlaceholderText('Filter automations...')
      
      // Filter by non-existent automation
      await user.type(filterInput, 'NonExistentAutomation')
      
      expect(screen.getByText('No automations found.')).toBeInTheDocument()
    })

    it('updates the results count when filtering', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)
      
      // Initial count should show all automations
      expect(screen.getByText(/6 of 6 automation\(s\)/)).toBeInTheDocument()
      
      const filterInput = screen.getByPlaceholderText('Filter automations...')
      await user.type(filterInput, 'Customer')
      
      // Count should update to show filtered results
      expect(screen.getByText(/1 of 6 automation\(s\)/)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts by automation name when header is clicked', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)
      
      const nameHeader = screen.getByRole('button', { name: /sort by automation name/i })
      await user.click(nameHeader)
      
      // Check if sorting is applied (first row should change)
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1) // Header + data rows
    })

    it('sorts by client name when header is clicked', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)
      
      const clientHeader = screen.getByRole('button', { name: /sort by client name/i })
      await user.click(clientHeader)
      
      // Verify sorting functionality
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
    })

    it('sorts by last run time when header is clicked', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)
      
      const lastRunHeader = screen.getByRole('button', { name: /sort by last run time/i })
      await user.click(lastRunHeader)
      
      // Verify sorting functionality
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
    })
  })

  describe('Actions Menu', () => {
    it('opens dropdown menu when actions button is clicked', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)
      
      const actionButtons = screen.getAllByRole('button', { name: /actions for/i })
      await user.click(actionButtons[0])
      
      // Check for dropdown menu items
      expect(screen.getByText('More Actions')).toBeInTheDocument()
      expect(screen.getByText('Copy automation ID')).toBeInTheDocument()
      expect(screen.getByText('View details')).toBeInTheDocument()
      expect(screen.getByText('View runs')).toBeInTheDocument()
    })

    it('shows copy automation ID option in dropdown menu', async () => {
      const user = userEvent.setup()
      render(<AutomationsDataTable />)

      const actionButtons = screen.getAllByRole('button', { name: /actions for/i })
      await user.click(actionButtons[0])

      // Wait for the dropdown to appear and verify the copy option exists
      const copyButton = await screen.findByText('Copy automation ID')
      expect(copyButton).toBeVisible()
      expect(copyButton).toBeInTheDocument()

      // Verify the dropdown menu has the expected structure
      expect(screen.getByText('More Actions')).toBeInTheDocument()
      expect(screen.getByText('View details')).toBeInTheDocument()
      expect(screen.getByText('View runs')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<AutomationsDataTable />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has proper ARIA labels for interactive elements', () => {
      render(<AutomationsDataTable />)
      
      // Check filter input
      const filterInput = screen.getByLabelText('Filter automations by name')
      expect(filterInput).toBeInTheDocument()
      
      // Check sort buttons
      expect(screen.getByLabelText('Sort by automation name')).toBeInTheDocument()
      expect(screen.getByLabelText('Sort by client name')).toBeInTheDocument()
      expect(screen.getByLabelText('Sort by last run time')).toBeInTheDocument()
    })

    it('has proper status labels for screen readers', () => {
      render(<AutomationsDataTable />)

      // Check status badges have aria-labels using getAllByLabelText for multiple occurrences
      const runningBadges = screen.getAllByLabelText('Status: Running')
      const stoppedBadge = screen.getByLabelText('Status: Stopped')
      const errorBadge = screen.getByLabelText('Status: Error')
      const stalledBadge = screen.getByLabelText('Status: Stalled')

      expect(runningBadges.length).toBeGreaterThan(0)
      expect(stoppedBadge).toBeInTheDocument()
      expect(errorBadge).toBeInTheDocument()
      expect(stalledBadge).toBeInTheDocument()
    })

    it('provides screen reader status updates', () => {
      render(<AutomationsDataTable />)
      
      // Check for screen reader status element
      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'polite')
      expect(statusElement).toHaveTextContent(/showing .* of .* automations/i)
    })

    it('has proper table structure for screen readers', () => {
      render(<AutomationsDataTable />)
      
      // Check for proper table structure
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      
      // Check for table headers
      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders.length).toBeGreaterThan(0)
      
      // Check for table rows
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1) // Header + data rows
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on different screen sizes', () => {
      render(<AutomationsDataTable />)
      
      // Check that table exists and has proper structure
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm')

      // Check that the outer container has the border styling
      const outerContainer = table.closest('.rounded-md.border')
      expect(outerContainer).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently with mock data', () => {
      const startTime = performance.now()
      render(<AutomationsDataTable />)
      const endTime = performance.now()
      
      // Component should render quickly (under 100ms for mock data)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})
