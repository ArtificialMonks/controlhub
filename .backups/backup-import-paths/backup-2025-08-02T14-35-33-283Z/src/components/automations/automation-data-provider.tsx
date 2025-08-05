import 'server-only'
import { User } from '@supabase/supabase-js'
import { serverAutomationService } from '@/lib/services/server-automation-service'
import { AutomationsDashboard } from './AutomationsDashboard'
import { Automation } from '@/lib/repositories/automation-repository'

interface AutomationDataProviderProps {
  user: User
  profile: Record<string, unknown> | null
}

interface Client {
  id: string
  name: string
}

export async function AutomationDataProvider({ user, profile }: AutomationDataProviderProps) {
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
    console.error('Failed to fetch automation data:', err)
    error = err instanceof Error ? err.message : 'Failed to load automation data'
  }

  return (
    <AutomationsDashboard
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