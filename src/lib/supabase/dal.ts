import { cache } from 'react'
import { createClient } from './server'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
})

export const getProfile = cache(async () => {
  const user = await verifySession()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
})

const TRIAL_DAYS = 7

export function isInTrial(createdAt: string): boolean {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  return diffMs < TRIAL_DAYS * 24 * 60 * 60 * 1000
}

export function trialDaysLeft(createdAt: string): number {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const daysUsed = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  return Math.max(0, TRIAL_DAYS - daysUsed)
}

export function canUsePremium(profile: { plan: string; stripe_subscription_id: string | null; created_at: string }): boolean {
  if (profile.plan === 'premium' && profile.stripe_subscription_id) return true
  if (!profile.stripe_subscription_id && isInTrial(profile.created_at)) return true
  return false
}
