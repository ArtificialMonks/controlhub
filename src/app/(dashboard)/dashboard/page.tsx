// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { verifySession, getUserProfile } from '@/lib/dal'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const user = await verifySession()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()

  return (
    <div className="p-6">
      <DashboardContent user={user} profile={profile} />
    </div>
  )
}
