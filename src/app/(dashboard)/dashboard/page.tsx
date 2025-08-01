// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { verifySession, getUserProfile } from '@/lib/dal'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const user = await verifySession()
  
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0b1f] to-[#002bff] dark:bg-gradient-to-br dark:from-[#0a0b1f] dark:to-[#002bff] bg-white dark:bg-gray-900">
      <DashboardHeader user={user} profile={profile} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Communitee Control Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Dashboard is loading...
              </p>
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#003cff] to-[#0066ff] hover:from-[#002bff] hover:to-[#0052cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span>Dashboard Active</span>
              </div>
            </div>
          </div>
        </div>
        <DashboardContent user={user} profile={profile} />
      </main>
    </div>
  )
}
