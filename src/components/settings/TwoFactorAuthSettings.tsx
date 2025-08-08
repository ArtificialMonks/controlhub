// src/components/settings/TwoFactorAuthSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Shield, Smartphone, Key, Download, RefreshCw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { twoFactorAuthService, type TwoFactorSetup } from '@/lib/services/two-factor-auth'

interface TwoFactorAuthSettingsProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function TwoFactorAuthSettings({ enabled, onToggle }: TwoFactorAuthSettingsProps) {
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null)
  const [verificationToken, setVerificationToken] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [setupStep, setSetupStep] = useState<'scan' | 'verify' | 'backup'>('scan')
  const [isLoading, setIsLoading] = useState(false)
  const [backupCodesCount, setBackupCodesCount] = useState(0)
  const [copiedSecret, setCopiedSecret] = useState(false)

  // Load 2FA status on component mount
  useEffect(() => {
    loadTwoFactorStatus()
  }, [])

  const loadTwoFactorStatus = async () => {
    try {
      const status = await twoFactorAuthService.get2FAStatus()
      setBackupCodesCount(status.backupCodesCount)
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    }
  }

  const startSetup = async () => {
    setIsLoading(true)
    try {
      const setup = await twoFactorAuthService.setup2FA()
      if (setup) {
        setSetupData(setup)
        setShowSetupDialog(true)
        setSetupStep('scan')
      } else {
        toast.error('Failed to initialize 2FA setup')
      }
    } catch (error) {
      console.error('2FA setup error:', error)
      toast.error('Failed to start 2FA setup')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationToken || !setupData) return
    
    setIsLoading(true)
    try {
      const success = await twoFactorAuthService.enable2FA({
        token: verificationToken,
      })
      
      if (success) {
        toast.success('Two-Factor Authentication enabled successfully!')
        setSetupStep('backup')
        onToggle(true)
        await loadTwoFactorStatus()
      } else {
        toast.error('Invalid verification code. Please try again.')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      toast.error('Failed to verify 2FA setup')
    } finally {
      setIsLoading(false)
    }
  }

  const disableTwoFactor = async () => {
    if (!verificationToken && !backupCode) return
    
    setIsLoading(true)
    try {
      const success = await twoFactorAuthService.disable2FA({
        token: verificationToken || '',
        backupCode: backupCode || undefined,
      })
      
      if (success) {
        toast.success('Two-Factor Authentication disabled successfully')
        setShowDisableDialog(false)
        setVerificationToken('')
        setBackupCode('')
        onToggle(false)
        await loadTwoFactorStatus()
      } else {
        toast.error('Invalid verification code or backup code. Please try again.')
      }
    } catch (error) {
      console.error('2FA disable error:', error)
      toast.error('Failed to disable 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateBackupCodes = async () => {
    setIsLoading(true)
    try {
      const newCodes = await twoFactorAuthService.regenerateBackupCodes()
      if (newCodes) {
        toast.success('Backup codes regenerated successfully')
        await loadTwoFactorStatus()
      } else {
        toast.error('Failed to regenerate backup codes')
      }
    } catch (error) {
      console.error('Backup codes regeneration error:', error)
      toast.error('Failed to regenerate backup codes')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSecret(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedSecret(false), 2000)
    } catch (error) {
      console.error('Clipboard copy error:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadBackupCodes = () => {
    if (!setupData) return
    
    const content = `Communitee Control Hub - Two-Factor Authentication Backup Codes
Generated on: ${new Date().toLocaleDateString()}

IMPORTANT: Save these backup codes in a safe place. Each code can only be used once.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Keep these codes secure and do not share them with anyone.`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'controlhub-2fa-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* 2FA Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              {enabled && (
                <Badge variant="default" className="bg-green-500">
                  Enabled
                </Badge>
              )}
            </div>
            {!enabled ? (
              <Button onClick={startSetup} disabled={isLoading}>
                <Smartphone className="h-4 w-4 mr-2" />
                Set up 2FA
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowDisableDialog(true)}
                disabled={isLoading}
              >
                Disable 2FA
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            {enabled 
              ? 'Your account is protected with two-factor authentication. You will need your authenticator app or a backup code to sign in.'
              : 'Add an extra layer of security to your account by requiring a verification code from your phone in addition to your password.'
            }
          </CardDescription>
          
          {enabled && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Key className="h-4 w-4" />
                <span>{backupCodesCount} backup codes remaining</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={regenerateBackupCodes}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {setupStep === 'scan' && 'Scan the QR code with your authenticator app'}
              {setupStep === 'verify' && 'Enter the verification code from your app'}
              {setupStep === 'backup' && 'Save your backup codes'}
            </DialogDescription>
          </DialogHeader>
          
          {setupData && (
            <div className="space-y-4">
              {setupStep === 'scan' && (
                <>
                  <div className="text-center">
                    <Image 
                      src={setupData.qrCodeUrl} 
                      alt="2FA QR Code" 
                      width={200}
                      height={200}
                      className="mx-auto border rounded"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Or enter this key manually:</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        readOnly 
                        value={setupData.manualEntryKey} 
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(setupData.manualEntryKey)}
                      >
                        {copiedSecret ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setSetupStep('verify')} 
                    className="w-full"
                  >
                    I have added this to my authenticator app
                  </Button>
                </>
              )}
              
              {setupStep === 'verify' && (
                <>
                  <div className="space-y-2">
                    <Label>Enter verification code</Label>
                    <Input
                      placeholder="000000"
                      value={verificationToken}
                      onChange={(e) => setVerificationToken(e.target.value)}
                      maxLength={6}
                      className="text-center font-mono text-lg"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSetupStep('scan')}
                      className="w-full"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={verifyAndEnable}
                      disabled={!verificationToken || isLoading}
                      className="w-full"
                    >
                      Verify & Enable
                    </Button>
                  </div>
                </>
              )}
              
              {setupStep === 'backup' && (
                <>
                  <div className="space-y-2">
                    <Label>Backup Codes</Label>
                    <p className="text-sm text-muted-foreground">
                      Save these codes in a safe place. You can use them to sign in if you lose access to your authenticator app.
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-sm space-y-1 max-h-40 overflow-y-auto">
                      {setupData.backupCodes.map((code) => (
                        <div key={code}>{code}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={downloadBackupCodes}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => setShowSetupDialog(false)}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authenticator code or use a backup code to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                placeholder="000000"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                maxLength={6}
                className="text-center font-mono"
              />
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              or
            </div>
            
            <div className="space-y-2">
              <Label>Backup Code</Label>
              <Input
                placeholder="0000-0000"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="text-center font-mono"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(false)}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={disableTwoFactor}
                disabled={(!verificationToken && !backupCode) || isLoading}
                className="w-full"
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}