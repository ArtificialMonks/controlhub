// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/login-form'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen relative bg-white dark:bg-gradient-to-br dark:from-[#0a0b1f] dark:to-[#002bff] py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Communitee Control Hub
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your automation dashboard
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign up here
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
