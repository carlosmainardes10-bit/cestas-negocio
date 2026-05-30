import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_IDS } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { plan, promotionCodeId } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, name')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      createAdminClient()
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
        .then(() => {})
    }

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]
    if (!priceId) return NextResponse.json({ error: 'Price ID não configurado' }, { status: 500 })

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?canceled=1`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        ...(promotionCodeId ? { promotion_code_id: promotionCodeId } : {}),
      },
    }

    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }]
      sessionParams.subscription_data = { metadata: { supabase_user_id: user.id, plan } }
    } else {
      sessionParams.subscription_data = {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id, plan },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
