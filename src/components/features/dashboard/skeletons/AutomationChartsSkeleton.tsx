// src/components/dashboard/skeletons/AutomationChartsSkeleton.tsx
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function AutomationChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Performance Trend Chart Skeleton */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-5 w-56 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trend summary skeleton */}
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10">
                <div className="h-8 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse mb-1" />
                <div className="h-4 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="h-4 w-12 bg-green-500/20 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Chart skeleton */}
            <div className="h-64 bg-white/5 dark:bg-black/20 rounded-lg animate-pulse">
              <div className="h-full flex items-end justify-between p-4 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/10 dark:bg-white/5 rounded-t"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Distribution Chart Skeleton */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md h-full">
          <CardHeader className="pb-4">
            <div className="h-5 w-48 bg-white/20 dark:bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-56 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success rate highlight skeleton */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center">
                <div className="text-center p-4 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10">
                  <div className="h-10 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse mx-auto mb-1" />
                  <div className="h-4 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse mx-auto" />
                </div>
              </div>
            </div>
            
            {/* Chart skeleton */}
            <div className="h-48 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-white/10 dark:bg-white/5 animate-pulse relative">
                <div className="absolute inset-4 rounded-full bg-white/5 dark:bg-black/20" />
              </div>
            </div>

            {/* Legend skeleton */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
              {[1, 2, 3, 4].map((index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg"
                >
                  <div className="w-3 h-3 rounded-full bg-white/20 dark:bg-white/10 animate-pulse" />
                  <div className="h-4 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}