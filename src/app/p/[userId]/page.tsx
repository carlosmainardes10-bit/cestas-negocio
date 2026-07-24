import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { CatalogGrid } from './CatalogGrid'

interface BasketData {
  name: string
  category: string
  sale_price: number
  sale_price_for_2: number | null
}

interface CatalogRow {
  id: string
  description: string
  images: string[]
  baskets: BasketData | null
}

export default async function PublicCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ ids?: string }>
}) {
  const { userId } = await params
  const { ids } = await searchParams

  const supabase = createAdminClient()

  const idList = ids ? ids.split(',').filter(Boolean) : null

  const { data, error } = idList
    ? await supabase
        .from('catalog_items')
        .select('id, description, images, baskets(name, category, sale_price, sale_price_for_2)')
        .eq('user_id', userId)
        .in('id', idList)
        .order('created_at', { ascending: false })
    : await supabase
        .from('catalog_items')
        .select('id, description, images, baskets(name, category, sale_price, sale_price_for_2)')
        .eq('user_id', userId)
        .eq('visible', true)
        .order('created_at', { ascending: false })

  if (error) return notFound()

  const items = (data ?? []) as unknown as CatalogRow[]

  return (
    <main className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🧺</div>
          <h1 className="text-3xl font-bold text-amber-900">Catálogo de Cestas</h1>
          <p className="text-amber-700 mt-2">Escolha sua cesta favorita e entre em contato para encomendar</p>
        </div>

        <CatalogGrid items={items} />

        <p className="text-center text-xs text-amber-600/50 mt-10">
          Powered by Cestas Negócio
        </p>
      </div>
    </main>
  )
}
