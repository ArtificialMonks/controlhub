// src/components/settings/compound/SettingsSection.tsx
/**
 * Compound Settings Section Component for Quest 6.1 Enterprise-Grade Settings
 * Provides accessible, reusable settings building blocks with React Aria integration
 */

'use client'

import React, { createContext, useContext, useId } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SecurityContext } from '@/lib/security/security-framework'

export interface SettingsSectionContextValue {
  sectionId: string
  isLoading: boolean
  hasChanges: boolean
  errors: Record<string, string>
  securityContext?: SecurityContext
  onFieldChange: (fieldName: string, value: unknown) => void
  onSave: () => Promise<void>
  onReset: () => void
  onValidate: (fieldName: string, value: unknown) => Promise<{ valid: boolean; error?: string }>
}

const SettingsSectionContext = createContext<SettingsSectionContextValue | null>(null)

export function useSettingsSection() {
  const context = useContext(SettingsSectionContext)
  if (!context) {
    throw new Error('useSettingsSection must be used within a SettingsSection')
  }
  return context
}

export interface SettingsSectionProps {
  readonly title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  isLoading?: boolean
  hasChanges?: boolean
  errors?: Record<string, string>
  securityContext?: SecurityContext
  className?: string
  onSave?: () => Promise<void>
  onReset?: () => void
  onFieldChange?: (fieldName: string, value: unknown) => void
  onValidate?: (fieldName: string, value: unknown) => Promise<{ valid: boolean; error?: string }>
}

/**
 * Main Settings Section Component
 * Provides context and structure for settings groups
 */
export function SettingsSection({
  title,
  description,
  icon,
  children,
  isLoading = false,
  hasChanges = false,
  errors = {},
  securityContext,
  className,
  onSave,
  onReset,
  onFieldChange,
  onValidate
}: SettingsSectionProps) {
  const { toast } = useToast()
  const sectionId = useId()

  const handleSave = async () => {
    if (!onSave) return
    
    try {
      await onSave()
      toast({
        title: "Settings saved",
        description: `${title} settings have been updated successfully.`,
        duration: 3000
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
        duration: 5000
      })
    }
  }

  const handleReset = () => {
    if (!onReset) return
    onReset()
    toast({
      title: "Settings reset",
      description: `${title} settings have been reset to defaults.`,
      duration: 3000
    })
  }

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onFieldChange?.(fieldName, value)
  }

  const handleValidate = async (fieldName: string, value: unknown) => {
    if (!onValidate) return { valid: true }
    return await onValidate(fieldName, value)
  }

  const contextValue: SettingsSectionContextValue = {
    sectionId,
    isLoading,
    hasChanges,
    errors,
    securityContext,
    onFieldChange: handleFieldChange,
    onSave: handleSave,
    onReset: handleReset,
    onValidate: handleValidate
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <SettingsSectionContext.Provider value={contextValue}>
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {icon}
                </div>
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {title}
                  {hasErrors && (
                    <AlertTriangle className="h-4 w-4 text-destructive" aria-label="Has validation errors" />
                  )}
                  {hasChanges && !hasErrors && (
                    <div className="h-2 w-2 rounded-full bg-orange-500" aria-label="Has unsaved changes" />
                  )}
                </CardTitle>
                {description && (
                  <CardDescription className="mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            
            {(onSave || onReset) && (
              <SettingsActions />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>
    </SettingsSectionContext.Provider>
  )
}

/**
 * Settings Actions Component
 * Provides save and reset functionality
 */
export function SettingsActions() {
  const { isLoading, hasChanges, onSave, onReset } = useSettingsSection()

  return (
    <div className="flex items-center gap-2">
      {onReset && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isLoading || !hasChanges}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      )}
      
      {onSave && (
        <Button
          size="sm"
          onClick={onSave}
          disabled={isLoading || !hasChanges}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      )}
    </div>
  )
}

/**
 * Settings Group Component
 * Groups related settings fields together
 */
export interface SettingsGroupProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingsGroup({ title, description, children, className }: SettingsGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-medium leading-none">{title}</h4>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

/**
 * Settings Field Component
 * Base component for individual settings fields
 */
export interface SettingsFieldProps {
  name: string
  label: string
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  error?: string
  success?: boolean
}

export function SettingsField({
  name,
  label,
  description,
  required = false,
  children,
  className,
  error,
  success = false
}: SettingsFieldProps) {
  const { errors } = useSettingsSection()
  const fieldId = useId()
  const descriptionId = useId()
  const errorId = useId()
  
  const fieldError = error || errors[name]
  const hasError = Boolean(fieldError)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            hasError && "text-destructive",
            required && "after:content-['*'] after:ml-0.5 after:text-destructive"
          )}
        >
          {label}
        </Label>
        
        {success && !hasError && (
          <CheckCircle className="h-4 w-4 text-green-600" aria-label="Valid" />
        )}
      </div>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: fieldId,
          'aria-describedby': cn(
            description && descriptionId,
            hasError && errorId
          ),
          'aria-invalid': hasError,
          className: cn(
            (children as React.ReactElement<Record<string, unknown>>).props?.className as string,
            hasError && "border-destructive focus-visible:ring-destructive"
          )
        })}
      </div>
      
      {hasError && (
        <p 
          id={errorId}
          className="text-sm text-destructive flex items-center gap-1"
          role="alert"
        >
          <AlertTriangle className="h-3 w-3" />
          {fieldError}
        </p>
      )}
    </div>
  )
}

/**
 * Settings Divider Component
 * Visual separator between settings groups
 */
export function SettingsDivider() {
  return <div className="border-t border-border" />
}

/**
 * Settings Status Component
 * Shows overall status of the settings section
 */
export interface SettingsStatusProps {
  className?: string
}

export function SettingsStatus({ className }: SettingsStatusProps) {
  const { isLoading, hasChanges, errors } = useSettingsSection()
  const hasErrors = Object.keys(errors).length > 0

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settings...
      </div>
    )
  }

  if (hasErrors) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
        <AlertTriangle className="h-4 w-4" />
        {Object.keys(errors).length} validation error{Object.keys(errors).length !== 1 ? 's' : ''}
      </div>
    )
  }

  if (hasChanges) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-orange-600", className)}>
        <div className="h-2 w-2 rounded-full bg-orange-500" />
        Unsaved changes
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm text-green-600", className)}>
      <CheckCircle className="h-4 w-4" />
      All settings saved
    </div>
  )
}

/**
 * Settings Help Component
 * Provides contextual help and documentation links
 */
export interface SettingsHelpProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function SettingsHelp({ title = "Help", children, className }: SettingsHelpProps) {
  return (
    <div className={cn("rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950", className)}>
      <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
        {title}
      </h5>
      <div className="text-sm text-blue-800 dark:text-blue-200">
        {children}
      </div>
    </div>
  )
}

// Types are already exported with their interface declarations above
