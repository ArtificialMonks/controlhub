import { redirect } from 'next/navigation'
import { verifySession, getUserProfile } from '@/lib/dal'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const user = await verifySession()
  
  if (!user) {
    redirect('/login')
  }

  let profile = null
  try {
    profile = await getUserProfile()
  } catch (error) {
    console.error('Dashboard: Profile fetch failed:', error)
    // Continue with null profile - components should handle this gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} profile={profile} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DashboardContent user={user} profile={profile} />
      </main>
    </div>
  )
}
