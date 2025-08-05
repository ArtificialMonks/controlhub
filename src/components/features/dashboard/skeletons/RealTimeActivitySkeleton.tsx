// src/components/dashboard/skeletons/RealTimeActivitySkeleton.tsx
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function RealTimeActivitySkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-32 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart skeleton */}
          <div className="h-32 bg-white/5 dark:bg-black/20 rounded-lg animate-pulse" />
          
          {/* Activity feed skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 dark:bg-black/20">
                  <div className="h-4 w-4 bg-white/20 dark:bg-white/10 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-white/20 dark:bg-white/10 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Live indicators skeleton */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-white/5 dark:bg-black/20">
                <div className="h-3 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse mx-auto mb-1" />
                <div className="h-4 w-8 bg-white/20 dark:bg-white/10 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}