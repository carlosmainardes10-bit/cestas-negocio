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
      return NextResponse.json({ error: 'Este código já existe' }, { status: 400 })
    }

    // Passo 1: criar o coupon
    const couponParams: Parameters<typeof stripe.coupons.create>[0] = {
      duration: 'forever',
      metadata: { applicable_plans: (applicable_plans as string[]).join(',') },
    }
    if (discount_type === 'percent') {
      couponParams.percent_off = discount_value
    } else {
      couponParams.amount_off = Math.round(discount_value * 100)
      couponParams.currency = 'brl'
    }
    const stripeCoupon = await stripe.coupons.create(couponParams)

    // Passo 2: criar o promotion code
    // Na API 2026-04-22.dahlia, 'coupon' fica dentro de 'promotion', não na raiz
    const promoParams: Parameters<typeof stripe.promotionCodes.create>[0] = {
      promotion: { type: 'coupon', coupon: stripeCoupon.id },
      code,
    }
    if (max_redemptions) promoParams.max_redemptions = max_redemptions
    if (redeem_by) promoParams.expires_at = Math.floor(new Date(redeem_by).getTime() / 1000)

    const stripePromoCode = await stripe.promotionCodes.create(promoParams)

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
    console.error('[admin/coupons POST] error:', error instanceof Error ? error.message : String(error))
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
