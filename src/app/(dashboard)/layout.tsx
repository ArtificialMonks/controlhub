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
import { NotificationProvider } from '@/components/notifications/NotificationProvider'

// Sidebar header component with responsive logo and CONTROLHUB text
function SidebarHeaderContent() {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className={cn(
      "flex items-center w-full h-16 relative transition-all duration-300",
      isCollapsed ? "justify-center px-3" : "px-4"
    )}>
      {/* Automation-style logo with nodes */}
      <motion.div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-lg relative overflow-hidden shrink-0",
          isCollapsed && "ml-1"
        )}
        whileHover={{ 
          scale: 1.1, 
          rotate: 360,
          boxShadow: "0 0 20px rgba(0, 60, 255, 0.6)"
        }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          rotate: { duration: 0.8 }
        }}
      >
        {/* Central automation node with continuous rotation */}
        <motion.div 
          className="h-3 w-3 rounded-full bg-white/90 shadow-inner"
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
          whileHover={{ 
            backgroundColor: "rgba(255, 255, 255, 1)",
            boxShadow: "0 0 8px rgba(255, 255, 255, 0.8)",
            scale: 1.1
          }}
        />
        {/* Connecting nodes around the circle with subtle pulsing */}
        <motion.div 
          className="absolute top-1 left-1/2 transform -translate-x-1/2 h-1 w-1 rounded-full bg-white/70"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0
          }}
          whileHover={{ 
            backgroundColor: "rgba(255, 255, 255, 1)",
            scale: 1.5,
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)"
          }}
        />
        <motion.div 
          className="absolute top-1/2 right-1 transform -translate-y-1/2 h-1 w-1 rounded-full bg-white/70"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          whileHover={{ 
            backgroundColor: "rgba(255, 255, 255, 1)",
            scale: 1.5,
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)"
          }}
        />
        <motion.div 
          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 h-1 w-1 rounded-full bg-white/70"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          whileHover={{ 
            backgroundColor: "rgba(255, 255, 255, 1)",
            scale: 1.5,
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1 transform -translate-y-1/2 h-1 w-1 rounded-full bg-white/70"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          whileHover={{ 
            backgroundColor: "rgba(255, 255, 255, 1)",
            scale: 1.5,
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)"
          }}
        />
      </motion.div>
      
      {/* CONTROLHUB text - only visible when sidebar is expanded */}
      <motion.div
        className="ml-3 overflow-hidden"
        initial={false}
        animate={{ 
          width: isCollapsed ? 0 : "auto", 
          opacity: isCollapsed ? 0 : 1 
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.span
          className="control-hub-title text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent whitespace-nowrap"
          style={{ backgroundSize: "200% 100%" }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          whileHover={{
            scale: 1.05,
            textShadow: "0 0 15px rgba(0, 60, 255, 0.4)"
          }}
        >
          CONTROLHUB
        </motion.span>
      </motion.div>
      
      {/* Alignment separator matching header */}
      <div className="absolute -bottom-0.5 left-0 right-0 h-px separator-gradient"></div>
    </div>
  )
}

// Main content area component that responds to sidebar state
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar()
  const [isConnected, setIsConnected] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Check connection status and user auth
  useEffect(() => {
    // Get user from cookie/session - replace with actual auth logic
    const checkConnection = async () => {
      try {
        // Check if user is authenticated and system is operational
        const response = await fetch('/api/users/profile')
        if (response.ok) {
          const data = await response.json()
          setIsConnected(true)
          setUserEmail(data.email)
        } else {
          setIsConnected(false)
          setUserEmail(null)
        }
      } catch {
        setIsConnected(false)
        setUserEmail(null)
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
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 shrink-0 shadow-sm pointer-events-auto">
        {/* Enhanced separator with gradient effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent pointer-events-none"></div>
        {/* Left side - Sidebar trigger */}
        <div className="flex items-center relative z-20">
          <SidebarTrigger />
        </div>

        {/* Right side - Status, Auth, and Theme toggle */}
        <div className="flex items-center gap-2 relative z-50">
          <StatusIndicator isConnected={isConnected} />
          <AuthDropdown isAuthenticated={!!userEmail} userEmail={userEmail} />
          <div className="relative z-[100] pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content with proper sizing */}
      <main 
        id="main-content"
        className="flex-1 min-h-0 overflow-hidden bg-background pointer-events-auto"
        role="main"
        aria-label="Main content"
      >
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
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Get user email for NotificationProvider
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await fetch('/api/users/profile')
        if (response.ok) {
          const data = await response.json()
          setUserEmail(data.email)
        } else {
          // Fallback to a default email if profile fetch fails
          setUserEmail('user@controlhub.com')
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Fallback to a default email if profile fetch fails
        setUserEmail('user@controlhub.com')
      }
    }

    fetchUserEmail()
  }, [])

  // Use fallback email to prevent blocking the UI
  const effectiveUserEmail = userEmail || 'user@controlhub.com'

  return (
    <NotificationProvider userId={effectiveUserEmail}>
      <SidebarProvider>
        <div className="relative min-h-screen w-full bg-background overflow-hidden">
          {/* Fixed Sidebar */}
          <Sidebar className="pointer-events-auto">
            <SidebarHeader className="border-b border-aligned">
              <SidebarHeaderContent />
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
    </NotificationProvider>
  )
}
