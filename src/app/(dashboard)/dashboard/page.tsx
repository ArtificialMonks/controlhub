// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { verifySession, getUserProfile } from '@/lib/dal'
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
    <div className="p-6">
      <DashboardContent user={user} profile={profile} />
    </div>
  )
}
