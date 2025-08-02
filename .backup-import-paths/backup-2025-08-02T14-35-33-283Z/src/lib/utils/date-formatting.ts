/**
 * Utility functions for consistent date formatting to prevent hydration mismatches
 */

/**
 * Format date consistently between server and client
 * Uses ISO date format to avoid locale differences
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Never'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    // Use ISO format and then format consistently
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    
    return `${month}/${day}/${year}`
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Format date with time consistently
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'Never'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    
    return `${month}/${day}/${year} ${hours}:${minutes}`
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'Never'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    
    // For older dates, fall back to formatted date
    return formatDate(dateObj)
  } catch {
    return 'Invalid Date'
  }
}