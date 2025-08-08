// src/components/settings/compound/SettingsSection.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, Save, RotateCcw, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SettingsSectionProps } from "@/types/settings"

export const SettingsSection = React.forwardRef<
  HTMLDivElement,
  SettingsSectionProps
>(({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  icon,
  badge,
  onSave,
  onReset,
  hasChanges = false,
  isLoading = false,
  error,
  ...props
}, ref) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    
    try {
      await onSave()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save settings")
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
      setSaveError(null)
      setSaveSuccess(false)
    }
  }

  return (
    <Card 
      ref={ref}
      className={cn(
        "transition-all duration-200",
        hasChanges && "ring-2 ring-primary/20",
        error && "ring-2 ring-destructive/20"
      )}
      {...props}
    >
      <CardHeader 
        className={cn(
          collapsible && "cursor-pointer select-none",
          "space-y-1"
        )}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-primary/10 rounded-lg">
                {React.isValidElement(icon) 
                  ? React.cloneElement(icon, {
                      className: "h-5 w-5 text-primary"
                    } as React.Attributes & { className: string })
                  : icon
                }
              </div>
            )}
            
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {title}
                {badge && (
                  <Badge variant="secondary" className="ml-2">
                    {badge}
                  </Badge>
                )}
                {hasChanges && (
                  <Badge variant="default" className="ml-2">
                    Unsaved Changes
                  </Badge>
                )}
              </CardTitle>
              
              {description && (
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <AnimatePresence initial={false}>
        {(!collapsible || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{saveError}</span>
                </div>
              )}
              
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">Settings saved successfully!</span>
                </div>
              )}
              
              {children}
            </CardContent>
            
            {(onSave || onReset) && (
              <>
                <Separator />
                <CardFooter className="flex justify-between pt-6">
                  <div className="flex gap-2">
                    {onReset && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={!hasChanges || isSaving || isLoading}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    )}
                  </div>
                  
                  {onSave && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving || isLoading}
                      className="gap-2 min-w-[100px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
})

SettingsSection.displayName = "SettingsSection"

// Additional compound components for better organization
export const SettingsGroup: React.FC<{
  title?: string
  children: React.ReactNode
  className?: string
}> = ({ title, children, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

export const SettingsRow: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {children}
    </div>
  )
}

export const SettingsDivider: React.FC<{
  label?: string
  className?: string
}> = ({ label, className }) => {
  return (
    <div className={cn("relative", className)}>
      <Separator />
      {label && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  )
}