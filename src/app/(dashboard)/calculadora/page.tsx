'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, TrendingUp, BookImage, Database } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  embalagem: 'Embalagem', outros: 'Outros',
}

const itemSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  cost: z.number().min(0, 'Custo inválido'),
})

const schema = z.object({
  basketName: z.string().min(1, 'Nome da cesta obrigatório'),
  salePrice: z.number().min(0.01, 'Preço de venda obrigatório'),
  laborCost: z.number().min(0),
  packagingCost: z.number().min(0),
  marketingCost: z.number().min(0),
  items: z.array(itemSchema).min(1, 'Adicione ao menos um produto'),
})

type FormData = z.infer<typeof schema>

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CalculadoraPage() {
  const router = useRouter()
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<{
    totalCost: number; profit: number; margin: number
    suggestedPrice: number; basketName: string; salePrice: number
  } | null>(null)
  const [category, setCategory] = useState<BasketCategory | null>(null)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, control, setValue: setFormValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      basketName: '', salePrice: 0, laborCost: 0, packagingCost: 0, marketingCost: 0,
      items: [{ name: '', cost: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    createClient()
      .from('products')
      .select('*')
      .order('category').order('name')
      .then(({ data }) => { if (data) setDbProducts(data as Product[]) })
  }, [])

  function pickProduct(product: Product) {
    append({ name: product.name, cost: product.cost })
    setPickerOpen(false)
    setSearch('')
  }

  function onSubmit(data: FormData) {
    const productsCost = data.items.reduce((sum, item) => sum + item.cost, 0)
    const totalCost = productsCost + data.laborCost + data.packagingCost + data.marketingCost
    const profit = data.salePrice - totalCost
    const margin = data.salePrice > 0 ? (profit / data.salePrice) * 100 : 0
    const suggestedPrice = totalCost / 0.6
    setResult({ totalCost, profit, margin, suggestedPrice, basketName: data.basketName, salePrice: data.salePrice })
    setCategory(null)
    setDescription('')
  }

  async function saveToCatalog() {
    if (!result || !category) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .insert({ user_id: user.id, name: result.basketName, category, sale_price: result.salePrice })
      .select('id').single()

    if (basketError || !basket) { toast.error('Erro ao salvar cesta'); setSaving(false); return }

    const { error: catalogError } = await supabase
      .from('catalog_items')
      .insert({ user_id: user.id, basket_id: basket.id, description, visible: true })

    if (catalogError) { toast.error('Erro ao adicionar ao catálogo'); setSaving(false); return }

    toast.success('Cesta cadastrada no catálogo!')
    setSaving(false)
    router.push('/catalogo')
  }

  const filteredProducts = dbProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.store?.toLowerCase().includes(search.toLowerCase())
  )

  const groupedFiltered = Object.entries(PRODUCT_CATEGORIES)
    .map(([key, label]) => ({ key, label, items: filteredProducts.filter(p => p.category === key) }))
    .filter(g => g.items.length > 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calculadora de Lucro</h1>
        <p className="text-muted-foreground">Saiba exatamente quanto você lucra em cada cesta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Produtos</CardTitle>
                <div className="flex gap-2">
                  {dbProducts.length > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                      <Database className="h-3.5 w-3.5 mr-1" /> Da base
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', cost: 0 })}>
                    <Plus className="h-4 w-4 mr-1" /> Manual
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input placeholder="Produto" {...register(`items.${index}.name`)} />
                  </div>
                  <div className="w-28">
                    <Input type="number" step="0.01" placeholder="R$ 0,00" {...register(`items.${index}.cost`, { valueAsNumber: true })} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
              {errors.items && <p className="text-sm text-red-500">{errors.items.message}</p>}
            </CardContent>
          </Card>

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
          <div className="space-y-4">
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
                <Button className="w-full" onClick={saveToCatalog} disabled={!category || saving}>
                  {saving ? 'Salvando...' : 'Salvar no catálogo'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Seletor de produto da base */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Buscar produto da base</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Buscar por nome, marca ou loja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
            autoFocus
          />
          <div className="max-h-80 overflow-y-auto space-y-3 mt-2">
            {groupedFiltered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado.</p>
            ) : (
              groupedFiltered.map(group => (
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
