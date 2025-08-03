// src/components/automations/AutomationsDataGridSkeleton.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function AutomationsDataGridSkeleton() {
  const rows = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-background">
      {/* Toolbar Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-background/95 backdrop-blur-sm"
      >
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by automation name or client..."
                disabled
                className="max-w-md bg-white/5 dark:bg-black/20 backdrop-blur-sm border-white/10 opacity-50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Client Select Skeleton */}
              <div className="h-10 w-40 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
              
              {/* Status Filter Skeletons */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
              ))}
              
              {/* Divider */}
              <div className="h-8 w-px bg-border/50 mx-2" />
              
              {/* Action Buttons Skeleton */}
              <Button variant="outline" size="sm" disabled className="opacity-50">
                Run All
              </Button>
              <Button variant="outline" size="sm" disabled className="opacity-50">
                Stop All
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Data Grid Content Skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-auto"
      >
        <Card className="h-full rounded-none border-0 bg-white/5 dark:bg-black/20 backdrop-blur-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50 bg-white/5 dark:bg-black/20">
                  <tr>
                    <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      <div className="h-3 w-32 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                    </th>
                    <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      <div className="h-3 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                    </th>
                    <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      <div className="h-3 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                    </th>
                    <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      <div className="h-3 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                    </th>
                    <th className="text-left p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      <div className="h-3 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                    </th>
                    <th className="text-center p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                      <div className="h-3 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse mx-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rows.map((index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="hover:bg-white/5 dark:hover:bg-black/20"
                    >
                      <td className="p-4">
                        <div>
                          <div className="h-4 w-48 bg-white/20 dark:bg-white/10 rounded animate-pulse mb-2" />
                          <div className="h-3 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 w-32 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-white/20 dark:bg-white/10 animate-pulse" />
                          <div className="h-6 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 w-28 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-8 w-8 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                          <div className="h-8 w-8 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}