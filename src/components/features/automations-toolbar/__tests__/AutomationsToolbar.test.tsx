// src/components/features/automations-toolbar/__tests__/AutomationsToolbar.test.tsx
/**
 * AutomationsToolbar Component Tests
 * Basic functionality testing for Quest 2.1 & 2.2 implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AutomationsToolbar } from '../AutomationsToolbar'

// Mock data for testing
const mockAutomations = [
  {
    id: 'auto-001',
    user_id: 'user-001',
    client_id: 'client-001',
    name: 'Test Automation 1',
    status: 'Running' as const,
    last_run_at: '2024-01-01T10:00:00Z',
    avg_duration_ms: 5000,
    success_rate: 95.5
  },
  {
    id: 'auto-002',
    user_id: 'user-001',
    client_id: 'client-002',
    name: 'Test Automation 2',
    status: 'Stopped' as const,
    last_run_at: '2024-01-02T11:00:00Z',
    avg_duration_ms: 3000,
    success_rate: 88.2
  }
]

// Mock clients for testing
const mockClients = [
  { id: 'client-001', name: 'Test Client 1', created_at: '2024-01-01T00:00:00Z' },
  { id: 'client-002', name: 'Test Client 2', created_at: '2024-01-02T00:00:00Z' }
]

// Default props for testing
const defaultProps = {
  automations: mockAutomations,
  clients: mockClients,
  searchTerm: '',
  selectedClient: null,
  selectedStatuses: [],
  onSearchChange: vi.fn(),
  onClientChange: vi.fn(),
  onStatusChange: vi.fn(),
  onClearFilters: vi.fn(),
  onBulkAction: vi.fn()
}

describe('AutomationsToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<AutomationsToolbar {...defaultProps} />)

      // Basic rendering test - component should render without errors
      expect(screen.getByPlaceholderText(/search automations/i)).toBeInTheDocument()
    })

    it('renders status filter buttons', () => {
      render(<AutomationsToolbar {...defaultProps} />)

      // Status chips should be present
      expect(screen.getByText('Running')).toBeInTheDocument()
      expect(screen.getByText('Stopped')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Stalled')).toBeInTheDocument()
    })

    it('renders bulk action buttons', () => {
      render(<AutomationsToolbar {...defaultProps} />)

      // Bulk action buttons should be present
      expect(screen.getByText('Run Selected')).toBeInTheDocument()
      expect(screen.getByText('Stop Selected')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently with large automation datasets', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `auto-${i}`,
        user_id: 'user-001',
        client_id: `client-${i % 10}`,
        name: `Automation ${i}`,
        status: 'Running' as const,
        last_run_at: '2024-01-01T10:00:00Z',
        avg_duration_ms: 5000,
        success_rate: 95.5
      }))

      const startTime = performance.now()
      render(<AutomationsToolbar {...defaultProps} automations={largeDataset} />)
      const endTime = performance.now()

      // Should render in reasonable time even with 100 automations
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})
