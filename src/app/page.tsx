import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const user = await verifySession()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Communitee Control Hub
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Your automation management dashboard
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/login">
            <Button className="w-full">
              Sign In
            </Button>
          </Link>

          <Link href="/signup">
            <Button variant="outline" className="w-full">
              Create Account
            </Button>
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>Manage your n8n automations with ease</p>
          <p>Professional dashboard for automation control</p>
        </div>
      </div>
    </div>
  )
}
