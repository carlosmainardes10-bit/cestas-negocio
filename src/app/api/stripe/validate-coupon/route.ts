import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

  try {
    const promoCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase().trim(),
      active: true,
      limit: 1,
    })

    if (promoCodes.data.length === 0) {
      return NextResponse.json({ valid: false, error: 'Cupom inválido ou expirado' })
    }

    const promoCode = promoCodes.data[0]
    const couponId = typeof (promoCode as any).coupon === 'string'
      ? (promoCode as any).coupon
      : (promoCode as any).coupon?.id
    const stripeCoupon = await stripe.coupons.retrieve(couponId)

    const discountType = stripeCoupon.percent_off != null ? 'percent' : 'fixed'
    const discountValue = stripeCoupon.percent_off ?? (stripeCoupon.amount_off ? stripeCoupon.amount_off / 100 : 0)

    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: couponRow } = await (supabase as any)
      .from('coupons')
      .select('applicable_plans')
      .eq('stripe_promotion_code_id', promoCode.id)
      .maybeSingle()

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      promotion_code_id: promoCode.id,
      discount_type: discountType,
      discount_value: discountValue,
      applicable_plans: couponRow?.applicable_plans ?? ['basic', 'premium'],
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
