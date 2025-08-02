// src/components/ui/sidebar.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/stores/app-store"

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

  // Detect mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-collapse on mobile
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobile, setSidebarCollapsed, sidebarCollapsed])

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

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
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

  return (
    <div
      className={cn(
        "relative flex h-full w-64 flex-col border-r bg-background transition-all duration-300 ease-in-out",
        {
          "w-16": isCollapsed && !isMobile,
          "translate-x-0": isOpen,
          "-translate-x-full": !isOpen && isMobile,
          "w-64": !isCollapsed || !isMobile,
        },
        variant === "floating" && "m-2 rounded-lg border shadow-lg",
        variant === "inset" && "m-2 rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b px-4",
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
  return (
    <div
      className={cn(
        "flex-1 overflow-auto py-2",
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

interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

export function SidebarTrigger({ className, children, ...props }: SidebarTriggerProps) {
  const { toggleSidebar, isMobile, toggleCollapsed } = useSidebar()

  const handleClick = () => {
    if (isMobile) {
      toggleSidebar()
    } else {
      toggleCollapsed()
    }
  }

  return (
    <button
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children || (
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  )
}

interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function SidebarMenu({ className, children, ...props }: SidebarMenuProps) {
  return (
    <div
      className={cn("space-y-1 px-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function SidebarMenuItem({ className, children, ...props }: SidebarMenuItemProps) {
  return (
    <div
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  const { isCollapsed } = useSidebar()

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        isCollapsed && "justify-center px-2",
        className
      )}
      title={isCollapsed ? tooltip : undefined}
      {...props}
    >
      {children}
    </button>
  )
}
