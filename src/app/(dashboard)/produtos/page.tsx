'use client'

import { useState, useEffect, useMemo } from 'react'
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
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

const PRODUCT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'padaria', label: 'Padaria' },
  { value: 'laticinios', label: 'Laticínios' },
  { value: 'doces', label: 'Doces' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'frutas', label: 'Frutas' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'charcutaria', label: 'Charcutaria' },
  { value: 'bebidas_alcoolicas', label: 'Bebidas Alcoólicas' },
  { value: 'mercearia', label: 'Mercearia' },
  { value: 'embalagem', label: 'Embalagem' },
]

const CATEGORY_EMOJI: Record<string, string> = {
  padaria: '🍞', laticinios: '🥛', doces: '🍫', bebidas: '☕', frutas: '🍎',
  salgados: '🫓', charcutaria: '🥩', bebidas_alcoolicas: '🍷', mercearia: '🛒',
  embalagem: '📦', outros: '✨',
}

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

function toSlug(str: string) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
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
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [trashDropOver, setTrashDropOver] = useState(false)
  const [pendingTrashProduct, setPendingTrashProduct] = useState<Product | null>(null)

  const [userCategories, setUserCategories] = useState<{ value: string; label: string }[]>([])
  const [newCatMode, setNewCatMode] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')
  const [newCatError, setNewCatError] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', cost: 0, unit: 'un', category: '', brand: '', store: '' },
  })

  useEffect(() => {
    loadProducts()
    loadUserCategories()
  }, [])

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

  async function loadUserCategories() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('product_categories')
      .select('name, slug')
      .eq('user_id', user.id)
      .order('name')
    if (data) {
      setUserCategories(data.map(c => ({ value: c.slug, label: c.name })))
    }
  }

  async function handleNewCategory() {
    const name = newCatInput.trim()
    if (!name) return
    const slug = toSlug(name)

    const allSlugs = new Set([
      ...PRODUCT_CATEGORIES.map(c => c.value),
      ...userCategories.map(c => c.value),
    ])
    if (allSlugs.has(slug)) {
      setNewCatError('Essa categoria já existe')
      return
    }

    setSavingCat(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingCat(false); return }

    const { error } = await supabase
      .from('product_categories')
      .insert({ user_id: user.id, name, slug })

    if (error) {
      setNewCatError('Erro ao salvar categoria')
      setSavingCat(false)
      return
    }

    const newCat = { value: slug, label: name }
    setUserCategories(prev => [...prev, newCat].sort((a, b) => a.label.localeCompare(b.label)))
    setCategory(slug)
    setValue('category', slug)
    setNewCatInput('')
    setNewCatError('')
    setNewCatMode(false)
    setSavingCat(false)
  }

  function resetNewCatMode() {
    setNewCatMode(false)
    setNewCatInput('')
    setNewCatError('')
  }

  // Categorias do dropdown: estáticas + criadas pelo usuário + backward compat ao editar
  const dropdownCategories = useMemo(() => {
    const base = [...PRODUCT_CATEGORIES, ...userCategories]
    if (editing && !base.find(c => c.value === editing.category)) {
      base.push({ value: editing.category, label: editing.category })
    }
    return base
  }, [userCategories, editing])

  // Categorias para agrupamento da lista (inclui 'outros' para dados existentes)
  const allDisplayCategories = useMemo(() => [
    ...PRODUCT_CATEGORIES,
    { value: 'outros', label: 'Outros' },
    ...userCategories,
  ], [userCategories])

  function openAdd() {
    setEditing(null)
    setCategory('')
    setUnit('un')
    reset({ name: '', cost: 0, unit: 'un', category: '', brand: '', store: '' })
    resetNewCatMode()
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
    resetNewCatMode()
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
    setPendingTrashProduct(null)
  }

  async function moveProductToCategory(productId: string, newCategory: string) {
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ category: newCategory }).eq('id', productId)
    if (error) {
      toast.error('Erro ao mover produto')
    } else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, category: newCategory } : p))
    }
  }

  const grouped = allDisplayCategories.map(cat => ({
    ...cat,
    items: products.filter(p => p.category === cat.value),
  })).filter(g => g.items.length > 0)

  const uncategorized = products.filter(
    p => !allDisplayCategories.find(c => c.value === p.category)
  )

  if (loading) return <p className="text-muted-foreground text-sm p-8">Carregando...</p>

  const allGroups = [
    ...grouped,
    ...(uncategorized.length > 0 ? [{ value: '__other', label: 'Sem categoria', items: uncategorized }] : []),
  ]

  return (
    <div className="pb-28">
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
          {allGroups.map((group) => (
            <div
              key={group.value}
              onDragOver={(e) => { e.preventDefault(); setDragOverCategory(group.value) }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCategory(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverCategory(null)
                const productId = e.dataTransfer.getData('productId')
                if (productId && group.value !== '__other') moveProductToCategory(productId, group.value)
              }}
              className={`rounded-xl border-2 p-3 transition-colors ${
                dragOverCategory === group.value
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{CATEGORY_EMOJI[group.value] ?? '•'}</span>
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </span>
                <Badge variant="outline" className="text-xs">{group.items.length}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {group.items.map((product) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('productId', product.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => { setDragOverCategory(null); setTrashDropOver(false) }}
                    onClick={() => openEdit(product)}
                    className="relative group bg-white border border-gray-200 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-amber-300 hover:shadow-sm transition-all select-none"
                  >
                    <div className="text-sm font-semibold text-gray-800 truncate">{product.name}</div>
                    {product.brand && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{product.brand}</div>
                    )}
                    <div className="text-xs text-amber-700 font-medium mt-1.5">
                      {formatCurrency(product.cost)}
                      <span className="text-muted-foreground font-normal">/{product.unit}</span>
                    </div>
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Trash bin (fixed at bottom) ───────────────────────────────────────── */}
      {products.length > 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setTrashDropOver(true) }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setTrashDropOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setTrashDropOver(false)
            const productId = e.dataTransfer.getData('productId')
            const product = products.find(p => p.id === productId)
            if (product) setPendingTrashProduct(product)
          }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-3 rounded-2xl border-2 shadow-lg transition-all ${
            trashDropOver
              ? 'border-red-500 bg-red-100 scale-110'
              : 'border-gray-300 bg-white/90 backdrop-blur-sm'
          }`}
        >
          <Trash2 className={`h-5 w-5 transition-colors ${trashDropOver ? 'text-red-600' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium transition-colors ${trashDropOver ? 'text-red-700' : 'text-gray-500'}`}>
            {trashDropOver ? 'Solte para excluir' : 'Arraste aqui para excluir'}
          </span>
        </div>
      )}

      {/* ── Trash confirmation dialog ─────────────────────────────────────────── */}
      <Dialog open={!!pendingTrashProduct} onOpenChange={(open) => !open && setPendingTrashProduct(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Apagar produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja apagar <strong>{pendingTrashProduct?.name}</strong>? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <DialogClose render={
              <Button
                variant="destructive"
                disabled={!!deleting}
                onClick={() => pendingTrashProduct && deleteProduct(pendingTrashProduct.id)}
              />
            }>
              {deleting ? 'Apagando...' : 'Apagar'}
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit / Add sheet ──────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetNewCatMode() }}>
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
              {newCatMode ? (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da nova categoria"
                      value={newCatInput}
                      onChange={(e) => { setNewCatInput(e.target.value); setNewCatError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNewCategory() } }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNewCategory}
                      disabled={savingCat || !newCatInput.trim()}
                    >
                      {savingCat ? '...' : 'OK'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={resetNewCatMode}
                    >
                      Cancelar
                    </Button>
                  </div>
                  {newCatError && <p className="text-sm text-destructive">{newCatError}</p>}
                </div>
              ) : (
                <Select
                  value={category}
                  onValueChange={(v) => {
                    if (!v) return
                    if (v === '__new_category') {
                      setNewCatMode(true)
                      setNewCatError('')
                    } else {
                      setCategory(v)
                      setValue('category', v)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownCategories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                    <SelectItem value="__new_category" className="text-primary font-medium">
                      + Cadastrar nova categoria
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              {errors.category && !category && !newCatMode && (
                <p className="text-sm text-red-500">Categoria obrigatória</p>
              )}
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
