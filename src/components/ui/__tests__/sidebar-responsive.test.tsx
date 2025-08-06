// src/components/ui/__tests__/sidebar-responsive.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '../sidebar'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
  }),
}))

// Test component to access sidebar state
function TestSidebarContent() {
  const { isOpen, isCollapsed, isMobile, toggleSidebar, toggleCollapsed } = useSidebar()
  
  return (
    <div>
      <div data-testid="sidebar-state">
        isOpen: {isOpen.toString()}, 
        isCollapsed: {isCollapsed.toString()}, 
        isMobile: {isMobile.toString()}
      </div>
      <button data-testid="toggle-sidebar" onClick={toggleSidebar}>
        Toggle Sidebar
      </button>
      <button data-testid="toggle-collapsed" onClick={toggleCollapsed}>
        Toggle Collapsed
      </button>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="h-4 w-4 bg-gray-400 rounded" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="h-4 w-4 bg-gray-400 rounded" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </div>
  )
}

function TestSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <TestSidebarContent />
      </Sidebar>
    </SidebarProvider>
  )
}

// Mock window.innerWidth for responsive testing
const mockWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

describe('Sidebar Responsive Behavior', () => {
  beforeEach(() => {
    // Reset window width before each test
    mockWindowWidth(1200) // Default to desktop
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Desktop Behavior (>= 1024px)', () => {
    beforeEach(() => {
      mockWindowWidth(1200)
    })

    test('should default to collapsed state on desktop for icon visibility', () => {
      render(<TestSidebar />)
      
      // Trigger resize event to apply mobile detection
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      const state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isMobile: false')
      expect(state.textContent).toContain('isCollapsed: true') // Should default to collapsed
    })

    test('should allow expanding sidebar on desktop', () => {
      render(<TestSidebar />)
      
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      const toggleButton = screen.getByTestId('toggle-collapsed')
      
      act(() => {
        fireEvent.click(toggleButton)
      })

      const state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isCollapsed: false')
    })

    test('should maintain sidebar visibility on desktop', () => {
      render(<TestSidebar />)
      
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      // Sidebar should be visible (not hidden) on desktop
      const sidebar = screen.getByRole('button', { name: /dashboard/i })
      expect(sidebar).toBeInTheDocument()
    })
  })

  describe('Mobile/Tablet Behavior (< 1024px)', () => {
    beforeEach(() => {
      mockWindowWidth(768) // Tablet width
    })

    test('should default to closed overlay on mobile/tablet', () => {
      render(<TestSidebar />)
      
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      const state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isMobile: true')
      expect(state.textContent).toContain('isOpen: false') // Should default to closed
    })

    test('should allow opening sidebar overlay on mobile/tablet', () => {
      render(<TestSidebar />)
      
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      const toggleButton = screen.getByTestId('toggle-sidebar')
      
      act(() => {
        fireEvent.click(toggleButton)
      })

      const state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isOpen: true')
    })
  })

  describe('Responsive Transitions', () => {
    test('should transition from desktop to mobile behavior', () => {
      render(<TestSidebar />)
      
      // Start with desktop
      mockWindowWidth(1200)
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      let state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isMobile: false')

      // Transition to mobile
      mockWindowWidth(768)
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isMobile: true')
      expect(state.textContent).toContain('isOpen: false') // Should close on mobile
    })

    test('should transition from mobile to desktop behavior', () => {
      render(<TestSidebar />)
      
      // Start with mobile
      mockWindowWidth(768)
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      let state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isMobile: true')

      // Transition to desktop
      mockWindowWidth(1200)
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      state = screen.getByTestId('sidebar-state')
      expect(state.textContent).toContain('isMobile: false')
      expect(state.textContent).toContain('isCollapsed: true') // Should be collapsed on desktop
    })
  })

  describe('Touch Target Requirements', () => {
    test('should have minimum 44px touch targets on mobile', () => {
      mockWindowWidth(768)
      render(<TestSidebar />)
      
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      const menuButtons = screen.getAllByRole('button')
      menuButtons.forEach(button => {
        // Check for min-height class (should be applied via Tailwind)
        expect(button.className).toMatch(/min-h-touch/)
      })
    })

    test('should maintain touch targets in collapsed desktop mode', () => {
      mockWindowWidth(1200)
      render(<TestSidebar />)
      
      act(() => {
        fireEvent(window, new Event('resize'))
      })

      const menuButtons = screen.getAllByRole('button')
      menuButtons.forEach(button => {
        // Should still have touch-friendly sizing even when collapsed
        expect(button.className).toMatch(/min-h-touch/)
      })
    })
  })
})
