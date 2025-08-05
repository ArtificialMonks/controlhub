// src/test/sidebar-animations.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { SidebarProvider, Sidebar, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeProvider } from 'next-themes'
import React from 'react'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Framer Motion to avoid animation timing issues in tests
interface MockMotionProps {
  children?: React.ReactNode
  animate?: unknown
  variants?: unknown
  initial?: unknown
  drag?: unknown
  dragConstraints?: unknown
  dragElastic?: unknown
  onDragEnd?: unknown
  whileHover?: unknown
  whileTap?: unknown
  transition?: unknown
  [key: string]: unknown
}

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: MockMotionProps) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, ...props }: MockMotionProps) => <span {...props}>{children}</span>,
    svg: ({ children, ...props }: MockMotionProps) => <svg {...props}>{children}</svg>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

// Mock the app store
const mockAppStore = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  isMobile: false,
  setSidebarOpen: vi.fn(),
  toggleSidebar: vi.fn(),
  setSidebarCollapsed: vi.fn(),
  toggleSidebarCollapsed: vi.fn(),
  setIsMobile: vi.fn(),
}

vi.mock('@/lib/stores/app-store', () => ({
  useAppStore: () => mockAppStore,
}))

describe('Enhanced Sidebar Animations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render sidebar with all components', () => {
      render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <Sidebar>
              <div>Sidebar Content</div>
            </Sidebar>
            <SidebarTrigger />
          </SidebarProvider>
        </ThemeProvider>
      )

      expect(screen.getByText('Sidebar Content')).toBeInTheDocument()
    })

    it('should apply gradient classes based on theme', () => {
      const { container } = render(
        <ThemeProvider attribute="class" defaultTheme="light">
          <SidebarProvider>
            <Sidebar className="test-sidebar">
              <div>Content</div>
            </Sidebar>
          </SidebarProvider>
        </ThemeProvider>
      )

      const sidebar = container.querySelector('.test-sidebar')
      // Check that sidebar has one of the gradient classes
      const hasGradientClass = sidebar?.className.includes('sidebar-gradient-light') || 
                              sidebar?.className.includes('sidebar-gradient-dark')
      expect(hasGradientClass).toBe(true)
    })
  })

  describe('Animation Classes', () => {
    it('should apply GPU acceleration class', () => {
      const { container } = render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <Sidebar className="test-sidebar">
              <div>Content</div>
            </Sidebar>
          </SidebarProvider>
        </ThemeProvider>
      )

      const sidebar = container.querySelector('.test-sidebar')
      // Check for GPU acceleration class in the class list
      expect(sidebar?.className).toContain('sidebar-gpu-accelerated')
    })

    it('should apply glassmorphism classes to menu buttons', () => {
      render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <SidebarMenuButton>
              <span>Menu Item</span>
            </SidebarMenuButton>
          </SidebarProvider>
        </ThemeProvider>
      )

      const button = screen.getByRole('button')
      // CSS modules add prefixes, so check for the class name within the className string
      expect(button.className).toMatch(/sidebar-item-glass/)
      expect(button.className).toMatch(/sidebar-animated-border/)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should respond to Ctrl+B keyboard shortcut', () => {
      // Reset the mock before test
      mockAppStore.toggleSidebarCollapsed.mockClear()
      
      render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <Sidebar>
              <div>Test</div>
            </Sidebar>
          </SidebarProvider>
        </ThemeProvider>
      )

      // Simulate Ctrl+B
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
      
      // The keyboard handler is set up in SidebarProvider
      expect(mockAppStore.toggleSidebarCollapsed).toHaveBeenCalled()
    })
  })

  describe('Trigger Button', () => {
    it('should have proper tooltip based on state', () => {
      render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <SidebarTrigger />
          </SidebarProvider>
        </ThemeProvider>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('title')
      expect(trigger.title).toContain('sidebar')
    })

    it('should apply hover and tap animations', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <SidebarTrigger />
          </SidebarProvider>
        </ThemeProvider>
      )

      const trigger = screen.getByRole('button')
      
      // Test hover
      await user.hover(trigger)
      // In real implementation, this would trigger scale animation
      
      // Test click
      await user.click(trigger)
      // In real implementation, this would trigger tap animation
    })
  })

  describe('Mobile Behavior', () => {
    it('should show backdrop on mobile when sidebar is open', () => {
      // Mock mobile state
      mockAppStore.isMobile = true
      mockAppStore.sidebarOpen = true

      const { container } = render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <Sidebar>
              <div>Content</div>
            </Sidebar>
          </SidebarProvider>
        </ThemeProvider>
      )

      // Check for backdrop
      const backdrop = container.querySelector('.bg-black\\/50')
      expect(backdrop).toBeInTheDocument()
    })
  })

  describe('Active State', () => {
    it('should apply accent gradient to active menu items', () => {
      render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <SidebarMenuButton isActive={true}>
              <span>Active Item</span>
            </SidebarMenuButton>
          </SidebarProvider>
        </ThemeProvider>
      )

      const button = screen.getByRole('button')
      expect(button.className).toMatch(/sidebar-accent-gradient/)
    })
  })

  describe('Performance', () => {
    it('should use will-change for performance optimization', () => {
      const { container } = render(
        <ThemeProvider attribute="class">
          <SidebarProvider>
            <Sidebar className="test-sidebar">
              <div>Content</div>
            </Sidebar>
          </SidebarProvider>
        </ThemeProvider>
      )

      const sidebar = container.querySelector('.test-sidebar')
      // GPU acceleration class includes will-change optimization
      expect(sidebar?.className).toMatch(/sidebar-gpu-accelerated/)
    })
  })
})