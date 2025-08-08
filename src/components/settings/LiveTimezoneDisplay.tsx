// src/components/settings/LiveTimezoneDisplay.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock, Globe } from 'lucide-react'
import { formatDateInTimezone, formatTimeInTimezone, getCurrentTimezoneOffset } from '@/lib/utils/locale'

interface LiveTimezoneDisplayProps {
  timezone: string
  className?: string
}

export function LiveTimezoneDisplay({ timezone, className }: LiveTimezoneDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  const formattedTime = formatTimeInTimezone(currentTime, timezone)
  const formattedDate = formatDateInTimezone(currentTime, timezone)
  const offset = getCurrentTimezoneOffset(timezone)
  
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Clock className="h-4 w-4" />
      <span className="font-mono">{formattedTime}</span>
      <Globe className="h-4 w-4 ml-2" />
      <span>{formattedDate}</span>
      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
        {offset}
      </span>
    </div>
  )
}