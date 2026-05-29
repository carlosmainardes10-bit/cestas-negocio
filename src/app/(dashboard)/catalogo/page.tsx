'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BookImage, Share2, Eye, EyeOff, Plus, Trash2, Camera, X, ImagePlus, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

interface CatalogItem {
  id: string
  basket_id: string
  name: string
  category: string
  price: number
  description: string
  visible: boolean
  images: string[]
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

export default function CatalogoPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sharingWhatsapp, setSharingWhatsapp] = useState<string | null>(null)
  const [photoItem, setPhotoItem] = useState<CatalogItem | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => { loadItems() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadItems() {
    try {
      const supabase = createClient()
      const [{ data, error }, { data: authData }] = await Promise.all([
        supabase
          .from('catalog_items')
          .select('id, basket_id, description, visible, images, baskets(name, category, sale_price)')
          .order('created_at', { ascending: false }),
        supabase.auth.getUser(),
      ])

      if (authData.user) setUserId(authData.user.id)

      if (error) {
        console.error('catalog query error:', error)
      } else if (data) {
        setItems(
          data
            .filter((item) => item.baskets != null)
            .map((item) => {
              const basket = item.baskets as { name: string; category: string; sale_price: number }
              return {
                id: item.id,
                basket_id: item.basket_id,
                name: basket.name,
                category: basket.category,
                price: basket.sale_price,
                description: item.description,
                visible: item.visible,
                images: (item.images as string[]) ?? [],
              }
            })
        )
      }
    } catch (err) {
      console.error('loadItems failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleVisibility(id: string, visible: boolean) {
    const supabase = createClient()
    const { error } = await supabase.from('catalog_items').update({ visible: !visible }).eq('id', id)
    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, visible: !visible } : i))
  }

  async function deleteItem(catalogId: string, basketId: string) {
    setDeleting(catalogId)
    const supabase = createClient()
    const { error } = await supabase.from('baskets').delete().eq('id', basketId)
    if (error) {
      toast.error('Erro ao apagar cesta')
    } else {
      setItems(prev => prev.filter(i => i.id !== catalogId))
      toast.success('Cesta apagada')
    }
    setDeleting(null)
  }

  function copyLink() {
    if (!userId) return
    navigator.clipboard.writeText(`${window.location.origin}/p/${userId}`)
    toast.success('Link copiado! Compartilhe com seus clientes.')
  }

  async function shareBasketOnWhatsapp(item: CatalogItem) {
    setSharingWhatsapp(item.id)
    const supabase = createClient()
    const { data: rawItems } = await supabase
      .from('basket_items')
      .select('quantity, products(name)')
      .eq('basket_id', item.basket_id)

    type ItemRow = { quantity: number; products: { name: string } | null }
    const basketItems = (rawItems ?? []) as ItemRow[]

    const price = formatCurrency(item.price)
    let message = `🧺 ${item.name} — ${price}\n`

    const productLines = basketItems
      .filter(bi => bi.products)
      .map(bi => `- ${bi.products!.name}`)

    if (productLines.length > 0) {
      message += `\nProdutos:\n${productLines.join('\n')}\n`
    }

    message += `\nPeça já pelo WhatsApp!`

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    setSharingWhatsapp(null)
  }

  async function uploadPhoto(file: File) {
    if (!photoItem) return
    if (photoItem.images.length >= 3) { toast.error('Máximo de 3 fotos por cesta'); return }

    setUploadingPhoto(true)

    const form = new FormData()
    form.append('file', file)
    form.append('item_id', photoItem.id)

    const res = await fetch('/api/catalog/photo', { method: 'POST', body: form })
    const json = await res.json()

    if (!res.ok) {
      toast.error('Erro ao subir foto')
      setUploadingPhoto(false)
      return
    }

    const newImages = [...photoItem.images, json.url]
    const supabase = createClient()
    const { error } = await supabase.from('catalog_items').update({ images: newImages }).eq('id', photoItem.id)

    if (error) {
      toast.error('Erro ao salvar foto')
      setUploadingPhoto(false)
      return
    }

    const updatedItem = { ...photoItem, images: newImages }
    setItems(prev => prev.map(i => i.id === photoItem.id ? updatedItem : i))
    setPhotoItem(updatedItem)
    toast.success('Foto adicionada!')
    setUploadingPhoto(false)
  }

  async function removePhoto(photoUrl: string) {
    if (!photoItem) return

    setUploadingPhoto(true)

    const pathMatch = photoUrl.match(/\/storage\/v1\/object\/public\/catalog-images\/(.+)/)
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1])
      await fetch('/api/catalog/photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: storagePath }),
      })
    }

    const newImages = photoItem.images.filter(img => img !== photoUrl)
    const supabase = createClient()
    const { error } = await supabase.from('catalog_items').update({ images: newImages }).eq('id', photoItem.id)

    if (error) {
      toast.error('Erro ao remover foto')
      setUploadingPhoto(false)
      return
    }

    const updatedItem = { ...photoItem, images: newImages }
    setItems(prev => prev.map(i => i.id === photoItem.id ? updatedItem : i))
    setPhotoItem(updatedItem)
    toast.success('Foto removida')
    setUploadingPhoto(false)
  }

  const visibleCount = items.filter(i => i.visible).length

  if (loading) return <p className="text-muted-foreground text-sm p-8">Carregando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Catálogo Digital</h1>
          <p className="text-muted-foreground">Gerencie e compartilhe suas cestas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyLink} disabled={!userId}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar Link
          </Button>
          <Button onClick={() => {
            toast.info('Monte sua cesta pela Calculadora — ela calcula o lucro e já adiciona ao catálogo.')
            router.push('/calculadora')
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Cesta
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookImage className="h-14 w-14 text-amber-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Seu catálogo está vazio</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Crie sua primeira cesta na Calculadora — ela calcula o lucro e já adiciona aqui automaticamente.
          </p>
          <Button onClick={() => router.push('/calculadora')} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            Criar minha primeira cesta
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="outline">{visibleCount} cestas visíveis no catálogo</Badge>
            <span className="text-sm text-muted-foreground">• {items.length - visibleCount} ocultas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className={`overflow-hidden ${!item.visible ? 'opacity-60' : ''}`}>
                <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
                  {item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookImage className="h-12 w-12 text-amber-400" />
                    </div>
                  )}
                  <button
                    onClick={() => setPhotoItem(item)}
                    className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-sm transition-colors"
                    title="Gerenciar fotos"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  {item.images.length > 1 && (
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.images.length} fotos
                    </span>
                  )}
                </div>

                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.description || 'Sem descrição'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-700">{formatCurrency(item.price)}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(item.id, item.visible)}
                        className="text-muted-foreground"
                      >
                        {item.visible
                          ? <><Eye className="h-4 w-4 mr-1" />Visível</>
                          : <><EyeOff className="h-4 w-4 mr-1" />Oculto</>}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => shareBasketOnWhatsapp(item)}
                        disabled={sharingWhatsapp === item.id}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Compartilhar no WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>

                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" />
                        }>
                          <Trash2 className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent showCloseButton={false}>
                          <DialogHeader>
                            <DialogTitle>Apagar cesta</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja apagar <strong>{item.name}</strong>? Essa ação não pode ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose render={<Button variant="outline" />}>
                              Cancelar
                            </DialogClose>
                            <DialogClose render={
                              <Button
                                variant="destructive"
                                disabled={deleting === item.id}
                                onClick={() => deleteItem(item.id, item.basket_id)}
                              />
                            }>
                              {deleting === item.id ? 'Apagando...' : 'Apagar'}
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Photo management ──────────────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadPhoto(file)
          e.target.value = ''
        }}
      />

      <Dialog open={!!photoItem} onOpenChange={(open) => !open && setPhotoItem(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Fotos — {photoItem?.name}</DialogTitle>
            <DialogDescription>
              Até 3 fotos por cesta. A primeira aparece como capa no catálogo público.
            </DialogDescription>
          </DialogHeader>

          {photoItem && (
            <div className="space-y-4">
              {photoItem.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photoItem.images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(url)}
                        disabled={uploadingPhoto}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                          capa
                        </span>
                      )}
                    </div>
                  ))}
                  {photoItem.images.length < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-colors disabled:opacity-50"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">Adicionar</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl border-gray-200 gap-3">
                  <BookImage className="h-10 w-10 text-gray-300" />
                  <p className="text-sm text-muted-foreground">Nenhuma foto ainda</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Adicionar foto
                  </Button>
                </div>
              )}

              {uploadingPhoto && (
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                  Processando foto...
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
