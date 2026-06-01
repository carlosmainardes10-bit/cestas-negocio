import Stripe from 'stripe'
import { PLANS as PLANS_CONFIG } from './plans'

export { PLANS_CONFIG as PLANS }

export const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID!,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
}

console.log('[stripe init] key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 12))

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})
