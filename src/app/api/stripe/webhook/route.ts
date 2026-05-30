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

      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan
      if (!userId || !plan) break

      await supabase.from('users').update({
        plan: plan as 'basic' | 'premium',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
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
