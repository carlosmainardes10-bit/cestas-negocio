import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { basket_id, items } = await req.json()
  if (!basket_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Verify the basket belongs to this user
  const admin = createAdminClient()
  const { data: basket } = await admin
    .from('baskets')
    .select('user_id')
    .eq('id', basket_id)
    .single()

  if (!basket || basket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin.from('basket_items').insert(
    items.map((item: { product_id: string; quantity: number }) => ({
      basket_id,
      product_id: item.product_id,
      quantity: item.quantity,
    }))
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
