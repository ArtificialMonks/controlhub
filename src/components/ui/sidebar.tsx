// src/components/ui/sidebar.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/data/stores/app-store"
import { useTheme } from "next-themes"
import {
  sidebarVariants,
  menuItemVariants,
  menuTextVariants,
  iconVariants,
  backdropVariants,
  staggerContainer,
  staggerItem,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_WIDTH,
  DRAG_CONSTRAINTS,
  SWIPE_THRESHOLD,
  SWIPE_VELOCITY_THRESHOLD
} from "@/lib/animations/sidebar-animations"
import styles from "./sidebar.module.css"

interface SidebarContextValue {
  isOpen: boolean
  isCollapsed: boolean
  isMobile: boolean
  toggleSidebar: () => void
  toggleCollapsed: () => void
  setOpen: (open: boolean) => void
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  defaultCollapsed?: boolean
}

export function SidebarProvider({
  children
}: SidebarProviderProps) {
  const {
    sidebarOpen,
    sidebarCollapsed,
    isMobile,
    setSidebarOpen,
    setSidebarCollapsed,
    setIsMobile,
    toggleSidebar,
    toggleSidebarCollapsed
  } = useAppStore()

  // Detect mobile screen size with improved mobile-first logic
  React.useEffect(() => {
    const checkMobile = () => {
      // Use 1024px breakpoint for better tablet/desktop distinction
      const isMobileOrTablet = window.innerWidth < 1024

      setIsMobile(isMobileOrTablet)

      // Mobile/Tablet behavior: Default to closed overlay
      if (isMobileOrTablet) {
        // On mobile/tablet, sidebar should be closed by default (overlay mode)
        if (sidebarOpen) {
          setSidebarOpen(false)
        }
      } else {
        // Desktop behavior: Allow user preference for collapsed/expanded state
        // Don't force any particular state - let user control it
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobile, setSidebarOpen, setSidebarCollapsed, sidebarOpen, sidebarCollapsed])

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === SIDEBAR_KEYBOARD_SHORTCUT) {
        e.preventDefault()
        if (isMobile) {
          toggleSidebar()
        } else {
          toggleSidebarCollapsed()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, toggleSidebar, toggleSidebarCollapsed])

  const contextValue: SidebarContextValue = {
    isOpen: sidebarOpen,
    isCollapsed: sidebarCollapsed,
    isMobile,
    toggleSidebar,
    toggleCollapsed: toggleSidebarCollapsed,
    setOpen: setSidebarOpen,
    setCollapsed: setSidebarCollapsed
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDragEnd' | 'onDrag' | 'style'> {
  side?: "left" | "right"
  variant?: "default" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}

export function Sidebar({
  variant = "default",
  className,
  children,
  ...props
}: SidebarProps) {
  const { isOpen, isCollapsed, isMobile } = useSidebar()
  const { theme, resolvedTheme } = useTheme()

  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const { toggleSidebar } = useSidebar()

  // Handle drag end for mobile
  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const shouldClose = info.offset.x < -SWIPE_THRESHOLD || 
                       info.velocity.x < -SWIPE_VELOCITY_THRESHOLD
    
    if (shouldClose && isOpen) {
      toggleSidebar()
    } else if (!shouldClose && !isOpen && info.offset.x > SWIPE_THRESHOLD) {
      toggleSidebar()
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={isMobile ? undefined : sidebarVariants}
        animate={isCollapsed && !isMobile ? "collapsed" : "expanded"}
        initial={false}
        drag={isMobile ? "x" : false}
        dragConstraints={isMobile ? DRAG_CONSTRAINTS : undefined}
        dragElastic={0.2}
        onDragEnd={isMobile ? handleDragEnd : undefined}
        className={cn(
          "flex h-full flex-col border-r transition-all duration-300 ease-in-out",
          styles['sidebar-gpu-accelerated'],
          currentTheme === 'dark' ? styles['sidebar-gradient-dark'] : styles['sidebar-gradient-light'],
          variant === "floating" && "m-2 rounded-lg border shadow-lg",
          variant === "inset" && "m-2 rounded-lg",
          // Mobile/Tablet: Overlay mode, Desktop: Always visible (collapsed or expanded)
          isMobile
            ? "fixed left-0 top-0 z-50 h-screen"
            : "fixed left-0 top-0 z-40 h-screen",
          className
        )}
        style={{
          width: isMobile
            ? SIDEBAR_WIDTH.MOBILE
            : isCollapsed
              ? SIDEBAR_WIDTH.COLLAPSED
              : SIDEBAR_WIDTH.EXPANDED,
          // Mobile/Tablet: Slide in/out, Desktop: Always visible
          x: isMobile && !isOpen ? -SIDEBAR_WIDTH.MOBILE : 0
        }}
        {...(props as any)}
      >
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    </>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  const { isMobile } = useSidebar()

  return (
    <div
      className={cn(
        // Touch-friendly header height and spacing
        "flex items-center border-b",
        isMobile
          ? "min-h-touch-lg h-14 px-6 py-3" // 56px height for mobile touch targets
          : "h-16 px-4", // Standard desktop height
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function SidebarContent({ className, children, ...props }: SidebarContentProps) {
  const { isMobile } = useSidebar()

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        // Touch-friendly padding and spacing
        isMobile
          ? "py-4 px-2" // Larger padding for mobile touch interaction
          : "py-2", // Standard desktop padding
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "border-t p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag'> {
  children?: React.ReactNode
}

export function SidebarTrigger({ className, children, ...props }: SidebarTriggerProps) {
  const { toggleSidebar, isMobile, toggleCollapsed, isCollapsed } = useSidebar()

  const handleClick = () => {
    if (isMobile) {
      toggleSidebar()
    } else {
      toggleCollapsed()
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        // Touch-friendly sizing
        isMobile
          ? "min-h-touch min-w-touch h-11 w-11" // 44px minimum touch target
          : "h-9 w-9", // Standard desktop size
        className
      )}
      onClick={handleClick}
      title={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar (${isMobile ? 'Tap' : 'Ctrl/Cmd + B'})`}
      {...(props as any)}
    >
      {children || (
        <motion.svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <path
            d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </motion.svg>
      )}
    </motion.button>
  )
}

interface SidebarMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag'> {
  children?: React.ReactNode
}

export function SidebarMenu({ className, children, ...props }: SidebarMenuProps) {
  const { isCollapsed } = useSidebar()
  
  return (
    <motion.div
      variants={staggerContainer}
      animate={isCollapsed ? "collapsed" : "expanded"}
      className={cn("space-y-1 px-2", className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}

interface SidebarMenuItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag'> {
  children?: React.ReactNode
}

export function SidebarMenuItem({ className, children, ...props }: SidebarMenuItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn("", className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}

interface SidebarMenuButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag'> {
  isActive?: boolean
  tooltip?: string
}

export function SidebarMenuButton({
  className,
  children,
  isActive = false,
  tooltip,
  ...props
}: SidebarMenuButtonProps) {
  const { isCollapsed, isMobile } = useSidebar()

  // Split children into icon and text
  const childrenArray = React.Children.toArray(children)
  const icon = childrenArray[0]
  const text = childrenArray.slice(1)

  // Determine padding classes based on state
  const paddingClasses = isMobile
    ? "min-h-touch px-4 py-3" // Mobile: larger padding
    : isCollapsed
      ? "min-h-touch px-2 py-3 justify-center" // Desktop collapsed: centered icons
      : "min-h-touch px-3 py-2" // Desktop expanded: standard padding

  // Determine tooltip text
  const tooltipText = isCollapsed && !isMobile
    ? tooltip || (typeof text[0] === 'string' ? text[0] : undefined)
    : undefined

  return (
    <motion.button
      variants={menuItemVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      whileHover="hover"
      whileTap="tap"
      className={cn(
        "flex w-full items-center gap-3 rounded-md text-sm font-medium transition-all duration-200",
        paddingClasses,
        styles['sidebar-item-glass'],
        styles['sidebar-animated-border'],
        isActive && styles['sidebar-accent-gradient'],
        !isActive && "hover:bg-accent/10 hover:text-accent-foreground",
        className
      )}
      title={tooltipText}
      {...(props as any)}
    >
      {icon && (
        <motion.span
          variants={iconVariants}
          animate={isCollapsed ? "collapsed" : "expanded"}
          className="flex-shrink-0"
        >
          {icon}
        </motion.span>
      )}
      
      {text.length > 0 && (
        <motion.span
          variants={menuTextVariants}
          animate={isCollapsed ? "collapsed" : "expanded"}
          className="flex-1 text-left"
        >
          {text}
        </motion.span>
      )}
    </motion.button>
  )
}
