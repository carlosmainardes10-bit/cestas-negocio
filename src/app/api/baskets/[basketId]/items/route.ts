import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ basketId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { basketId } = await params
  const admin = createAdminClient()

  // Verify ownership
  const { data: basket } = await admin
    .from('baskets')
    .select('user_id')
    .eq('id', basketId)
    .single()

  if (!basket || basket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: items, error } = await admin
    .from('basket_items')
    .select('quantity, products(name)')
    .eq('basket_id', basketId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type ItemRow = { quantity: number; products: { name: string } | null }
  const rows = (items ?? []) as ItemRow[]

  return NextResponse.json({
    items: rows
      .filter(r => r.products)
      .map(r => ({ quantity: r.quantity, name: (r.products as { name: string }).name })),
  })
}
