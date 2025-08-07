// src/components/settings/compound/SettingsFormControls.tsx
/**
 * React Aria Enhanced Form Controls for Quest 6.1 Enterprise-Grade Settings
 * Provides accessible form controls with comprehensive keyboard navigation and screen reader support
 */

'use client'

import React, { useId, useState, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useSettingsSection, SettingsField } from './SettingsSection'
import { type ValidationResult } from '@/lib/security/input-validation'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Check, X } from 'lucide-react'

export interface BaseFieldProps {
  name: string
  label: string
  description?: string
  required?: boolean
  disabled?: boolean
  className?: string
  onChange?: (value: unknown) => void
  onBlur?: () => void
  onValidate?: (value: unknown) => Promise<ValidationResult>
}

/**
 * Settings Switch Component with React Aria accessibility
 */
export interface SettingsSwitchProps extends BaseFieldProps {
  value: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function SettingsSwitch({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value,
  size = 'default',
  className,
  onChange,
  onBlur,
  onValidate
}: SettingsSwitchProps) {
  const { onFieldChange, onValidate: sectionValidate } = useSettingsSection()
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const handleChange = useCallback(async (checked: boolean) => {
    onChange?.(checked)
    onFieldChange(name, checked)

    // Validate if validator is provided
    if (onValidate || sectionValidate) {
      setIsValidating(true)
      try {
        const result = onValidate 
          ? await onValidate(checked)
          : await sectionValidate(name, checked)
        setValidationResult(result as ValidationResult)
      } catch {
        setValidationResult({
          valid: false,
          errors: ['Validation failed'],
          riskScore: 1
        } as ValidationResult)
      } finally {
        setIsValidating(false)
      }
    }
  }, [name, onChange, onFieldChange, onValidate, sectionValidate])

  const handleBlur = useCallback(() => {
    onBlur?.()
  }, [onBlur])

  return (
    <SettingsField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={validationResult?.errors?.[0]}
      success={validationResult?.valid}
    >
      <div className="flex items-center space-x-2">
        <Switch
          checked={value}
          onCheckedChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled || isValidating}
          className={cn(
            size === 'sm' && 'scale-90',
            size === 'lg' && 'scale-110'
          )}
          aria-describedby={description ? `${name}-description` : undefined}
        />
        {isValidating && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>
    </SettingsField>
  )
}

/**
 * Settings Text Input Component with validation
 */
export interface SettingsTextInputProps extends BaseFieldProps {
  value: string
  type?: 'text' | 'email' | 'password' | 'url' | 'tel'
  placeholder?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  autoComplete?: string
}

export function SettingsTextInput({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value,
  type = 'text',
  placeholder,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  className,
  onChange,
  onBlur,
  onValidate
}: SettingsTextInputProps) {
  const { onFieldChange, onValidate: sectionValidate } = useSettingsSection()
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const inputId = useId()

  const handleChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    onChange?.(newValue)
    onFieldChange(name, newValue)

    // Real-time validation for security-sensitive fields
    if (type === 'email' || type === 'password' || type === 'url') {
      setIsValidating(true)
      try {
        const result = onValidate
          ? await onValidate(newValue)
          : await sectionValidate(name, newValue)
        setValidationResult(result as ValidationResult)
      } catch {
        setValidationResult({
          valid: false,
          errors: ['Validation failed'],
          riskScore: 1
        })
      } finally {
        setIsValidating(false)
      }
    }
  }, [name, type, onChange, onFieldChange, onValidate, sectionValidate])

  const handleBlur = useCallback(async () => {
    onBlur?.()
    
    // Validate on blur for all fields
    if (value && (onValidate || sectionValidate)) {
      setIsValidating(true)
      try {
        const result = onValidate
          ? await onValidate(value)
          : await sectionValidate(name, value)
        setValidationResult(result as ValidationResult)
      } catch {
        setValidationResult({
          valid: false,
          errors: ['Validation failed'],
          riskScore: 1
        })
      } finally {
        setIsValidating(false)
      }
    }
  }, [value, name, onBlur, onValidate, sectionValidate])

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <SettingsField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={validationResult?.errors?.[0]}
      success={validationResult?.valid && value.length > 0}
    >
      <div className="relative">
        <Input
          id={inputId}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isValidating}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          className={cn(
            type === 'password' && 'pr-10',
            validationResult?.riskScore && validationResult.riskScore > 3 && 'border-orange-500'
          )}
          aria-invalid={validationResult ? !validationResult.valid : undefined}
        />
        
        {type === 'password' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {isValidating && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        
        {validationResult && !isValidating && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {validationResult.valid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>
    </SettingsField>
  )
}

/**
 * Settings Textarea Component
 */
export interface SettingsTextareaProps extends BaseFieldProps {
  value: string
  placeholder?: string
  rows?: number
  maxLength?: number
  minLength?: number
  resize?: boolean
}

export function SettingsTextarea({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value,
  placeholder,
  rows = 3,
  maxLength,
  minLength,
  resize = true,
  className,
  onChange,
  onBlur,
  onValidate
}: SettingsTextareaProps) {
  const { onFieldChange, onValidate: sectionValidate } = useSettingsSection()
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    onChange?.(newValue)
    onFieldChange(name, newValue)
  }, [name, onChange, onFieldChange])

  const handleBlur = useCallback(async () => {
    onBlur?.()
    
    if (value && (onValidate || sectionValidate)) {
      setIsValidating(true)
      try {
        const result = onValidate
          ? await onValidate(value)
          : await sectionValidate(name, value)
        setValidationResult(result as ValidationResult)
      } catch {
        setValidationResult({
          valid: false,
          errors: ['Validation failed'],
          riskScore: 1
        })
      } finally {
        setIsValidating(false)
      }
    }
  }, [value, name, onBlur, onValidate, sectionValidate])

  return (
    <SettingsField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={validationResult?.errors?.[0]}
      success={validationResult?.valid && value.length > 0}
    >
      <div className="relative">
        <Textarea
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isValidating}
          rows={rows}
          maxLength={maxLength}
          minLength={minLength}
          className={cn(
            !resize && 'resize-none',
            validationResult?.riskScore && validationResult.riskScore > 3 && 'border-orange-500'
          )}
          aria-invalid={validationResult ? !validationResult.valid : undefined}
        />
        
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </div>
        )}
        
        {isValidating && (
          <div className="absolute right-2 top-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </SettingsField>
  )
}

/**
 * Settings Select Component
 */
export interface SettingsSelectProps extends BaseFieldProps {
  value: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export function SettingsSelect({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value,
  options,
  placeholder = 'Select an option...',
  className,
  onChange,
  onBlur
}: SettingsSelectProps) {
  const { onFieldChange } = useSettingsSection()

  const handleValueChange = useCallback((newValue: string) => {
    onChange?.(newValue)
    onFieldChange(name, newValue)
  }, [name, onChange, onFieldChange])

  return (
    <SettingsField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
    >
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger onBlur={onBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsField>
  )
}

/**
 * Settings Slider Component
 */
export interface SettingsSliderProps extends BaseFieldProps {
  value: number[]
  min?: number
  max?: number
  step?: number
  formatValue?: (value: number) => string
}

export function SettingsSlider({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  className,
  onChange,
  onBlur
}: SettingsSliderProps) {
  const { onFieldChange } = useSettingsSection()

  const handleValueChange = useCallback((newValue: number[]) => {
    onChange?.(newValue)
    onFieldChange(name, newValue)
  }, [name, onChange, onFieldChange])

  const displayValue = formatValue ? formatValue(value[0]) : value[0].toString()

  return (
    <SettingsField
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {formatValue ? formatValue(min) : min}
          </span>
          <span className="text-sm font-medium">
            {displayValue}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatValue ? formatValue(max) : max}
          </span>
        </div>
        
        <Slider
          value={value}
          onValueChange={handleValueChange}
          onValueCommit={onBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />
      </div>
    </SettingsField>
  )
}

// Types are already exported with their interface declarations above
