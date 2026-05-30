import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) return null
  return user
}

export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coupons, error } = await (supabase as any)
    .from('coupons')
    .select('*, coupon_usages(user_email, redeemed_at)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupons: coupons ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, discount_type, discount_value, applicable_plans, max_redemptions, redeem_by } = await req.json()

  try {
    const existing = await stripe.promotionCodes.list({ code: code.toUpperCase().trim(), limit: 1 })
    if (existing.data.length > 0) {
      return NextResponse.json({ error: 'Código já existe no Stripe' }, { status: 400 })
    }

    const couponData: Parameters<typeof stripe.coupons.create>[0] = {
      duration: 'forever',
      metadata: { applicable_plans: (applicable_plans as string[]).join(',') },
    }
    if (discount_type === 'percent') {
      couponData.percent_off = discount_value
    } else {
      couponData.amount_off = Math.round(discount_value * 100)
      couponData.currency = 'brl'
    }
    const stripeCoupon = await stripe.coupons.create(couponData)

    // SDK da versão 2026-04-22.dahlia filtra 'coupon' por não estar nos tipos — usar fetch direto
    const promoBody = new URLSearchParams({ coupon: stripeCoupon.id, code })
    if (max_redemptions) promoBody.set('max_redemptions', String(max_redemptions))
    if (redeem_by) promoBody.set('expires_at', String(Math.floor(new Date(redeem_by).getTime() / 1000)))

    const promoRes = await fetch('https://api.stripe.com/v1/promotion_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2026-04-22.dahlia',
      },
      body: promoBody.toString(),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripePromoCode = await promoRes.json() as any
    console.log('[promotionCodes fetch]', promoRes.status, JSON.stringify(stripePromoCode))
    if (!promoRes.ok) {
      throw new Error(stripePromoCode.error?.message ?? 'Erro ao criar promotion code no Stripe')
    }

    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: coupon, error } = await (supabase as any)
      .from('coupons')
      .insert({
        stripe_coupon_id: stripeCoupon.id,
        stripe_promotion_code_id: stripePromoCode.id,
        code,
        discount_type,
        discount_value,
        applicable_plans: applicable_plans ?? ['basic', 'premium'],
        max_redemptions: max_redemptions ?? null,
        redeem_by: redeem_by ?? null,
      })
      .select()
      .single()

    if (error) {
      await stripe.promotionCodes.update(stripePromoCode.id, { active: false }).catch(() => {})
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error('[admin/coupons POST] Stripe error:', error instanceof Error ? error.message : (error as any)?.raw?.message ?? (error as any)?.message ?? String(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (error as any)?.raw?.message ?? (error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
