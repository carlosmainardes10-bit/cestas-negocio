'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Heart, Star, Dumbbell, Briefcase, Leaf, Sparkles, RefreshCw, Database, ArrowLeft, BookImage } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Product, BasketCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SuggestedItem {
  name: string
  costPerUnit: number
  unit: string
  quantity: number
  fromDb: boolean
  productId: string | null
}

const CATEGORIES: { key: BasketCategory; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'romantica', label: 'Romântica', icon: Heart, color: 'bg-pink-50 border-pink-200 hover:border-pink-400' },
  { key: 'premium', label: 'Premium', icon: Star, color: 'bg-amber-50 border-amber-200 hover:border-amber-400' },
  { key: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'bg-green-50 border-green-200 hover:border-green-400' },
  { key: 'corporativa', label: 'Corporativa', icon: Briefcase, color: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  { key: 'economica', label: 'Econômica', icon: Leaf, color: 'bg-gray-50 border-gray-200 hover:border-gray-400' },
]

const PRODUCT_CATEGORIES: Record<string, string> = {
  padaria: 'Padaria', laticinios: 'Laticínios', doces: 'Doces',
  bebidas: 'Bebidas', frutas: 'Frutas', salgados: 'Salgados',
  embalagem: 'Embalagem', outros: 'Outros',
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CestasPage() {
  const router = useRouter()

  const [category, setCategory] = useState<BasketCategory | null>(null)
  const [customType, setCustomType] = useState('')
  const [targetPrice, setTargetPrice] = useState(100)
  const [margin, setMargin] = useState(40)
  const [instructions, setInstructions] = useState('')

  const [step, setStep] = useState<'config' | 'loading' | 'result'>('config')
  const [items, setItems] = useState<SuggestedItem[]>([])
  const [basketName, setBasketName] = useState('')
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null)

  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')

  const [concept, setConcept] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [usageLimit] = useState(3)

  useEffect(() => {
    const supabase = createClient()
    const yearMonth = new Date().toISOString().slice(0, 7)

    supabase.from('products').select('*').order('category').order('name')
      .then(({ data }) => { if (data) setDbProducts(data as Product[]) })

    supabase.from('ai_usage').select('basket_count')
      .eq('year_month', yearMonth).maybeSingle()
      .then(({ data }) => setUsageCount(data?.basket_count ?? 0))
  }, [])

  async function handleGenerate() {
    if (!category && !customType.trim()) return
    setStep('loading')

    try {
      const res = await fetch('/api/ia/sugerir-cesta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, customType: customType.trim(), targetPrice, margin, instructions: instructions.trim() }),
      })
      const data = await res.json()
      if (res.status === 429) {
        toast.error(data.error)
        setStep('config')
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      setItems(data.items ?? [])
      setBasketName(data.basketName ?? '')
      setConcept(data.concept ?? '')
      setSaveDescription('')
      if (data.usageCount !== undefined) setUsageCount(data.usageCount)
      setStep('result')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar cesta. Tente novamente.')
      setStep('config')
    }
  }

  async function handleSwapItem(index: number) {
    setSwappingIndex(index)
    try {
      const res = await fetch('/api/ia/mudar-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, customType: customType.trim(), targetPrice, margin, instructions: instructions.trim(), currentItems: items, itemIndex: index }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(prev => prev.map((item, i) => i === index ? data.item : item))
    } catch {
      toast.error('Erro ao trocar item. Tente novamente.')
    }
    setSwappingIndex(null)
  }

  function openPicker(index: number) {
    setPickerTargetIndex(index)
    setPickerSearch('')
    setPickerOpen(true)
  }

  function pickProduct(product: Product) {
    if (pickerTargetIndex === null) return
    setItems(prev => prev.map((item, i) =>
      i === pickerTargetIndex
        ? { name: product.name, costPerUnit: product.cost, unit: product.unit, quantity: item.quantity, fromDb: true, productId: product.id }
        : item
    ))
    setPickerOpen(false)
    setPickerTargetIndex(null)
  }

  async function saveToCatalog() {
    if (!basketName) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .insert({ user_id: user.id, name: basketName, category: category ?? 'premium', sale_price: targetPrice })
      .select('id').single()

    if (basketError || !basket) { toast.error('Erro ao salvar cesta'); setSaving(false); return }

    const dbItems = items.filter(item => item.fromDb && item.productId)
    if (dbItems.length > 0) {
      await supabase.from('basket_items').insert(
        dbItems.map(item => ({ basket_id: basket.id, product_id: item.productId!, quantity: item.quantity }))
      )
    }

    const { error: catalogError } = await supabase
      .from('catalog_items')
      .insert({ user_id: user.id, basket_id: basket.id, description: saveDescription, visible: true })

    if (catalogError) { toast.error('Erro ao salvar no catálogo'); setSaving(false); return }

    toast.success('Cesta salva no catálogo!')
    setSaving(false)
    router.push('/catalogo')
  }

  const totalCost = items.reduce((sum, item) => sum + item.costPerUnit * item.quantity, 0)
  const profit = targetPrice - totalCost
  const actualMargin = targetPrice > 0 ? (profit / targetPrice) * 100 : 0

  const filteredProducts = dbProducts.filter(p =>
    p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    p.brand?.toLowerCase().includes(pickerSearch.toLowerCase())
  )
  const groupedProducts = Object.entries(PRODUCT_CATEGORIES)
    .map(([key, label]) => ({ key, label, items: filteredProducts.filter(p => p.category === key) }))
    .filter(g => g.items.length > 0)

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Sparkles className="h-10 w-10 text-amber-500 animate-pulse" />
        <p className="text-lg font-medium">Montando sua cesta com IA...</p>
        <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
      </div>
    )
  }

  if (step === 'result') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setStep('config')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sua cesta está pronta!</h1>
            <p className="text-sm text-muted-foreground">Troque itens conforme necessário</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1">
              <Label>Nome da cesta</Label>
              <Input
                value={basketName}
                onChange={e => setBasketName(e.target.value)}
                className="text-base font-medium"
              />
            </div>

            {concept && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="font-medium">Conceito: </span>{concept}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Itens sugeridos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.map((item, index) => (
                  <div key={index}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
                          {item.fromDb && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 text-amber-700 border-amber-200">
                              catálogo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-amber-700 shrink-0">
                        {formatCurrency(item.costPerUnit * item.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs shrink-0"
                        disabled={swappingIndex !== null}
                        onClick={() => handleSwapItem(index)}
                        title="Trocar com IA"
                      >
                        {swappingIndex === index
                          ? <RefreshCw className="h-3 w-3 animate-spin" />
                          : <><Sparkles className="h-3 w-3 mr-1" />IA</>
                        }
                      </Button>
                      {dbProducts.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs shrink-0"
                          disabled={swappingIndex !== null}
                          onClick={() => openPicker(index)}
                          title="Substituir do catálogo"
                        >
                          <Database className="h-3 w-3 mr-1" />Base
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className={`border-2 ${actualMargin >= margin ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <CardHeader>
                <CardTitle className="text-base">Resumo financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo dos itens</span>
                  <span className="font-medium">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço de venda</span>
                  <span className="font-medium">{formatCurrency(targetPrice)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Lucro</span>
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(profit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Margem real</span>
                  <Badge variant={actualMargin >= margin ? 'default' : 'destructive'}>
                    {actualMargin.toFixed(1)}%
                  </Badge>
                </div>
                {actualMargin < margin && (
                  <p className="text-xs text-amber-700 mt-1">
                    Abaixo do objetivo ({margin}%). Troque itens mais caros.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookImage className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-base">Salvar no catálogo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Descrição <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                  <Input
                    placeholder="Ex: Perfeita para datas especiais"
                    value={saveDescription}
                    onChange={e => setSaveDescription(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={saveToCatalog}
                  disabled={saving || !basketName}
                >
                  {saving ? 'Salvando...' : 'Salvar no catálogo'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep('config')}>
                  Montar outra cesta
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent showCloseButton>
            <DialogHeader>
              <DialogTitle>Escolher produto do catálogo</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Buscar por nome ou marca..."
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              className="mt-1"
              autoFocus
            />
            <div className="max-h-80 overflow-y-auto space-y-3 mt-2">
              {groupedProducts.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado.</p>
                : groupedProducts.map(group => (
                  <div key={group.key}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => pickProduct(product)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-amber-50 text-left transition-colors"
                        >
                          <div>
                            <span className="text-sm font-medium">{product.name}</span>
                            {product.brand && (
                              <span className="text-xs text-muted-foreground ml-2">{product.brand}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-amber-700 shrink-0">
                            {formatCurrency(product.cost)}/{product.unit}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Montador com IA</h1>
        <p className="text-muted-foreground">A IA monta sua cesta usando os produtos do seu catálogo</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">Tipo de cesta</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setCategory(key); setCustomType('') }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-left ${color} ${
                  category === key && !customType ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                }`}
              >
                <Icon className="h-4 w-4 text-amber-700 shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            <Label className="text-xs text-muted-foreground">Ou descreva um tipo personalizado</Label>
            <Input
              placeholder="Ex: Dia das Mães, Tropical, Páscoa Infantil, Junina..."
              value={customType}
              onChange={e => { setCustomType(e.target.value); if (e.target.value) setCategory(null) }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Preço de venda (R$)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              value={targetPrice}
              onChange={e => setTargetPrice(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label>Margem desejada (%)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              max="90"
              value={margin}
              onChange={e => setMargin(Number(e.target.value) || 40)}
            />
            <p className="text-xs text-muted-foreground">
              Custo máx: {formatCurrency(targetPrice * (1 - margin / 100))}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label>Instruções para a IA <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <span className="text-xs text-muted-foreground">{instructions.length}/300</span>
          </div>
          <textarea
            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            placeholder="Ex: incluir plástico de embalagem, sem itens com glúten, adicionar vela decorativa..."
            maxLength={300}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            disabled={(!category && !customType.trim()) || targetPrice <= 0 || usageCount === usageLimit}
            onClick={handleGenerate}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Montar com IA
          </Button>
          {usageCount !== null && (
            <p className={`text-xs text-center ${usageCount >= usageLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
              {usageCount >= usageLimit
                ? `Limite de ${usageLimit} cestas/mês atingido. Renova no dia 1°.`
                : `${usageCount} de ${usageLimit} cestas geradas este mês`}
            </p>
          )}
        </div>

        {dbProducts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Sem produtos cadastrados — a IA vai sugerir produtos genéricos.{' '}
            <button
              type="button"
              className="text-amber-700 underline"
              onClick={() => router.push('/produtos')}
            >
              Cadastrar produtos
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
