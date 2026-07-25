'use client'

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

export function CatalogGrid({ items }: { items: CatalogRow[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-amber-700">
        <BookImage className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">Nenhuma cesta disponível no momento.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const basket = item.baskets
        if (!basket) return null
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100 cursor-pointer relative"
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
  )
}
