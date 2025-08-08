// src/components/settings/compound/SettingsFormControls.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, Eye, EyeOff, Check, Loader2 } from "lucide-react"
import {
  SettingsTextInputProps,
  SettingsSwitchProps,
  SettingsSelectProps,
  SettingsSliderProps
} from "@/types/settings"

export const SettingsTextInput = React.forwardRef<
  HTMLInputElement,
  SettingsTextInputProps
>(({
  label,
  description,
  error,
  required,
  disabled,
  className,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  pattern
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasBeenTouched, setHasBeenTouched] = React.useState(false)
  
  const inputType = type === 'password' && showPassword ? 'text' : type
  const hasError = error && hasBeenTouched

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={label}
          className={cn(
            "text-sm font-medium",
            hasError && "text-destructive",
            disabled && "opacity-50"
          )}
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      </div>
      
      <div className="relative">
        <Input
          ref={ref}
          id={label}
          type={inputType}
          value={value}
          onChange={(e) => {
            setHasBeenTouched(true)
            onChange(e.target.value)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          pattern={pattern}
          className={cn(
            "pr-10 transition-all duration-200",
            isFocused && "ring-2 ring-primary/20",
            hasError && "border-destructive focus:ring-destructive/20",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        
        {hasError && (
          <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
      </div>
      
      {description && !hasError && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {hasError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
})

SettingsTextInput.displayName = "SettingsTextInput"

export const SettingsSwitch = React.forwardRef<
  HTMLButtonElement,
  SettingsSwitchProps
>(({
  label,
  description,
  error,
  required,
  disabled,
  className,
  checked,
  onCheckedChange,
  size = 'md'
}, ref) => {
  const [isChanging, setIsChanging] = React.useState(false)
  
  const handleChange = async (value: boolean) => {
    setIsChanging(true)
    onCheckedChange(value)
    // Simulate async operation
    setTimeout(() => setIsChanging(false), 300)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label 
            htmlFor={label}
            className={cn(
              "text-sm font-medium cursor-pointer",
              error && "text-destructive",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        
        <div className="relative">
          <Switch
            ref={ref}
            id={label}
            checked={checked}
            onCheckedChange={handleChange}
            disabled={disabled || isChanging}
            className={cn(
              "transition-all duration-200",
              size === 'sm' && "scale-75",
              size === 'lg' && "scale-125",
              isChanging && "opacity-50"
            )}
          />
          
          {isChanging && (
            <Loader2 className="absolute -right-6 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-primary" />
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
})

SettingsSwitch.displayName = "SettingsSwitch"

export const SettingsSelect = React.forwardRef<
  HTMLButtonElement,
  SettingsSelectProps
>(({
  label,
  description,
  error,
  required,
  disabled,
  className,
  value,
  onChange,
  options,
  placeholder = "Select an option"
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={label}
        className={cn(
          "text-sm font-medium",
          error && "text-destructive",
          disabled && "opacity-50"
        )}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger
          ref={ref}
          id={label}
          className={cn(
            "transition-all duration-200",
            isOpen && "ring-2 ring-primary/20",
            error && "border-destructive focus:ring-destructive/20"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {value === option.value && (
                  <Check className="h-3 w-3 text-primary" />
                )}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
})

SettingsSelect.displayName = "SettingsSelect"

export const SettingsSlider = React.forwardRef<
  HTMLDivElement,
  SettingsSliderProps
>(({
  label,
  description,
  error,
  required,
  disabled,
  className,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = ""
}, ref) => {
  const [isDragging, setIsDragging] = React.useState(false)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={label}
          className={cn(
            "text-sm font-medium",
            error && "text-destructive",
            disabled && "opacity-50"
          )}
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        
        <span className={cn(
          "text-sm font-mono px-2 py-1 bg-muted rounded-md transition-colors",
          isDragging && "bg-primary/10 text-primary"
        )}>
          {value[0]}{unit}
        </span>
      </div>
      
      <Slider
        ref={ref}
        id={label}
        value={value}
        onValueChange={(newValue) => {
          onValueChange(newValue)
          setIsDragging(false)
        }}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          "transition-opacity duration-200",
          isDragging && "[&_[role=slider]]:scale-125",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
})

SettingsSlider.displayName = "SettingsSlider"