import 'server-only'
import { AutomationRepository, Automation } from '@/lib/data/repositories/automation-repository'

export interface ServerAutomationService {
  getAllAutomations(userId: string): Promise<Automation[]>
  getAutomationById(automationId: string, userId: string): Promise<Automation | null>
  getUniqueClients(userId: string): Promise<Array<{ id: string; name: string }>>
  searchAutomations(userId: string, query: string): Promise<Automation[]>
  getAutomationsByStatus(userId: string, status: string): Promise<Automation[]>
  getAutomationsByClient(userId: string, clientName: string): Promise<Automation[]>
}

export class SupabaseServerAutomationService implements ServerAutomationService {
  private repository: AutomationRepository

  constructor() {
    this.repository = new AutomationRepository()
  }

  async getAllAutomations(userId: string): Promise<Automation[]> {
    return this.repository.getAllAutomations(userId)
  }

  async getAutomationById(automationId: string, userId: string): Promise<Automation | null> {
    const automation = await this.repository.getAutomationById(automationId)
    
    // Check if automation belongs to user through client relationship
    if (automation) {
      const automations = await this.repository.getAllAutomations(userId)
      const userAutomation = automations.find(a => a.id === automationId)
      if (!userAutomation) {
        return null
      }
    }
    
    return automation
  }

  async getUniqueClients(userId: string): Promise<Array<{ id: string; name: string }>> {
    const automations = await this.repository.getAllAutomations(userId)
    const uniqueClients = new Map<string, { id: string; name: string }>()
    
    automations.forEach(automation => {
      // The automation now includes client data from the join query
      const clientData = (automation as Automation & { clients?: { name: string; user_id: string } }).clients
      if (clientData && !uniqueClients.has(clientData.name)) {
        uniqueClients.set(clientData.name, {
          id: automation.client_id,
          name: clientData.name
        })
      }
    })
    
    return Array.from(uniqueClients.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  async searchAutomations(userId: string, query: string): Promise<Automation[]> {
    return this.repository.searchAutomations(userId, query)
  }

  async getAutomationsByStatus(userId: string, status: string): Promise<Automation[]> {
    const validStatuses = ['Running', 'Stopped', 'Error', 'Stalled']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`)
    }
    
    return this.repository.getAutomationsByStatus(userId, status as 'Running' | 'Stopped' | 'Error' | 'Stalled')
  }

  async getAutomationsByClient(userId: string, clientName: string): Promise<Automation[]> {
    return this.repository.getAutomationsByClient(userId, clientName)
  }
}

// Singleton instance for server-side use
export const serverAutomationService = new SupabaseServerAutomationService()