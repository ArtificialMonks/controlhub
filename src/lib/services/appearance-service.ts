// src/lib/services/appearance-service.ts
export interface UserAppearanceSettings {
  id?: string
  user_id: string
  theme: 'light' | 'dark'
  high_contrast: boolean
  reduced_motion: boolean
  font_size: 'small' | 'medium' | 'large'
  font_family: 'default' | 'orbitron' | 'mono'
  created_at?: string
  updated_at?: string
}

export class AppearanceService {
  async getCurrentSettings(): Promise<UserAppearanceSettings | null> {
    try {
      console.log('[APPEARANCE SERVICE] ===== GET SETTINGS START (API) =====')
      
      const response = await fetch('/api/appearance', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('[APPEARANCE SERVICE] API response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[APPEARANCE SERVICE] ❌ Unauthorized - user not logged in')
          return null
        }
        console.error('[APPEARANCE SERVICE] ❌ API error:', response.status, response.statusText)
        return null
      }

      const settings = await response.json()
      console.log('[APPEARANCE SERVICE] ✅ Settings retrieved from API:', settings)
      console.log('[APPEARANCE SERVICE] ===== GET SETTINGS END (API) =====')
      return settings
    } catch (error) {
      console.error('[APPEARANCE SERVICE] ❌ Exception in getCurrentSettings:', error)
      return null
    }
  }

  async saveSettings(settingsData: Partial<UserAppearanceSettings>): Promise<boolean> {
    try {
      console.log('[APPEARANCE SERVICE] ===== SAVE SETTINGS START (API) =====')
      console.log('[APPEARANCE SERVICE] Settings data to save:', settingsData)
      
      const response = await fetch('/api/appearance', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData)
      })

      console.log('[APPEARANCE SERVICE] API save response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[APPEARANCE SERVICE] ❌ Unauthorized - user not logged in')
          return false
        }
        console.error('[APPEARANCE SERVICE] ❌ API save error:', response.status, response.statusText)
        return false
      }

      const savedSettings = await response.json()
      console.log('[APPEARANCE SERVICE] ✅ Settings saved successfully via API:', savedSettings)
      console.log('[APPEARANCE SERVICE] ===== SAVE SETTINGS END (API) =====')
      return true
    } catch (error) {
      console.error('[APPEARANCE SERVICE] ❌ Exception in saveSettings:', error)
      return false
    }
  }
}

// Export singleton instance
export const appearanceService = new AppearanceService()