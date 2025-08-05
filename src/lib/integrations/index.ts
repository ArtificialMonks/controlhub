// src/lib/integrations/index.ts
// External integrations

// Supabase (selective exports to avoid conflicts)
export { createClient as createSupabaseClient } from './supabase/client'
export { createClient as createSupabaseServerClient } from './supabase/server'
export * from './supabase/middleware'
