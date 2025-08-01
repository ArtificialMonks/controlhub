// src/app/sidebar-test/page.tsx
"use client"

import { 
  Sidebar, 
  SidebarProvider, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, Settings, Users, BarChart3, FileText, HelpCircle } from "lucide-react"

function SidebarTestContent() {
  const { isOpen, isCollapsed, isMobile } = useSidebar()

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard", active: true },
    { icon: Users, label: "Automations", href: "/automations" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: HelpCircle, label: "Help", href: "/help" },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary" />
            {!isCollapsed && (
              <span className="font-semibold">Communitee</span>
            )}
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  isActive={item.active}
                  tooltip={item.label}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.label}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted" />
            {!isCollapsed && (
              <div className="flex-1 text-sm">
                <div className="font-medium">John Doe</div>
                <div className="text-muted-foreground">john@example.com</div>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold">Sidebar Test</h1>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Status</CardTitle>
                <CardDescription>Current sidebar state information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Open:</span>
                  <span className={isOpen ? "text-green-600" : "text-red-600"}>
                    {isOpen ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Collapsed:</span>
                  <span className={isCollapsed ? "text-blue-600" : "text-gray-600"}>
                    {isCollapsed ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mobile:</span>
                  <span className={isMobile ? "text-orange-600" : "text-gray-600"}>
                    {isMobile ? "Yes" : "No"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsive Behavior</CardTitle>
                <CardDescription>Testing responsive breakpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>Desktop (≥768px):</strong> Sidebar collapses to icon mode</p>
                  <p><strong>Mobile (&lt;768px):</strong> Sidebar slides off-screen</p>
                  <p><strong>Current width:</strong> {typeof window !== 'undefined' ? window.innerWidth : 'Unknown'}px</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.dispatchEvent(new Event('resize'))}
                >
                  Test Resize Detection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Animation Features</CardTitle>
                <CardDescription>CSS transform animations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>✅ 300ms transition duration</p>
                  <p>✅ CSS transforms for GPU acceleration</p>
                  <p>✅ Smooth width transitions</p>
                  <p>✅ Icon-only mode on desktop</p>
                  <p>✅ Slide animation on mobile</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Implementation Features</CardTitle>
              <CardDescription>Sidebar implementation verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">✅ Compound Components:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• SidebarProvider (Context)</li>
                    <li>• Sidebar (Main container)</li>
                    <li>• SidebarHeader (Logo area)</li>
                    <li>• SidebarContent (Navigation)</li>
                    <li>• SidebarFooter (User info)</li>
                    <li>• SidebarTrigger (Toggle button)</li>
                    <li>• SidebarMenu components</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">🎯 Features:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Responsive behavior (768px breakpoint)</li>
                    <li>• State persistence via Zustand</li>
                    <li>• CSS transform animations</li>
                    <li>• Touch-friendly mobile interactions</li>
                    <li>• Icon tooltips when collapsed</li>
                    <li>• Keyboard navigation support</li>
                    <li>• Accessibility features</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default function SidebarTestPage() {
  return (
    <SidebarProvider>
      <SidebarTestContent />
    </SidebarProvider>
  )
}
