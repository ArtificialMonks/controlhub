// src/components/automation/automations-toolbar.tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Search,
  Filter,
  Plus,
  Grid3X3,
  List,
  X
} from "lucide-react"

export interface FilterState {
  search: string
  status: string
  category: string
  tags: string[]
}

interface AutomationsToolbarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onCreateNew?: () => void
  className?: string
  isMobile?: boolean
}

export function AutomationsToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  onCreateNew,
  className,
  isMobile = false
}: AutomationsToolbarProps) {
  const [showMobileFilters, setShowMobileFilters] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState(filters.search)

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, filters, onFiltersChange])

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status === "all" ? "" : status })
  }

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category: category === "all" ? "" : category })
  }

  const removeTag = (tagToRemove: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const clearAllFilters = () => {
    setSearchValue("")
    onFiltersChange({
      search: "",
      status: "",
      category: "",
      tags: []
    })
  }

  const hasActiveFilters = filters.search || filters.status || filters.category || filters.tags.length > 0

  // Mobile Filter Drawer
  const MobileFilterDrawer = () => (
    <div className={cn(
      "fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-lg transform transition-transform duration-300 ease-in-out",
      showMobileFilters ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileFilters(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={filters.category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="data-sync">Data Sync</SelectItem>
                <SelectItem value="notifications">Notifications</SelectItem>
                <SelectItem value="reporting">Reporting</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filters.tags.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Active Tags</label>
              <div className="flex flex-wrap gap-2">
                {filters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className={cn("space-y-3", className)}>
          {/* Mobile Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search automations..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-12" // Touch-friendly height
            />
          </div>

          {/* Mobile Action Bar */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(true)}
              className="flex-1 h-12 gap-2" // Touch-friendly height
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {[filters.status, filters.category, ...filters.tags].filter(Boolean).length}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => onViewModeChange(viewMode === "grid" ? "list" : "grid")}
              className="h-12 w-12 p-0" // Touch-friendly size
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>

            <Button
              onClick={onCreateNew}
              className="h-12 w-12 p-0" // Touch-friendly size
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <button onClick={() => handleStatusChange("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  Category: {filters.category}
                  <button onClick={() => handleCategoryChange("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <MobileFilterDrawer />
      </>
    )
  }

  // Desktop Layout
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search automations..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.category || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="data-sync">Data Sync</SelectItem>
              <SelectItem value="notifications">Notifications</SelectItem>
              <SelectItem value="reporting">Reporting</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearAllFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New Automation
          </Button>
        </div>
      </div>

      {/* Active Tags */}
      {filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
