// src/app/auth/auth-code-error/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import Link from 'next/link'

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Get error details from URL parameters
    const errorDescription = searchParams?.get('error_description')
    const errorCode = searchParams?.get('error')
    
    if (errorDescription) {
      setError(errorDescription)
    } else if (errorCode) {
      setError(`Authentication error: ${errorCode}`)
    } else {
      setError('An unknown authentication error occurred')
    }
  }, [searchParams])

  const handleRetry = async () => {
    setIsRetrying(true)
    // Wait a moment then redirect to login
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-900 dark:text-red-100">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            There was a problem confirming your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Details */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                Error Details:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Troubleshooting Steps */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              What to try:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Check if the confirmation link has expired</li>
              <li>Make sure you clicked the complete link from the email</li>
              <li>Try signing up again with the same email</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="w-full"
              variant="default"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isRetrying ? 'Redirecting...' : 'Try Sign Up Again'}
            </Button>

            <Button 
              onClick={handleGoHome}
              variant="outline" 
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home Page
            </Button>
          </div>

          {/* Support Link */}
          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Still having trouble?{' '}
              <Link 
                href="/contact" 
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}