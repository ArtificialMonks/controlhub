// src/components/dashboard/skeletons/AutomationProgressSkeleton.tsx
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function AutomationProgressSkeleton() {
  const progressItems = [1, 2, 3, 4]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-4 w-64 bg-white/20 dark:bg-white/10 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bars skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {progressItems.map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-white/20 dark:bg-white/10 rounded-full animate-pulse" />
                    <div className="h-4 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <div className="h-2 w-full bg-white/10 dark:bg-black/30 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-white/20 dark:bg-white/10 rounded-full animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-10 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary stats skeleton */}
          <div className="pt-4 border-t border-border/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {[1, 2, 3].map((index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="p-3 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10"
                >
                  <div className="h-8 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse mx-auto mb-1" />
                  <div className="h-4 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse mx-auto" />
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}