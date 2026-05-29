import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { BookImage } from 'lucide-react'

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

const CATEGORY_LABELS: Record<string, string> = {
  romantica: 'Romântica',
  premium: 'Premium',
  fitness: 'Fitness',
  corporativa: 'Corporativa',
  economica: 'Econômica',
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

        {items.length === 0 ? (
          <div className="text-center py-20 text-amber-700">
            <BookImage className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nenhuma cesta disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const basket = item.baskets
              if (!basket) return null
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100"
                >
                  <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
                    {item.images?.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={basket.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookImage className="h-14 w-14 text-amber-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-bold text-gray-800">{basket.name}</h2>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                        {CATEGORY_LABELS[basket.category] ?? basket.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                    )}
                    {basket.sale_price_for_2 ? (
                      <div>
                        <p className="text-sm text-gray-500">1 pessoa</p>
                        <p className="text-xl font-bold text-amber-700">{formatCurrency(basket.sale_price)}</p>
                        <p className="text-sm text-gray-500 mt-1">2 pessoas</p>
                        <p className="text-xl font-bold text-amber-700">{formatCurrency(basket.sale_price_for_2)}</p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-amber-700">
                        {formatCurrency(basket.sale_price)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-amber-600/50 mt-10">
          Powered by Cestas Negócio
        </p>
      </div>
    </main>
  )
}
