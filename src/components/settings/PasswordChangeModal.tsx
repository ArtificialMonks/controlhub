// src/components/settings/PasswordChangeModal.tsx
"use client"

import * as React from "react"
import { X, Key, Eye, EyeOff, AlertTriangle, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/integrations/supabase/client"

import { Button } from "@/components/ui/button"

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function PasswordChangeModal({ isOpen, onClose, userEmail }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const supabase = createClient()

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    const score = Object.values(checks).filter(Boolean).length
    return { checks, score }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (passwordStrength.score < 4) {
      toast.error("Password doesn't meet security requirements")
      return
    }

    setIsLoading(true)
    
    try {
      // Update password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      toast.success("Password changed successfully! A confirmation email has been sent.")
      
    } catch (error) {
      console.error('Password change error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setSuccess(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-background border border-border rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Change Password</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6">
            {!success ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Email
                  </label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {userEmail}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="current-password" className="text-sm font-medium">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                      className="w-full p-3 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full p-3 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score < 2 ? 'bg-red-500 w-1/4' :
                              passwordStrength.score < 3 ? 'bg-yellow-500 w-2/4' :
                              passwordStrength.score < 4 ? 'bg-blue-500 w-3/4' :
                              'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {passwordStrength.score < 2 ? 'Weak' :
                           passwordStrength.score < 3 ? 'Fair' :
                           passwordStrength.score < 4 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        {Object.entries({
                          'At least 8 characters': passwordStrength.checks.length,
                          'One uppercase letter': passwordStrength.checks.uppercase,
                          'One lowercase letter': passwordStrength.checks.lowercase,
                          'One number': passwordStrength.checks.number,
                          'One special character': passwordStrength.checks.special,
                        }).map(([requirement, met]) => (
                          <div key={requirement} className="flex items-center gap-2">
                            {met ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <X className="h-3 w-3 text-red-600" />
                            )}
                            <span className={met ? 'text-green-600' : 'text-red-600'}>
                              {requirement}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full p-3 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">Security Notice:</p>
                    <p className="mt-1 text-blue-700 dark:text-blue-300">
                      A confirmation email will be sent to your email address after changing your password.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || passwordStrength.score < 4}
                    className="flex-1"
                  >
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-500" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Password Changed!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your password has been successfully changed. A confirmation email has been sent to your email address.
                  </p>
                </div>

                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}