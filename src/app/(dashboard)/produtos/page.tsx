'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Package, Info } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

const PRODUCT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'padaria', label: 'Padaria' },
  { value: 'laticinios', label: 'Laticínios' },
  { value: 'doces', label: 'Doces' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'frutas', label: 'Frutas' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'embalagem', label: 'Embalagem' },
  { value: 'outros', label: 'Outros' },
]

const UNITS: { value: string; label: string }[] = [
  { value: 'un', label: 'Unidade' },
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'Grama' },
  { value: 'L', label: 'Litro' },
  { value: 'ml', label: 'ml' },
]

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  cost: z.number().min(0, 'Custo inválido'),
  unit: z.string().min(1),
  category: z.string().min(1, 'Categoria obrigatória'),
  brand: z.string().optional(),
  store: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function categoryLabel(value: string) {
  return PRODUCT_CATEGORIES.find(c => c.value === value)?.label ?? value
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('un')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', cost: 0, unit: 'un', category: '', brand: '', store: '' },
  })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name')
    if (data) setProducts(data as Product[])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setCategory('')
    setUnit('un')
    reset({ name: '', cost: 0, unit: 'un', category: '', brand: '', store: '' })
    setSheetOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setCategory(product.category)
    setUnit(product.unit)
    reset({
      name: product.name,
      cost: product.cost,
      unit: product.unit,
      category: product.category,
      brand: product.brand ?? '',
      store: product.store ?? '',
    })
    setValue('category', product.category)
    setValue('unit', product.unit)
    setSheetOpen(true)
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      name: data.name,
      cost: data.cost,
      unit: unit,
      category: category,
      brand: data.brand || null,
      store: data.store || null,
    }

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { toast.error('Erro ao atualizar produto'); setSaving(false); return }
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...payload } : p))
      toast.success('Produto atualizado')
    } else {
      const { data: inserted, error } = await supabase
        .from('products')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
      if (error || !inserted) { toast.error('Erro ao salvar produto'); setSaving(false); return }
      setProducts(prev => [...prev, inserted as Product].sort((a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      ))
      toast.success('Produto cadastrado')
    }

    setSaving(false)
    setSheetOpen(false)
  }

  async function deleteProduct(id: string) {
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao apagar produto')
    } else {
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success('Produto apagado')
    }
    setDeleting(null)
  }

  const grouped = PRODUCT_CATEGORIES.map(cat => ({
    ...cat,
    items: products.filter(p => p.category === cat.value),
  })).filter(g => g.items.length > 0)

  const uncategorized = products.filter(
    p => !PRODUCT_CATEGORIES.find(c => c.value === p.category)
  )

  if (loading) return <p className="text-muted-foreground text-sm p-8">Carregando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Cadastre os ingredientes e itens das suas cestas</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <div className="flex gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
          <div className="space-y-1">
            <p className="font-medium">Dica: cadastre tudo que compõe sua cesta</p>
            <p className="text-blue-700">
              Quanto mais completo seu catálogo, melhor a IA monta suas cestas. Inclua todos os comestíveis
              (pão, queijo, frios, frutas, doces, bebidas…) <strong>e também os extras</strong> como flores,
              canecas, vinho, cerveja, ursinhos de pelúcia, velas, tags decorativas e o próprio plástico ou
              cesta de palha. A IA usa esses itens para montar cestas mais realistas e com custo preciso.
            </p>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum produto cadastrado ainda.</p>
          <p className="text-sm mt-1">Cadastre seus ingredientes para o montador de cestas usar.</p>
          <Button className="mt-4" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar primeiro produto
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {[...grouped, ...(uncategorized.length > 0 ? [{ value: 'outros', label: 'Outros', items: uncategorized }] : [])].map((group) => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </span>
                <Badge variant="outline" className="text-xs">{group.items.length}</Badge>
              </div>
              <div className="border rounded-lg divide-y">
                {group.items.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{product.name}</span>
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">{product.brand}</span>
                        )}
                      </div>
                      {product.store && (
                        <p className="text-xs text-muted-foreground mt-0.5">{product.store}</p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-amber-700 whitespace-nowrap">
                      {formatCurrency(product.cost)}<span className="text-xs text-muted-foreground font-normal">/{product.unit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" />
                        }>
                          <Trash2 className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent showCloseButton={false}>
                          <DialogHeader>
                            <DialogTitle>Apagar produto</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja apagar <strong>{product.name}</strong>?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                            <DialogClose render={
                              <Button
                                variant="destructive"
                                disabled={deleting === product.id}
                                onClick={() => deleteProduct(product.id)}
                              />
                            }>
                              {deleting === product.id ? 'Apagando...' : 'Apagar'}
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar produto' : 'Novo produto'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Pão de queijo" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Custo (R$) *</Label>
                <Input type="number" step="0.01" placeholder="0,00" {...register('cost', { valueAsNumber: true })} />
                {errors.cost && <p className="text-sm text-red-500">{errors.cost.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Unidade *</Label>
                <Select value={unit} onValueChange={(v) => { if (v) { setUnit(v); setValue('unit', v) } }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={(v) => { if (v) { setCategory(v); setValue('category', v) } }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && !category && <p className="text-sm text-red-500">Categoria obrigatória</p>}
            </div>

            <Separator />

            <div className="space-y-1">
              <Label>Marca <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input placeholder="Ex: Forno de Minas" {...register('brand')} />
            </div>

            <div className="space-y-1">
              <Label>Local de compra <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input placeholder="Ex: Atacadão, Mercado Central" {...register('store')} />
            </div>

            <SheetFooter className="pt-2">
              <SheetClose render={<Button type="button" variant="outline" />}>Cancelar</SheetClose>
              <Button type="submit" disabled={saving || !category}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar produto'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
