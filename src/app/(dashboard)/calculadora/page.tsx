'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp, BookImage, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type BasketCategory = 'romantica' | 'premium' | 'fitness' | 'corporativa' | 'economica'

const CATEGORY_LABELS: Record<BasketCategory, string> = {
  romantica: 'Romântica',
  premium: 'Premium',
  fitness: 'Fitness',
  corporativa: 'Corporativa',
  economica: 'Econômica',
}

const PRODUCT_CATEGORIES: Record<string, string> = {
  padaria: 'Padaria', laticinios: 'Laticínios', doces: 'Doces',
  bebidas: 'Bebidas', frutas: 'Frutas', salgados: 'Salgados',
  charcutaria: 'Charcutaria', bebidas_alcoolicas: 'Bebidas Alcoólicas', mercearia: 'Mercearia',
  embalagem: 'Embalagem', outros: 'Outros',
}

const CATEGORY_EMOJI: Record<string, string> = {
  padaria: '🍞', laticinios: '🥛', doces: '🍫', bebidas: '☕', frutas: '🍎',
  salgados: '🫓', charcutaria: '🥩', bebidas_alcoolicas: '🍷', mercearia: '🛒',
  embalagem: '📦', outros: '✨',
}

interface BasketEntry {
  product: Product
  quantity: number
}

const schema = z.object({
  basketName: z.string().min(1, 'Nome da cesta obrigatório'),
  salePrice: z.number().min(0.01, 'Preço de venda obrigatório'),
  laborCost: z.number().min(0).catch(0),
  packagingCost: z.number().min(0).catch(0),
  marketingCost: z.number().min(0).catch(0),
})

type FormData = z.infer<typeof schema>

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CalculadoraPage() {
  const router = useRouter()
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [basketItems, setBasketItems] = useState<BasketEntry[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isFor2, setIsFor2] = useState(false)
  const [result, setResult] = useState<{
    totalCost: number; profit: number; margin: number
    suggestedPrice: number; basketName: string; salePrice: number
    items: BasketEntry[]
    totalCostFor2: number; suggestedPriceFor2: number
  } | null>(null)
  const [category, setCategory] = useState<BasketCategory | null>(null)
  const [description, setDescription] = useState('')
  const [priceFor2, setPriceFor2] = useState('')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { basketName: '', salePrice: 0, laborCost: 0, packagingCost: 0, marketingCost: 0 },
  })

  useEffect(() => {
    createClient()
      .from('products')
      .select('*')
      .order('category').order('name')
      .then(({ data }) => { if (data) setDbProducts(data as Product[]) })
  }, [])

  function addProduct(product: Product) {
    setBasketItems(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id)
      if (idx >= 0) {
        return prev.map((item, n) => n === idx ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeProduct(index: number) {
    setBasketItems(prev => {
      if (prev[index].quantity > 1) {
        return prev.map((item, i) => i === index ? { ...item, quantity: item.quantity - 1 } : item)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  function onSubmit(data: FormData) {
    if (basketItems.length === 0) {
      toast.error('Adicione ao menos um produto à cesta')
      return
    }
    const productsCost = basketItems.reduce((sum, item) => sum + item.product.cost * item.quantity, 0)
    const totalCost = productsCost + data.laborCost + data.packagingCost + data.marketingCost
    const totalCostFor2 = productsCost * 2 + data.laborCost + data.packagingCost + data.marketingCost
    const profit = data.salePrice - totalCost
    const margin = data.salePrice > 0 ? (profit / data.salePrice) * 100 : 0
    const suggestedPrice = totalCost / 0.6
    const suggestedPriceFor2 = totalCostFor2 / 0.6
    setResult({
      totalCost, profit, margin, suggestedPrice,
      basketName: data.basketName, salePrice: data.salePrice, items: basketItems,
      totalCostFor2, suggestedPriceFor2,
    })
    setCategory(null)
    setDescription('')
    setPriceFor2('')
  }

  async function saveToCatalog() {
    if (!result || !category) return
    if (result.items.length === 0) {
      toast.error('Adicione pelo menos 1 produto antes de salvar a cesta.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .insert({ user_id: user.id, name: result.basketName, category, sale_price: result.salePrice })
      .select('id').single()

    if (basketError || !basket) { toast.error('Erro ao salvar cesta'); setSaving(false); return }

    const itemsRes = await fetch('/api/baskets/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        basket_id: basket.id,
        items: result.items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      }),
    })
    if (!itemsRes.ok) console.error('basket_items save error:', await itemsRes.text())

    const parsedPriceFor2 = priceFor2 ? parseFloat(priceFor2) : null
    if (parsedPriceFor2 && parsedPriceFor2 > 0) {
      await supabase.from('baskets').update({ sale_price_for_2: parsedPriceFor2 }).eq('id', basket.id)
    }

    const { error: catalogError } = await supabase
      .from('catalog_items')
      .insert({ user_id: user.id, basket_id: basket.id, description, visible: true })

    if (catalogError) { toast.error('Erro ao adicionar ao catálogo'); setSaving(false); return }

    toast.success('Cesta cadastrada no catálogo!')
    setSaving(false)
    router.push('/catalogo')
  }

  const groupedProducts = Object.entries(PRODUCT_CATEGORIES)
    .map(([key, label]) => ({ key, label, items: dbProducts.filter(p => p.category === key) }))
    .filter(g => g.items.length > 0)

  const productsCost = basketItems.reduce((sum, item) => sum + item.product.cost * item.quantity, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calculadora de Lucro</h1>
        <p className="text-muted-foreground">Saiba exatamente quanto você lucra em cada cesta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Dados da Cesta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Nome da cesta</Label>
              <Input placeholder="Ex: Cesta Romântica" {...register('basketName')} />
              {errors.basketName && <p className="text-sm text-red-500">{errors.basketName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Preço de venda (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" {...register('salePrice', { valueAsNumber: true })} />
              {errors.salePrice && <p className="text-sm text-red-500">{errors.salePrice.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Products + Basket */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Product catalog */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produtos disponíveis</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Arraste ou clique para adicionar à cesta</p>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {dbProducts.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Nenhum produto cadastrado ainda.</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => router.push('/produtos')}>
                    Cadastrar produtos
                  </Button>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto space-y-4 pr-1">
                  {groupedProducts.map(group => (
                    <div key={group.key}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        <span>{CATEGORY_EMOJI[group.key] ?? '•'}</span>
                        {group.label}
                      </p>
                      <div className="space-y-1">
                        {group.items.map(product => (
                          <div
                            key={product.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('productId', product.id)
                              e.dataTransfer.effectAllowed = 'copy'
                            }}
                            onClick={() => addProduct(product)}
                            className="flex items-center justify-between px-3 py-2 rounded-lg border border-transparent hover:border-amber-300 hover:bg-amber-50 cursor-grab active:cursor-grabbing select-none transition-colors"
                          >
                            <span className="text-sm">{product.name}</span>
                            <span className="text-xs text-amber-700 shrink-0 ml-2">
                              {formatCurrency(product.cost)}/{product.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT: Basket drop zone */}
          <Card>
            <CardHeader><CardTitle className="text-base">Sua cesta</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 flex flex-col gap-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  const productId = e.dataTransfer.getData('productId')
                  const product = dbProducts.find(p => p.id === productId)
                  if (product) addProduct(product)
                }}
                className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-4 transition-all min-h-[150px] ${
                  isDragOver
                    ? 'border-amber-500 bg-amber-50 scale-[1.01]'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <svg
                  viewBox="0 0 120 100"
                  className={`w-24 h-20 transition-transform duration-150 ${isDragOver ? 'scale-110' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M42,42 Q60,18 78,42" fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M22,50 L28,84 L92,84 L98,50 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="2"/>
                  <line x1="23" y1="60" x2="97" y2="60" stroke="#d97706" strokeWidth="1.5" opacity="0.6"/>
                  <line x1="24" y1="70" x2="96" y2="70" stroke="#d97706" strokeWidth="1.5" opacity="0.6"/>
                  <line x1="25" y1="80" x2="95" y2="80" stroke="#d97706" strokeWidth="1.5" opacity="0.6"/>
                  <line x1="38" y1="50" x2="32" y2="84" stroke="#d97706" strokeWidth="1" opacity="0.4"/>
                  <line x1="53" y1="50" x2="52" y2="84" stroke="#d97706" strokeWidth="1" opacity="0.4"/>
                  <line x1="67" y1="50" x2="68" y2="84" stroke="#d97706" strokeWidth="1" opacity="0.4"/>
                  <line x1="82" y1="50" x2="88" y2="84" stroke="#d97706" strokeWidth="1" opacity="0.4"/>
                </svg>
                <p className="text-sm text-muted-foreground mt-1">
                  {isDragOver ? '🎯 Solte aqui!' : basketItems.length === 0 ? 'Arraste produtos aqui' : 'Arraste mais produtos'}
                </p>
              </div>

              {basketItems.length > 0 && (
                <div className="space-y-1">
                  {basketItems.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                      <span className="text-sm flex-1 truncate">{entry.product.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">×{entry.quantity}</span>
                      <span className="text-sm font-medium text-amber-700 shrink-0">
                        {formatCurrency(entry.product.cost * entry.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProduct(i)}
                        className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remover uma unidade"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1.5 border-t border-amber-200 px-1">
                    <span className="text-sm text-muted-foreground">Subtotal produtos</span>
                    <span className="text-sm font-semibold">{formatCurrency(productsCost)}</span>
                  </div>
                </div>
              )}

              {/* Toggle: cesta para 2 pessoas */}
              <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${
                isFor2 ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300'
              }`}>
                <input
                  type="checkbox"
                  checked={isFor2}
                  onChange={(e) => setIsFor2(e.target.checked)}
                  className="h-4 w-4 accent-amber-600"
                />
                <div>
                  <span className="text-sm font-medium">Cesta para 2 pessoas</span>
                  {isFor2 && basketItems.length > 0 && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      Custo dobrado: {formatCurrency(productsCost * 2)}
                    </p>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Outros Custos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Mão de obra (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" {...register('laborCost', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>Embalagem / frete (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" {...register('packagingCost', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>Marketing (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" {...register('marketingCost', { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          <TrendingUp className="h-4 w-4 mr-2" /> Calcular Lucro
        </Button>
      </form>

      {result && (
        <div className="space-y-4 mt-6">
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardHeader><CardTitle className="text-base">Resultado</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo total</span>
                <span className="font-medium">{formatCurrency(result.totalCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Lucro líquido</span>
                <span className={result.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(result.profit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Margem de lucro</span>
                <Badge variant={result.margin >= 40 ? 'default' : 'destructive'}>
                  {result.margin.toFixed(1)}%
                </Badge>
              </div>
              {result.margin < 40 ? (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Margem abaixo de 40%</p>
                  <p className="text-sm text-red-600 mt-1">
                    Preço sugerido: <strong>{formatCurrency(result.suggestedPrice)}</strong>
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Boa margem de lucro!</p>
                  <p className="text-sm text-green-600">Você está precificando bem essa cesta.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isFor2 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader><CardTitle className="text-base">Para 2 pessoas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo total</span>
                  <span className="font-medium">{formatCurrency(result.totalCostFor2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço sugerido (40% margem)</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(result.suggestedPriceFor2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookImage className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base">Cadastrar no catálogo?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select onValueChange={(val) => val && setCategory(val as BasketCategory)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as BasketCategory[]).map((key) => (
                      <SelectItem key={key} value={key}>{CATEGORY_LABELS[key]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                  placeholder="Ex: Perfeita para datas especiais"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {isFor2 && (
                <div className="space-y-1">
                  <Label>Preço para 2 pessoas (R$) <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`Sugerido: ${formatCurrency(result.suggestedPriceFor2)}`}
                    value={priceFor2}
                    onChange={(e) => setPriceFor2(e.target.value)}
                  />
                </div>
              )}
              <Button className="w-full" onClick={saveToCatalog} disabled={!category || saving}>
                {saving ? 'Salvando...' : 'Salvar no catálogo'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
