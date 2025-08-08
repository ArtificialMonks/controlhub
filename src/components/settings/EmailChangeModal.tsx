// src/components/settings/EmailChangeModal.tsx
"use client"

import * as React from "react"
import { X, Mail, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/integrations/supabase/client"

import { Button } from "@/components/ui/button"

interface EmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
}

export function EmailChangeModal({ isOpen, onClose, currentEmail }: EmailChangeModalProps) {
  const [newEmail, setNewEmail] = React.useState("")
  const [confirmEmail, setConfirmEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [verificationSent, setVerificationSent] = React.useState(false)
  const supabase = createClient()

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newEmail !== confirmEmail) {
      toast.error("Email addresses don't match")
      return
    }

    if (newEmail === currentEmail) {
      toast.error("New email must be different from current email")
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      })

      if (error) {
        throw error
      }

      setVerificationSent(true)
      toast.success("Verification email sent! Please check both your old and new email addresses.")
      
    } catch (error) {
      console.error('Email change error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to change email address")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNewEmail("")
    setConfirmEmail("")
    setVerificationSent(false)
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
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Change Email Address</h2>
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
            {!verificationSent ? (
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Email
                  </label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {currentEmail}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="new-email" className="text-sm font-medium">
                    New Email Address
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    required
                    className="w-full p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-email" className="text-sm font-medium">
                    Confirm New Email
                  </label>
                  <input
                    id="confirm-email"
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="Confirm new email address"
                    required
                    className="w-full p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Important:</p>
                    <ul className="mt-1 text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Verification emails will be sent to both your old and new email addresses</li>
                      <li>• You&apos;ll need to verify the change from both emails</li>
                      <li>• Your email won&apos;t change until verification is complete</li>
                    </ul>
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
                    disabled={isLoading || !newEmail || !confirmEmail}
                    className="flex-1"
                  >
                    {isLoading ? "Sending..." : "Send Verification"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-500" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Verification Sent!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    We&apos;ve sent verification emails to both your current and new email addresses. 
                    Please check both inboxes and follow the instructions to complete the change.
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