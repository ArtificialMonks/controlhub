import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-chub-light-bg dark:bg-gradient-to-br dark:from-chub-dark-bg dark:to-chub-dark-bg-end py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-chub-light-text dark:text-chub-dark-text">
            Communitee Control Hub
          </h1>
          <p className="mt-2 text-sm text-chub-neutral dark:text-chub-neutral">
            Sign in to access your automation dashboard
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-chub-neutral dark:text-chub-neutral">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="font-medium text-chub-accent-blue dark:text-chub-accent-blue hover:text-chub-accent-blue-end dark:hover:text-chub-accent-blue-end"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
