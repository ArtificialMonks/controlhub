// src/lib/data/mock-clients.ts
/**
 * Mock client data for development and testing
 * Matches the Client interface from automation.ts
 */

import type { Client } from '@/lib/types/automation'

export const mockClients: Client[] = [
  {
    id: 'client-001',
    name: 'Acme Corporation',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'client-002', 
    name: 'TechStart Inc',
    created_at: '2024-02-01T14:30:00Z'
  },
  {
    id: 'client-003',
    name: 'Global Solutions Ltd',
    created_at: '2024-02-15T09:15:00Z'
  },
  {
    id: 'client-004',
    name: 'Innovation Labs',
    created_at: '2024-03-01T16:45:00Z'
  },
  {
    id: 'client-005',
    name: 'Digital Dynamics',
    created_at: '2024-03-10T11:20:00Z'
  }
]

export default mockClients
