// src/components/ui/drill-down-modal.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  X, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

interface DrillDownModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: React.ReactNode
  color?: string
  children: React.ReactNode
  onExport?: () => void
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>
  // Enhanced analytics features
  enableDateFiltering?: boolean
  enableAdvancedFiltering?: boolean
  dateRange?: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void
  filterOptions?: Array<{ label: string; value: string; selected: boolean }>
  onFilterChange?: (filters: Array<{ label: string; value: string; selected: boolean }>) => void
}

export function DrillDownModal({
  isOpen,
  onClose,
  title,
  icon,
  color = 'primary',
  children,
  onExport,
  breadcrumbs = [],
  // Enhanced analytics features
  enableDateFiltering = false,
  enableAdvancedFiltering = false,
  dateRange,
  onDateRangeChange,
  filterOptions = [],
  onFilterChange
}: DrillDownModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-border/30">
              <DialogHeader className="p-6 pb-4">
                {/* Breadcrumbs */}
                {breadcrumbs.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground mb-3"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 hover:bg-primary/10"
                      onClick={breadcrumbs[0]?.onClick || onClose}
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Back
                    </Button>
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <ChevronRight className="h-3 w-3" />}
                        <button
                          onClick={crumb.onClick}
                          className={`hover:text-foreground transition-colors ${
                            crumb.onClick ? 'cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          {crumb.label}
                        </button>
                      </React.Fragment>
                    ))}
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {icon && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className={`p-3 rounded-xl bg-${color}-500 shadow-lg`}
                      >
                        <div className="text-white">{icon}</div>
                      </motion.div>
                    )}
                    <div>
                      <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                        {title}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground mt-1">
                        Detailed breakdown and analytics
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {onExport && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="hover:bg-primary/10 hover:border-primary/30"
                      >
                        <Download className="h-4 w-4 mr-0 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Enhanced Analytics Controls */}
                {(enableDateFiltering || enableAdvancedFiltering) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap items-center gap-4 px-6 pb-4 border-b border-border/30"
                  >
                    {enableDateFiltering && dateRange && onDateRangeChange && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <DatePickerWithRange
                          date={dateRange}
                          onDateChange={onDateRangeChange}
                          className="w-auto"
                        />
                      </div>
                    )}
                    
                    {enableAdvancedFiltering && filterOptions.length > 0 && onFilterChange && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <div className="flex gap-2 flex-wrap">
                          {filterOptions.map((filter, index) => (
                            <div key={filter.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`filter-${filter.value}`}
                                checked={filter.selected}
                                onCheckedChange={(checked) => {
                                  const updated = [...filterOptions]
                                  updated[index] = { ...filter, selected: checked as boolean }
                                  onFilterChange(updated)
                                }}
                              />
                              <label
                                htmlFor={`filter-${filter.value}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {filter.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </DialogHeader>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
            >
              {children}
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

// Sub-components for consistent drill-down content styling
export function DrillDownSection({ 
  title, 
  children,
  action
}: { 
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  )
}

export function DrillDownMetric({
  label,
  value,
  trend,
  trendValue,
  icon
}: {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
}) {
  const getTrendIcon = () => {
    if (!trend) return null
    return trend === 'up' ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : trend === 'down' ? (
      <TrendingDown className="h-3 w-3 text-red-500" />
    ) : null
  }

  return (
    <div className="p-4 rounded-lg bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        {trend && trendValue && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {getTrendIcon()}
            <span>{trendValue}</span>
          </Badge>
        )}
      </div>
    </div>
  )
}