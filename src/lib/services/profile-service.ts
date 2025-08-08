// src/lib/services/profile-service.ts
export interface UserProfile {
  id?: string
  user_id: string
  display_name: string | null
  email: string
  bio: string | null
  avatar_url: string | null
  timezone: string
  language: string
  country: string | null
  phone_number: string | null
  team_mode: 'lite' | 'standard' | 'enterprise'
  created_at?: string
  updated_at?: string
}

export class ProfileService {
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      console.log('[PROFILE SERVICE] ===== GET PROFILE START (API) =====')
      
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('[PROFILE SERVICE] API response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[PROFILE SERVICE] ❌ Unauthorized - user not logged in')
          return null
        }
        console.error('[PROFILE SERVICE] ❌ API error:', response.status, response.statusText)
        return null
      }

      const profile = await response.json()
      console.log('[PROFILE SERVICE] ✅ Profile retrieved from API:', profile)
      console.log('[PROFILE SERVICE] ===== GET PROFILE END (API) =====')
      return profile
    } catch (error) {
      console.error('[PROFILE SERVICE] ❌ Exception in getCurrentProfile:', error)
      return null
    }
  }

  async saveProfile(profileData: Partial<UserProfile>): Promise<boolean> {
    try {
      console.log('[PROFILE SERVICE] ===== SAVE PROFILE START (API) =====')
      console.log('[PROFILE SERVICE] Profile data to save:', profileData)
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      console.log('[PROFILE SERVICE] API save response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[PROFILE SERVICE] ❌ Unauthorized - user not logged in')
          return false
        }
        console.error('[PROFILE SERVICE] ❌ API save error:', response.status, response.statusText)
        return false
      }

      const savedProfile = await response.json()
      console.log('[PROFILE SERVICE] ✅ Profile saved successfully via API:', savedProfile)
      console.log('[PROFILE SERVICE] ===== SAVE PROFILE END (API) =====')
      return true
    } catch (error) {
      console.error('[PROFILE SERVICE] ❌ Exception in saveProfile:', error)
      return false
    }
  }

  async createDefaultProfile(): Promise<boolean> {
    // Default profile creation is now handled automatically by the API
    // when a profile is not found. Just return true since getCurrentProfile
    // will handle the creation via the API.
    console.log('[PROFILE SERVICE] Default profile creation delegated to API')
    return true
  }
}

// Export singleton instance
export const profileService = new ProfileService()