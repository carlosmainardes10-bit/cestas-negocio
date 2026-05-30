import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentFailedEmail } from '@/lib/resend'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      if (!customerId || !subscriptionId) break

      // Lookup user by stripe_customer_id first, fall back to metadata
      const { data: byCustomer } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      const userId = byCustomer?.id ?? session.metadata?.supabase_user_id
      if (!userId) break

      // Determine plan from subscription price_id, fall back to metadata
      let plan: 'basic' | 'premium' | null = null
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price.id
        if (priceId === process.env.STRIPE_BASIC_PRICE_ID) plan = 'basic'
        else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) plan = 'premium'
      } catch { /* ignore */ }
      if (!plan) plan = (session.metadata?.plan as 'basic' | 'premium') ?? null
      if (!plan) break

      await supabase.from('users').update({
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }).eq('id', userId)

      const promotionCodeId = session.metadata?.promotion_code_id
      if (promotionCodeId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any
        const { data: coupon } = await sb
          .from('coupons')
          .select('id')
          .eq('stripe_promotion_code_id', promotionCodeId)
          .maybeSingle()
        if (coupon) {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .maybeSingle()
          if (userData?.email) {
            await sb.from('coupon_usages').insert({
              coupon_id: coupon.id,
              user_email: userData.email,
            }).then(() => {})
          }
        }
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const plan = sub.metadata?.plan as 'basic' | 'premium' | undefined
      const isActive = sub.status === 'active' || sub.status === 'trialing'

      if (isActive && plan) {
        await supabase.from('users').update({
          plan,
          stripe_subscription_id: sub.id,
        }).eq('id', userId)
      } else if (!isActive) {
        await supabase.from('users').update({
          plan: 'basic',
          stripe_subscription_id: null,
        }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('users').update({
        plan: 'basic',
        stripe_subscription_id: null,
      }).eq('id', userId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      if (!customerId) break

      const { data: profile } = await supabase
        .from('users')
        .select('name, email')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (profile?.email) {
        const name = profile.name ?? profile.email.split('@')[0]
        await sendPaymentFailedEmail(profile.email, name).catch(() => {})
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
