// src/app/(dashboard)/layout.tsx
'use client'

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { AuthDropdown } from '@/components/ui/auth-dropdown'
import { Home, Settings, BarChart3, FileText, HelpCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

// Main content area component that responds to sidebar state
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar()
  const [isConnected, setIsConnected] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Check connection status and user auth
  useEffect(() => {
    // Simulate connection check - replace with actual logic
    const checkConnection = async () => {
      try {
        // Check if user is authenticated and system is operational
        setIsConnected(true)
        // You would get this from your auth context/session
        setUserEmail('user@example.com')
      } catch {
        setIsConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn(
      "flex flex-col min-h-screen transition-all duration-300 ease-in-out bg-background",
      // Dynamic positioning based on sidebar state
      isMobile
        ? "w-full ml-0"
        : isCollapsed
          ? "ml-16"
          : "ml-[280px]"
    )}>
      {/* Header with sidebar trigger, centered title, and controls */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 shrink-0">
        {/* Left side - Sidebar trigger */}
        <div className="flex items-center">
          <SidebarTrigger />
        </div>

        {/* Center - CONTROL HUB title */}
        <motion.div
          className="absolute left-1/2"
          style={{ transform: 'translateX(calc(-50% - 3rem))' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="control-hub-title text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CONTROL HUB
          </h1>
        </motion.div>

        {/* Right side - Status, Auth, and Theme toggle */}
        <div className="flex items-center gap-2">
          <StatusIndicator isConnected={isConnected} />
          <AuthDropdown isAuthenticated={!!userEmail} userEmail={userEmail} />
          <ThemeToggle />
        </div>
      </header>

      {/* Main content with proper sizing */}
      <main className="flex-1 min-h-0 overflow-hidden bg-background">
        <div className="h-full w-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-background overflow-hidden">
        {/* Fixed Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-center w-full h-16">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Zap className="h-5 w-5" />
              </motion.div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard">
                  <SidebarMenuButton>
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/automations">
                  <SidebarMenuButton>
                    <Zap className="h-4 w-4" />
                    <span>Automations</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/dashboard">
                  <SidebarMenuButton>
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/dashboard">
                  <SidebarMenuButton>
                    <FileText className="h-4 w-4" />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/settings">
                  <SidebarMenuButton>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/dashboard">
                  <SidebarMenuButton>
                    <HelpCircle className="h-4 w-4" />
                    <span>Help</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            {/* Footer content removed as requested - auth controls moved to header */}
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  )
}
