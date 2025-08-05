// src/components/dashboard/skeletons/MetricsCardsSkeleton.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function MetricsCardsSkeleton() {
  const cards = [1, 2, 3]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icon skeleton */}
                  <div className="p-3 rounded-xl bg-white/10 dark:bg-black/30 animate-pulse">
                    <div className="h-6 w-6 bg-white/20 dark:bg-white/10 rounded" />
                  </div>
                  
                  {/* Content skeleton */}
                  <div>
                    <div className="h-4 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse mb-2" />
                    <div className="h-8 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                </div>

                {/* Trend indicator skeleton */}
                <div className="h-6 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}