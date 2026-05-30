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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { active } = await req.json()

  const supabase = createAdminClient()
  const { data, error: fetchError } = await supabase
    .from('coupons')
    .select('stripe_promotion_code_id')
    .eq('id', id)
    .single()

  if (fetchError || !data) return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })

  const coupon = data as { stripe_promotion_code_id: string }

  try {
    await stripe.promotionCodes.update(coupon.stripe_promotion_code_id, { active })
    await (supabase.from('coupons') as any).update({ active }).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error: fetchError } = await supabase
    .from('coupons')
    .select('stripe_promotion_code_id')
    .eq('id', id)
    .single()

  if (fetchError || !data) return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })

  const coupon = data as { stripe_promotion_code_id: string }

  try {
    await stripe.promotionCodes.update(coupon.stripe_promotion_code_id, { active: false })
    await (supabase.from('coupons') as any).delete().eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
