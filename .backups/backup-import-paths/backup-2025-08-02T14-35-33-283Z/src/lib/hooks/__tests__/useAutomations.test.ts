// src/lib/hooks/__tests__/useAutomations.test.ts
/**
 * Unit tests for useAutomations hook
 * Quest 1.5: Real-Time Data Display - Hook testing
 * Quality Expert validated comprehensive test coverage
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAutomations } from '../useAutomations'

// Type for real-time callback payload
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'INVALID_EVENT'
  new?: Record<string, unknown>
  old?: Record<string, unknown>
}

// Mock fetch globally
global.fetch = vi.fn()

// Mock Supabase client
const mockChannel = {
  on: vi.fn(() => mockChannel),
  subscribe: vi.fn(() => mockChannel),
  unsubscribe: vi.fn()
}

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel)
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

describe('useAutomations hook', () => {
  let mockFetch: Mock

  beforeEach(() => {
    mockFetch = global.fetch as Mock
    vi.clearAllMocks()
  })

  describe('Initial data fetching', () => {
    it('should fetch automations on mount', async () => {
      // Arrange
      const mockAutomations = [
        { id: 'auto-1', name: 'Test Automation', status: 'Running' }
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAutomations)
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      // Assert initial state
      expect(result.current.loading).toBe(true)
      expect(result.current.data).toEqual([])
      expect(result.current.error).toBe(null)

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockAutomations)
      expect(result.current.error).toBe(null)
      expect(mockFetch).toHaveBeenCalledWith('/api/automations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
    })

    it('should handle fetch errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Act
      const { result } = renderHook(() => useAutomations())

      // Wait for error state
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert
      expect(result.current.data).toEqual([])
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network error')
    })

    it('should handle HTTP error responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({ message: 'Authentication required' })
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      // Wait for error state
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert
      expect(result.current.error?.message).toBe('Authentication required')
    })

    it('should handle invalid response format', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue('invalid-format')
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      // Wait for error state
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert
      expect(result.current.error?.message).toBe('Invalid response format: expected array of automations')
    })
  })

  describe('Real-time subscription', () => {
    it('should setup real-time subscription on mount', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })

      // Act
      renderHook(() => useAutomations())

      // Assert
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('automations-realtime')
      expect(mockChannel.on).toHaveBeenCalledWith('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'automations'
      }, expect.any(Function))
      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should cleanup subscription on unmount', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })

      // Act
      const { unmount } = renderHook(() => useAutomations())
      unmount()

      // Assert
      expect(mockChannel.unsubscribe).toHaveBeenCalledOnce()
    })

    it('should handle INSERT events correctly', async () => {
      // Arrange
      let realtimeCallback: (payload: RealtimePayload) => void
      mockChannel.on.mockImplementation((event, config, callback) => {
        realtimeCallback = callback
        return mockChannel
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate real-time INSERT event
      const newAutomation = { id: 'auto-new', name: 'New Automation' }
      realtimeCallback({
        eventType: 'INSERT',
        new: newAutomation
      })

      // Assert
      await waitFor(() => {
        expect(result.current.data).toContainEqual(newAutomation)
      })
    })

    it('should handle UPDATE events correctly', async () => {
      // Arrange
      let realtimeCallback: (payload: RealtimePayload) => void
      mockChannel.on.mockImplementation((event, config, callback) => {
        realtimeCallback = callback
        return mockChannel
      })

      const initialData = [
        { id: 'auto-1', name: 'Original Name', status: 'Running' }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(initialData)
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate real-time UPDATE event
      const updatedAutomation = { id: 'auto-1', name: 'Updated Name', status: 'Stopped' }
      realtimeCallback({
        eventType: 'UPDATE',
        new: updatedAutomation
      })

      // Assert
      await waitFor(() => {
        expect(result.current.data[0]).toEqual(updatedAutomation)
      })
    })

    it('should handle DELETE events correctly', async () => {
      // Arrange
      let realtimeCallback: (payload: RealtimePayload) => void
      mockChannel.on.mockImplementation((event, config, callback) => {
        realtimeCallback = callback
        return mockChannel
      })

      const initialData = [
        { id: 'auto-1', name: 'To Delete' },
        { id: 'auto-2', name: 'To Keep' }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(initialData)
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate real-time DELETE event
      realtimeCallback({
        eventType: 'DELETE',
        old: { id: 'auto-1' }
      })

      // Assert
      await waitFor(() => {
        expect(result.current.data).toHaveLength(1)
        expect(result.current.data[0].id).toBe('auto-2')
      })
    })
  })

  describe('Refetch functionality', () => {
    it('should provide refetch function', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should refetch data when refetch is called', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })

      // Act
      const { result } = renderHook(() => useAutomations())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear previous calls
      mockFetch.mockClear()

      // Call refetch
      await result.current.refetch()

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/automations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
    })
  })

  describe('Error handling', () => {
    it('should handle real-time callback errors gracefully', async () => {
      // Arrange
      let realtimeCallback: (payload: RealtimePayload) => void
      mockChannel.on.mockImplementation((event, config, callback) => {
        realtimeCallback = callback
        return mockChannel
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act
      const { result } = renderHook(() => useAutomations())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate real-time callback error - DELETE without old property
      realtimeCallback({
        eventType: 'DELETE',
        old: null // This will cause an error when accessing .id
      })

      // Assert - should not crash and should log error
      expect(result.current.error).toBe(null) // Real-time errors don't set error state
      expect(consoleSpy).toHaveBeenCalledWith('Real-time update processing error:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
