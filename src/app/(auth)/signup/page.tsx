// src/app/(auth)/signup/page.tsx
import { SignupForm } from '@/components/auth/signup-form'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-chub-dark-bg to-chub-dark-bg-end dark:from-chub-dark-bg dark:to-chub-dark-bg-end light:bg-chub-light-bg py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-chub-light-text dark:text-chub-dark-text">
            Communitee Control Hub
          </h1>
          <p className="mt-2 text-sm text-chub-neutral">
            Create your account to get started
          </p>
        </div>
        
        <SignupForm />
        
        <div className="text-center">
          <p className="text-sm text-chub-neutral">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
