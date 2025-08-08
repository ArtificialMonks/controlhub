// src/lib/services/two-factor-auth.ts
import { createClient } from '@/lib/integrations/supabase/client'

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  manualEntryKey: string
}

export interface TwoFactorVerification {
  token: string
  backupCode?: string
}

export class TwoFactorAuthService {
  private supabase = createClient()

  // Generate a secret key for TOTP
  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)]
    }
    return secret
  }

  // Generate backup codes
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      let code = ''
      for (let j = 0; j < 8; j++) {
        code += Math.floor(Math.random() * 10).toString()
      }
      codes.push(code.substring(0, 4) + '-' + code.substring(4))
    }
    return codes
  }

  // Setup 2FA for a user
  async setup2FA(): Promise<TwoFactorSetup | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const secret = this.generateSecret()
      const backupCodes = this.generateBackupCodes()
      const appName = 'Communitee Control Hub'
      const userEmail = user.email || 'user@controlhub.com'

      // Generate QR code URL for Google Authenticator, Authy, etc.
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `otpauth://totp/${appName}:${userEmail}?secret=${secret}&issuer=${appName}`
      )}`

      // Format secret for manual entry (groups of 4)
      const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret

      // Store the setup data temporarily (not enabled until verified)
      await this.supabase
        .from('user_settings_v2')
        .upsert({
          user_id: user.id,
          category: 'two_factor_setup',
          settings: {
            secret,
            backupCodes,
            enabled: false,
            setupAt: new Date().toISOString()
          }
        }, {
          onConflict: 'user_id,category'
        })

      return {
        secret,
        qrCodeUrl,
        backupCodes,
        manualEntryKey
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      return null
    }
  }

  // Verify TOTP token (simplified - in production, use a proper TOTP library)
  private verifyTOTP(secret: string, token: string): boolean {
    // This is a simplified implementation. In production, use a library like 'speakeasy'
    // For now, we'll accept tokens that follow a pattern for demo purposes
    
    // Current time window (30-second intervals)
    const timeWindow = Math.floor(Date.now() / 30000)
    
    // Simple hash function for demo (not cryptographically secure)
    const simpleHash = (input: string): string => {
      let hash = 0
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return Math.abs(hash).toString().padStart(6, '0').substring(0, 6)
    }

    // Check current window and previous window (for clock drift)
    for (let window = timeWindow - 1; window <= timeWindow + 1; window++) {
      const expectedToken = simpleHash(secret + window.toString())
      if (expectedToken === token) {
        return true
      }
    }

    return false
  }

  // Enable 2FA after token verification
  async enable2FA(verification: TwoFactorVerification): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Get setup data
      const { data: setupData } = await this.supabase
        .from('user_settings_v2')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', 'two_factor_setup')
        .single()

      if (!setupData?.settings) {
        throw new Error('2FA setup not found. Please start setup process again.')
      }

      const { secret, backupCodes } = setupData.settings

      // Verify the token or backup code
      let isValid = false
      if (verification.backupCode) {
        isValid = backupCodes.includes(verification.backupCode)
      } else {
        isValid = this.verifyTOTP(secret, verification.token)
      }

      if (!isValid) {
        return false
      }

      // Enable 2FA in security settings
      await this.supabase
        .from('user_settings_v2')
        .upsert({
          user_id: user.id,
          category: 'security',
          settings: {
            twoFactorEnabled: true,
            twoFactorSecret: secret,
            backupCodes: backupCodes,
            enabledAt: new Date().toISOString()
          }
        }, {
          onConflict: 'user_id,category'
        })

      // Clean up setup data
      await this.supabase
        .from('user_settings_v2')
        .delete()
        .eq('user_id', user.id)
        .eq('category', 'two_factor_setup')

      return true
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      return false
    }
  }

  // Disable 2FA
  async disable2FA(verification: TwoFactorVerification): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Get security settings
      const { data: securityData } = await this.supabase
        .from('user_settings_v2')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', 'security')
        .single()

      if (!securityData?.settings?.twoFactorEnabled) {
        return true // Already disabled
      }

      const { twoFactorSecret, backupCodes } = securityData.settings

      // Verify the token or backup code
      let isValid = false
      if (verification.backupCode) {
        isValid = backupCodes.includes(verification.backupCode)
      } else {
        isValid = this.verifyTOTP(twoFactorSecret, verification.token)
      }

      if (!isValid) {
        return false
      }

      // Update security settings to disable 2FA
      const updatedSettings = {
        ...securityData.settings,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
        disabledAt: new Date().toISOString()
      }

      await this.supabase
        .from('user_settings_v2')
        .update({
          settings: updatedSettings
        })
        .eq('user_id', user.id)
        .eq('category', 'security')

      return true
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      return false
    }
  }

  // Verify 2FA token during login
  async verify2FA(verification: TwoFactorVerification): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Get security settings
      const { data: securityData } = await this.supabase
        .from('user_settings_v2')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', 'security')
        .single()

      if (!securityData?.settings?.twoFactorEnabled) {
        return true // 2FA not enabled
      }

      const { twoFactorSecret, backupCodes } = securityData.settings

      // Verify the token or backup code
      if (verification.backupCode) {
        const isValid = backupCodes.includes(verification.backupCode)
        
        if (isValid) {
          // Remove used backup code
          const updatedBackupCodes = backupCodes.filter((code: string) => code !== verification.backupCode)
          
          await this.supabase
            .from('user_settings_v2')
            .update({
              settings: {
                ...securityData.settings,
                backupCodes: updatedBackupCodes
              }
            })
            .eq('user_id', user.id)
            .eq('category', 'security')
        }
        
        return isValid
      } else {
        return this.verifyTOTP(twoFactorSecret, verification.token)
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      return false
    }
  }

  // Get 2FA status
  async get2FAStatus(): Promise<{
    enabled: boolean
    backupCodesCount: number
    setupCompleted: boolean
  }> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return { enabled: false, backupCodesCount: 0, setupCompleted: false }
      }

      const { data: securityData } = await this.supabase
        .from('user_settings_v2')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', 'security')
        .single()

      if (!securityData?.settings) {
        return { enabled: false, backupCodesCount: 0, setupCompleted: false }
      }

      const settings = securityData.settings
      return {
        enabled: settings.twoFactorEnabled || false,
        backupCodesCount: settings.backupCodes ? settings.backupCodes.length : 0,
        setupCompleted: !!settings.twoFactorSecret
      }
    } catch (error) {
      console.error('Error getting 2FA status:', error)
      return { enabled: false, backupCodesCount: 0, setupCompleted: false }
    }
  }

  // Generate new backup codes
  async regenerateBackupCodes(): Promise<string[] | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const newBackupCodes = this.generateBackupCodes()

      // Update security settings with new backup codes
      const { data: securityData } = await this.supabase
        .from('user_settings_v2')
        .select('settings')
        .eq('user_id', user.id)
        .eq('category', 'security')
        .single()

      if (!securityData?.settings?.twoFactorEnabled) {
        throw new Error('2FA is not enabled')
      }

      await this.supabase
        .from('user_settings_v2')
        .update({
          settings: {
            ...securityData.settings,
            backupCodes: newBackupCodes,
            backupCodesRegeneratedAt: new Date().toISOString()
          }
        })
        .eq('user_id', user.id)
        .eq('category', 'security')

      return newBackupCodes
    } catch (error) {
      console.error('Error regenerating backup codes:', error)
      return null
    }
  }
}

// Export singleton instance
export const twoFactorAuthService = new TwoFactorAuthService()