// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { logger } from '@/lib/infrastructure/monitoring/logger'
import { serverAutomationService } from '@/lib/data/services/server-automation-service'
import { DashboardClient } from '@/components/features/dashboard/DashboardClient'
import type { Automation } from '@/lib/data/repositories/automation-repository'

interface Client {
  id: string
  name: string
}
export default async function DashboardPage() {
  const user = await verifySession()

  if (!user) {
    redirect('/login')
  }

  // Fetch real automation data from Supabase
  let automations: Automation[] = []
  let clients: Client[] = []
  let error: string | null = null

  try {
    // Fetch automations for the user
    automations = await serverAutomationService.getAllAutomations(user.id)
    
    // Get unique clients
    clients = await serverAutomationService.getUniqueClients(user.id)
    
    logger.info('Dashboard data loaded', {
      userId: user.id,
      automationCount: automations.length,
      clientCount: clients.length
    })
  } catch (err) {
    logger.error('Dashboard: Failed to fetch automation data:', err instanceof Error ? err : new Error(String(err)))
    error = err instanceof Error ? err.message : 'Failed to load automation data'
    // Fall back to empty arrays for graceful degradation
    automations = []
    clients = []
  }

  return (
    <DashboardClient
      automations={automations}
      clients={clients}
      error={error}
    />
  )
}