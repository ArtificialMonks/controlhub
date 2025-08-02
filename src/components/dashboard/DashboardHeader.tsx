// src/components/dashboard/DashboardHeader.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserPlus, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface DashboardHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function DashboardHeader({ onRefresh, isRefreshing = false }: DashboardHeaderProps) {
  // Mock user avatars for the invite section
  const teamMembers = [
    { id: 1, name: 'John Doe', avatar: '/avatars/john.jpg', initials: 'JD' },
    { id: 2, name: 'Jane Smith', avatar: '/avatars/jane.jpg', initials: 'JS' },
    { id: 3, name: 'Mike Johnson', avatar: '/avatars/mike.jpg', initials: 'MJ' },
    { id: 4, name: 'Sarah Wilson', avatar: '/avatars/sarah.jpg', initials: 'SW' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-8"
    >
      {/* Left side - Title */}
      <div>
        <h1 className="control-hub-title text-4xl font-bold text-foreground mb-2">
          Automation Control Hub
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitor and manage your automation workflows
        </p>
      </div>

      {/* Right side - Team avatars and actions */}
      <div className="flex items-center gap-4">
        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="mr-2"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {/* Team member avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Avatar className="h-10 w-10 border-2 border-background hover:scale-110 transition-transform cursor-pointer">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
            
            {/* +2 more indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Avatar className="h-10 w-10 border-2 border-background bg-muted hover:scale-110 transition-transform cursor-pointer">
                <AvatarFallback className="bg-accent text-accent-foreground text-sm font-medium">
                  +2
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          {/* Invite button */}
          <Button size="sm" className="ml-4">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
