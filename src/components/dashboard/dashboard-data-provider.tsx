import 'server-only'
import { User } from '@supabase/supabase-js'
import { serverAutomationService } from '@/lib/services/server-automation-service'
import { DashboardFilterContainer } from './DashboardFilterContainer'
import { Automation } from '@/lib/repositories/automation-repository'

interface DashboardDataProviderProps {
  user: User
  profile: Record<string, unknown> | null
}

interface Client {
  id: string
  name: string
}

export async function DashboardDataProvider({ user, profile }: DashboardDataProviderProps) {
  let automations: Automation[] = []
  let clients: Client[] = []
  let error: string | null = null

  try {
    // Fetch automations for the user
    automations = await serverAutomationService.getAllAutomations(user.id)
    
    // Get unique clients
    clients = await serverAutomationService.getUniqueClients(user.id)
    
    console.log(`Loaded ${automations.length} automations and ${clients.length} clients for user ${user.id}`)
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err)
    error = err instanceof Error ? err.message : 'Failed to load dashboard data'
  }

  return (
    <DashboardFilterContainer
      user={user}
      profile={profile}
      initialData={{
        automations,
        clients,
        error
      }}
    />
  )
}