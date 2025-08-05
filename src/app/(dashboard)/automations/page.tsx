// src/app/(dashboard)/automations/page.tsx
import { redirect } from 'next/navigation'
import { verifySession, getUserProfile } from '@/lib/dal'
import { AutomationDataProvider } from '@/components/features/automations/automation-data-provider'

export default async function AutomationsPage() {
  const user = await verifySession()

  if (!user) {
    redirect('/login')
  }

  let profile = null
  try {
    profile = await getUserProfile()
  } catch (error) {
    console.error('Automations: Profile fetch failed:', error)
    // Continue with null profile - components should handle this gracefully
  }

  return <AutomationDataProvider user={user} profile={profile} />
}