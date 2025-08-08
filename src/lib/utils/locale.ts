// src/lib/utils/locale.ts
export interface TimezoneOption {
  label: string
  value: string
  offset: string
}

export interface LanguageOption {
  label: string
  value: string
  nativeName: string
}

// Comprehensive timezone options with labels
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // UTC
  { label: 'UTC', value: 'UTC', offset: '+00:00' },
  
  // North America
  { label: 'Eastern Time', value: 'America/New_York', offset: 'UTC-5/-4' },
  { label: 'Central Time', value: 'America/Chicago', offset: 'UTC-6/-5' },
  { label: 'Mountain Time', value: 'America/Denver', offset: 'UTC-7/-6' },
  { label: 'Pacific Time', value: 'America/Los_Angeles', offset: 'UTC-8/-7' },
  { label: 'Alaska Time', value: 'America/Anchorage', offset: 'UTC-9/-8' },
  { label: 'Hawaii Time', value: 'Pacific/Honolulu', offset: 'UTC-10' },
  
  // Europe
  { label: 'London', value: 'Europe/London', offset: 'UTC+0/+1' },
  { label: 'Paris', value: 'Europe/Paris', offset: 'UTC+1/+2' },
  { label: 'Berlin', value: 'Europe/Berlin', offset: 'UTC+1/+2' },
  { label: 'Rome', value: 'Europe/Rome', offset: 'UTC+1/+2' },
  { label: 'Amsterdam', value: 'Europe/Amsterdam', offset: 'UTC+1/+2' },
  { label: 'Stockholm', value: 'Europe/Stockholm', offset: 'UTC+1/+2' },
  { label: 'Moscow', value: 'Europe/Moscow', offset: 'UTC+3' },
  
  // Asia
  { label: 'Tokyo', value: 'Asia/Tokyo', offset: 'UTC+9' },
  { label: 'Seoul', value: 'Asia/Seoul', offset: 'UTC+9' },
  { label: 'Shanghai', value: 'Asia/Shanghai', offset: 'UTC+8' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong', offset: 'UTC+8' },
  { label: 'Singapore', value: 'Asia/Singapore', offset: 'UTC+8' },
  { label: 'Mumbai', value: 'Asia/Kolkata', offset: 'UTC+5:30' },
  { label: 'Dubai', value: 'Asia/Dubai', offset: 'UTC+4' },
  
  // Australia & Pacific
  { label: 'Sydney', value: 'Australia/Sydney', offset: 'UTC+10/+11' },
  { label: 'Melbourne', value: 'Australia/Melbourne', offset: 'UTC+10/+11' },
  { label: 'Perth', value: 'Australia/Perth', offset: 'UTC+8' },
  { label: 'Auckland', value: 'Pacific/Auckland', offset: 'UTC+12/+13' },
]

// Language options with native names
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: 'English', value: 'en', nativeName: 'English' },
  { label: 'Spanish', value: 'es', nativeName: 'Español' },
  { label: 'French', value: 'fr', nativeName: 'Français' },
  { label: 'German', value: 'de', nativeName: 'Deutsch' },
  { label: 'Italian', value: 'it', nativeName: 'Italiano' },
  { label: 'Portuguese', value: 'pt', nativeName: 'Português' },
  { label: 'Russian', value: 'ru', nativeName: 'Русский' },
  { label: 'Japanese', value: 'ja', nativeName: '日本語' },
  { label: 'Korean', value: 'ko', nativeName: '한국어' },
  { label: 'Chinese (Simplified)', value: 'zh-CN', nativeName: '简体中文' },
  { label: 'Chinese (Traditional)', value: 'zh-TW', nativeName: '繁體中文' },
  { label: 'Arabic', value: 'ar', nativeName: 'العربية' },
  { label: 'Hindi', value: 'hi', nativeName: 'हिन्दी' },
  { label: 'Dutch', value: 'nl', nativeName: 'Nederlands' },
  { label: 'Swedish', value: 'sv', nativeName: 'Svenska' },
  { label: 'Norwegian', value: 'no', nativeName: 'Norsk' },
]

// Utility functions for timezone handling
export const formatDateInTimezone = (date: Date, timezone: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  } catch {
    console.warn(`Invalid timezone: ${timezone}, falling back to UTC`)
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }
}

export const formatTimeInTimezone = (date: Date, timezone: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  } catch {
    console.warn(`Invalid timezone: ${timezone}, falling back to UTC`)
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }
}

export const getCurrentTimezoneOffset = (timezone: string): string => {
  try {
    const now = new Date()
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60)
    
    const sign = offset >= 0 ? '+' : '-'
    const absOffset = Math.abs(offset)
    const hours = Math.floor(absOffset)
    const minutes = Math.round((absOffset - hours) * 60)
    
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } catch {
    console.warn(`Cannot calculate offset for timezone: ${timezone}`)
    return '+00:00'
  }
}

// Utility functions for language handling
export const getLanguageDisplayName = (languageCode: string): string => {
  const language = LANGUAGE_OPTIONS.find(lang => lang.value === languageCode)
  return language ? language.label : languageCode.toUpperCase()
}

export const getLanguageNativeName = (languageCode: string): string => {
  const language = LANGUAGE_OPTIONS.find(lang => lang.value === languageCode)
  return language ? language.nativeName : languageCode.toUpperCase()
}

export const formatNumberInLocale = (number: number, languageCode: string): string => {
  try {
    return new Intl.NumberFormat(languageCode).format(number)
  } catch {
    console.warn(`Invalid language code: ${languageCode}, falling back to en-US`)
    return new Intl.NumberFormat('en-US').format(number)
  }
}

export const formatCurrencyInLocale = (
  amount: number, 
  currency: string, 
  languageCode: string
): string => {
  try {
    return new Intl.NumberFormat(languageCode, {
      style: 'currency',
      currency
    }).format(amount)
  } catch {
    console.warn(`Invalid language/currency: ${languageCode}/${currency}, falling back to en-US/USD`)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
}

// Hook for getting user's preferred timezone/language from settings
export const getUserLocaleSettings = () => {
  if (typeof window === 'undefined') {
    return { timezone: 'UTC', language: 'en' }
  }
  
  return {
    timezone: localStorage.getItem('userTimezone') || 'UTC',
    language: localStorage.getItem('userLanguage') || 'en'
  }
}

// Real-time clock component data
export const getRealtimeClock = (timezone: string) => {
  const now = new Date()
  return {
    time: formatTimeInTimezone(now, timezone),
    date: formatDateInTimezone(now, timezone),
    timestamp: now.getTime()
  }
}