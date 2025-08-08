// src/hooks/useApplyAppearanceSettings.ts
"use client"

import { useEffect } from 'react'
import { useAppearance } from '@/contexts/AppearanceContext'

export function useApplyAppearanceSettings() {
  const { settings } = useAppearance()

  useEffect(() => {
    if (!settings) return

    const root = document.documentElement

    // Apply font size using CSS custom properties (same as original SettingsContext)
    root.style.setProperty('--font-size-multiplier', 
      settings.font_size === 'small' ? '0.875' :
      settings.font_size === 'large' ? '1.125' : '1'
    )
    
    // Apply font family using CSS custom properties (same as original SettingsContext)
    if (settings.font_family === 'orbitron') {
      root.style.setProperty('--font-family-custom', 'Orbitron, monospace')
    } else if (settings.font_family === 'mono') {
      root.style.setProperty('--font-family-custom', 'ui-monospace, monospace')
    } else {
      root.style.setProperty('--font-family-custom', 'ui-sans-serif, system-ui, sans-serif')
    }

    // Apply high contrast
    if (settings.high_contrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Apply reduced motion
    if (settings.reduced_motion) {
      root.style.setProperty('--motion-reduce', 'reduce')
      root.classList.add('reduce-motion')
    } else {
      root.style.setProperty('--motion-reduce', 'no-preference')
      root.classList.remove('reduce-motion')
    }

    console.log('[APPEARANCE] Applied settings using CSS custom properties:', {
      '--font-size-multiplier': settings.font_size === 'small' ? '0.875' :
                                settings.font_size === 'large' ? '1.125' : '1',
      '--font-family-custom': settings.font_family === 'orbitron' ? 'Orbitron, monospace' :
                             settings.font_family === 'mono' ? 'ui-monospace, monospace' :
                             'ui-sans-serif, system-ui, sans-serif',
      high_contrast: settings.high_contrast,
      reduced_motion: settings.reduced_motion,
      theme: settings.theme
    })
  }, [settings])

  return settings
}