import 'server-only'
import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export const verifySession = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
})

export const getUser = cache(async (): Promise<User | null> => {
  const user = await verifySession()
  return user
})

export const getUserProfile = cache(async () => {
  const user = await verifySession()
  
  if (!user) {
    return null
  }
  
  const supabase = await createClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Profile fetch error:', error)
      return null
    }
    
    return profile
  } catch (error) {
    console.error('Profile fetch error:', error)
    return null
  }
})

export const requireAuth = cache(async (): Promise<User> => {
  const user = await verifySession()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
})

export const createSession = async (email: string, password: string) => {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw error
    }
    
    return { user: data.user, session: data.session }
  } catch (error) {
    console.error('Session creation error:', error)
    throw error
  }
}

export const destroySession = async () => {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Session destruction error:', error)
    throw error
  }
}

export const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    
    if (error) {
      throw error
    }
    
    return { user: data.user, session: data.session }
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

export const resetPassword = async (email: string) => {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })
    
    if (error) {
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    throw error
  }
}

export const updatePassword = async (password: string) => {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    })
    
    if (error) {
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Password update error:', error)
    throw error
  }
}
