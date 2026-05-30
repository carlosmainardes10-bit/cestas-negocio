import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ basketId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { basketId } = await params
  const admin = createAdminClient()

  const { data: basket } = await admin
    .from('baskets')
    .select('id, name, category, sale_price, sale_price_for_2, user_id')
    .eq('id', basketId)
    .single()

  if (!basket || basket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: catalogItem } = await admin
    .from('catalog_items')
    .select('id, description')
    .eq('basket_id', basketId)
    .maybeSingle()

  const { data: items } = await admin
    .from('basket_items')
    .select('quantity, product_id, products(name, cost, unit, category)')
    .eq('basket_id', basketId)

  type ItemRow = {
    quantity: number
    product_id: string
    products: { name: string; cost: number; unit: string; category: string } | null
  }
  const rows = (items ?? []) as ItemRow[]

  return NextResponse.json({
    id: basket.id,
    name: basket.name,
    category: basket.category,
    sale_price: basket.sale_price,
    sale_price_for_2: (basket as { sale_price_for_2?: number | null }).sale_price_for_2 ?? null,
    description: catalogItem?.description ?? '',
    catalog_item_id: catalogItem?.id ?? null,
    items: rows
      .filter(r => r.products)
      .map(r => ({
        product_id: r.product_id,
        quantity: Number(r.quantity),
        name: (r.products as { name: string; cost: number; unit: string; category: string }).name,
        cost: Number((r.products as { name: string; cost: number; unit: string; category: string }).cost),
        unit: (r.products as { name: string; cost: number; unit: string; category: string }).unit,
        product_category: (r.products as { name: string; cost: number; unit: string; category: string }).category,
      })),
  })
}
