'use client'

import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutButton } from '@/components/auth/logout-button'

interface AuthDropdownProps {
  isAuthenticated: boolean
  userEmail?: string | null
}

export function AuthDropdown({ isAuthenticated, userEmail }: AuthDropdownProps) {
  if (!isAuthenticated) {
    return (
      <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
        <User className="w-3 h-3 mr-2" />
        Not Logged In
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
            <User className="w-3 h-3 mr-2" />
            Logged In
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="w-full">
            <LogoutButton />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}