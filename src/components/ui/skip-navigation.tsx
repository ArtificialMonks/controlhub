// src/components/ui/skip-navigation.tsx
'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'

interface SkipNavigationProps {
  href?: string
  children?: React.ReactNode
}

export function SkipNavigation({ 
  href = '#main-content', 
  children = 'Skip to main content' 
}: SkipNavigationProps) {
  return (
    <a
      href={href}
      className={cn(
        "absolute top-0 left-0 z-[9999] px-4 py-2",
        "bg-primary text-primary-foreground",
        "rounded-md shadow-lg",
        "transform -translate-y-full",
        "focus:translate-y-0",
        "transition-transform duration-200",
        "sr-only focus:not-sr-only"
      )}
    >
      {children}
    </a>
  )
}

// Skip navigation links for multiple sections
export function SkipNavigationLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <nav aria-label="Skip navigation">
        <ul className="absolute top-0 left-0 z-[9999] flex flex-col gap-2 p-4 bg-background border rounded-md shadow-lg">
          <li>
            <a 
              href="#main-content" 
              className="text-sm underline hover:no-underline focus:outline-2 focus:outline-primary"
            >
              Skip to main content
            </a>
          </li>
          <li>
            <a 
              href="#sidebar-navigation" 
              className="text-sm underline hover:no-underline focus:outline-2 focus:outline-primary"
            >
              Skip to navigation
            </a>
          </li>
          <li>
            <a 
              href="#search" 
              className="text-sm underline hover:no-underline focus:outline-2 focus:outline-primary"
            >
              Skip to search
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}