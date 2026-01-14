'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
    }
    return data
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await fetchProfile(user.id)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const canDeleteTweets = () => {
    if (!profile) return { allowed: false, remaining: 0 }

    // Pro and Lifetime have unlimited
    if (profile.subscription_tier === 'pro' || profile.subscription_tier === 'lifetime') {
      if (profile.subscription_status === 'active') {
        return { allowed: true, remaining: Infinity }
      }
    }

    // Free tier: 50 tweets per day
    const today = new Date().toISOString().split('T')[0]
    const lastDeletion = profile.last_deletion_date

    if (lastDeletion !== today) {
      return { allowed: true, remaining: 50 }
    }

    const remaining = 50 - (profile.tweets_deleted_today || 0)
    return { allowed: remaining > 0, remaining: Math.max(0, remaining) }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    canDeleteTweets,
    isPro: profile?.subscription_tier === 'pro' && profile?.subscription_status === 'active',
    isLifetime: profile?.subscription_tier === 'lifetime',
    isPaid: (profile?.subscription_tier === 'pro' && profile?.subscription_status === 'active') ||
            profile?.subscription_tier === 'lifetime',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
