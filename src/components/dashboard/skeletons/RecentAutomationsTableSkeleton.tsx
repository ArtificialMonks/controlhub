// src/components/dashboard/skeletons/RecentAutomationsTableSkeleton.tsx
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

export function RecentAutomationsTableSkeleton() {
  const rows = [1, 2, 3, 4, 5]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="border border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md">
        <CardHeader className="pb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-4 w-80 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="w-[200px]">
                  <div className="h-3 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                </TableHead>
                <TableHead>
                  <div className="h-3 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                </TableHead>
                <TableHead>
                  <div className="h-3 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                </TableHead>
                <TableHead>
                  <div className="h-3 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                </TableHead>
                <TableHead className="text-right">
                  <div className="h-3 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="border-border/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/20 dark:bg-white/10 animate-pulse" />
                      <div>
                        <div className="h-4 w-24 bg-white/20 dark:bg-white/10 rounded animate-pulse mb-1" />
                        <div className="h-3 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="h-4 w-32 bg-white/20 dark:bg-white/10 rounded animate-pulse mb-1" />
                      <div className="flex items-center gap-3 mt-1">
                        <div className="h-3 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-white/20 dark:bg-white/10 animate-pulse" />
                      <div className="h-6 w-16 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="text-right">
                      <div className="h-4 w-12 bg-white/20 dark:bg-white/10 rounded animate-pulse ml-auto mb-1" />
                      <div className="h-3 w-20 bg-white/20 dark:bg-white/10 rounded animate-pulse ml-auto" />
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}