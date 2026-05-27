'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, MapPin, MessageSquare, CalendarPlus, Phone, Pencil,
  CheckCircle2, ChevronDown, ChevronUp, ShoppingCart, RotateCcw, UserPlus, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

type BasketOption = {
  id: string
  name: string
  category: string
  sale_price: number
}

type OrderWithCustomer = {
  id: string
  user_id: string
  customer_id: string | null
  recipient_name: string
  basket_name: string | null
  purchase_date: string
  delivery_date: string
  delivery_time: string | null
  delivery_address: string
  card_message: string | null
  total_amount: number
  cost: number
  delivered: boolean
  delivered_at: string | null
  notes: string | null
  created_at: string
  customer: { name: string; phone: string } | null
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const orderSchema = z.object({
  recipient_name: z.string().min(1, 'Nome do destinatário obrigatório'),
  basket_name: z.string().optional(),
  purchase_date: z.string().min(1, 'Data obrigatória'),
  delivery_date: z.string().min(1, 'Data de entrega obrigatória'),
  delivery_time: z.string().optional(),
  delivery_address: z.string().min(1, 'Endereço obrigatório'),
  total_amount: z.number().min(0.01, 'Valor obrigatório'),
  cost: z.number().min(0),
  card_message: z.string().optional(),
  notes: z.string().optional(),
})

const customerSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').or(z.literal('')),
})

type OrderFormData = z.infer<typeof orderSchema>
type CustomerFormData = z.infer<typeof customerSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function deliveryUrgency(deliveryDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const delivery = new Date(deliveryDate + 'T00:00:00')
  const diff = Math.round((delivery.getTime() - today.getTime()) / 86_400_000)

  if (diff < 0) return { label: `${Math.abs(diff)}d de atraso`, cls: 'bg-red-100 text-red-700 border-red-200' }
  if (diff === 0) return { label: 'Hoje!', cls: 'bg-amber-100 text-amber-800 border-amber-200' }
  if (diff === 1) return { label: 'Amanhã', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: formatDate(deliveryDate), cls: 'bg-gray-100 text-gray-600 border-gray-200' }
}

function googleCalendarUrl(order: OrderWithCustomer) {
  const d = order.delivery_date.replace(/-/g, '')
  const next = new Date(order.delivery_date + 'T00:00:00')
  next.setDate(next.getDate() + 1)
  const nextD = next.toISOString().split('T')[0].replace(/-/g, '')
  const details = [
    order.customer?.name ? `Cliente: ${order.customer.name}` : '',
    order.customer?.phone ? `Celular: ${order.customer.phone}` : '',
    order.basket_name ? `Cesta: ${order.basket_name}` : '',
    order.delivery_time ? `Horário: ${order.delivery_time}` : '',
    `Valor: ${formatCurrency(order.total_amount)}`,
    order.card_message ? `Cartão: "${order.card_message}"` : '',
    order.notes ? `Obs: ${order.notes}` : '',
  ].filter(Boolean).join('\n')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🧺 Entrega ${order.recipient_name}`,
    dates: `${d}/${nextD}`,
    details,
    location: order.delivery_address,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function whatsappUrl(phone: string, order: OrderWithCustomer) {
  const number = phone.replace(/\D/g, '')
  const timeStr = order.delivery_time ? ` às ${order.delivery_time}` : ''
  const msg = `Olá! Confirmo a entrega da sua cesta para ${order.recipient_name} no dia ${formatDate(order.delivery_date)}${timeStr} no endereço: ${order.delivery_address} 🧺`
  return `https://wa.me/55${number}?text=${encodeURIComponent(msg)}`
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function PendingCard({ order, onEdit, onMarkDelivered }: {
  order: OrderWithCustomer
  onEdit: (o: OrderWithCustomer) => void
  onMarkDelivered: (id: string) => void
}) {
  const { label, cls } = deliveryUrgency(order.delivery_date)
  return (
    <div className="border rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="flex flex-col gap-0.5 shrink-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
              {label}
            </span>
            {order.delivery_time && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-1">
                <Clock className="h-3 w-3" />{order.delivery_time}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">{order.recipient_name}</p>
            {order.basket_name && (
              <p className="text-xs text-amber-700">{order.basket_name}</p>
            )}
            {order.customer && (
              <p className="text-xs text-muted-foreground">Comprado por {order.customer.name}</p>
            )}
          </div>
        </div>
        <span className="text-sm font-bold text-amber-700 shrink-0">
          {formatCurrency(order.total_amount)}
        </span>
      </div>

      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
        <span className="line-clamp-2">{order.delivery_address}</span>
      </div>

      {order.card_message && (
        <div className="flex items-start gap-1.5 bg-pink-50 border border-pink-100 rounded-lg px-3 py-2">
          <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-pink-400" />
          <span className="text-xs text-pink-700 italic">"{order.card_message}"</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <Button
          variant="outline" size="sm" className="h-7 text-xs"
          onClick={() => window.open(googleCalendarUrl(order), '_blank')}
        >
          <CalendarPlus className="h-3.5 w-3.5 mr-1" />Agenda
        </Button>
        {order.customer?.phone && (
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
            onClick={() => window.open(whatsappUrl(order.customer!.phone, order), '_blank')}
          >
            <Phone className="h-3.5 w-3.5 mr-1" />WhatsApp
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(order)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Dialog>
          <DialogTrigger render={
            <Button size="sm" className="h-7 text-xs ml-auto bg-green-600 hover:bg-green-700" />
          }>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Entregue
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Confirmar entrega</DialogTitle>
              <DialogDescription>
                Marcar a entrega para <strong>{order.recipient_name}</strong> como concluída?
                O pedido será movido para o histórico.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <DialogClose render={
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => onMarkDelivered(order.id)} />
              }>
                Confirmar entrega
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function HistoryCard({ order, onEdit, onUndeliver }: {
  order: OrderWithCustomer
  onEdit: (o: OrderWithCustomer) => void
  onUndeliver: (id: string) => void
}) {
  return (
    <div className="border rounded-xl p-4 space-y-2 bg-gray-50 opacity-80">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 shrink-0">
            Entregue {order.delivered_at ? formatDate(order.delivered_at) : formatDate(order.delivery_date)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{order.recipient_name}</p>
            {order.basket_name && <p className="text-xs text-amber-700">{order.basket_name}</p>}
            {order.customer && <p className="text-xs text-muted-foreground">{order.customer.name}</p>}
          </div>
        </div>
        <span className="text-sm font-medium text-muted-foreground shrink-0">
          {formatCurrency(order.total_amount)}
        </span>
      </div>
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span className="line-clamp-1">{order.delivery_address}</span>
      </div>
      <div className="flex gap-1.5 pt-0.5">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(order)}>
          <Pencil className="h-3.5 w-3.5 mr-1" />Editar
        </Button>
        <Button
          variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => onUndeliver(order.id)}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />Reabrir
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendasPage() {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [baskets, setBaskets] = useState<BasketOption[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<OrderWithCustomer | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedBasketId, setSelectedBasketId] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const [newCustOpen, setNewCustOpen] = useState(false)
  const [savingCust, setSavingCust] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      recipient_name: '', basket_name: '',
      purchase_date: new Date().toISOString().split('T')[0],
      delivery_date: tomorrow(), delivery_time: '',
      delivery_address: '', total_amount: 0, cost: 0,
      card_message: '', notes: '',
    },
  })

  const {
    register: regCust, handleSubmit: hsCust, reset: resetCust,
    formState: { errors: errCust },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '' },
  })

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const [ordersRes, customersRes, basketsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, customer:customers(name, phone)')
        .order('delivery_date', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
      supabase.from('baskets').select('id, name, category, sale_price').order('name'),
    ])
    setOrders((ordersRes.data ?? []) as OrderWithCustomer[])
    setCustomers((customersRes.data ?? []) as Customer[])
    setBaskets((basketsRes.data ?? []) as BasketOption[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditing(null)
    setSelectedCustomerId('')
    setSelectedBasketId('')
    reset({
      recipient_name: '', basket_name: '',
      purchase_date: new Date().toISOString().split('T')[0],
      delivery_date: tomorrow(), delivery_time: '',
      delivery_address: '', total_amount: 0, cost: 0,
      card_message: '', notes: '',
    })
    setSheetOpen(true)
  }

  function openEdit(order: OrderWithCustomer) {
    setEditing(order)
    setSelectedCustomerId(order.customer_id ?? '')
    const matchedBasket = baskets.find(b => b.name === order.basket_name)
    setSelectedBasketId(matchedBasket?.id ?? '')
    reset({
      recipient_name: order.recipient_name,
      basket_name: order.basket_name ?? '',
      purchase_date: order.purchase_date,
      delivery_date: order.delivery_date,
      delivery_time: order.delivery_time ?? '',
      delivery_address: order.delivery_address,
      total_amount: order.total_amount,
      cost: order.cost ?? 0,
      card_message: order.card_message ?? '',
      notes: order.notes ?? '',
    })
    setSheetOpen(true)
  }

  function handleBasketSelect(basketId: string) {
    setSelectedBasketId(basketId)
    const b = baskets.find(b => b.id === basketId)
    if (b) {
      setValue('basket_name', b.name)
      setValue('total_amount', b.sale_price)
    }
  }

  async function onSubmit(data: OrderFormData) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      customer_id: selectedCustomerId || null,
      recipient_name: data.recipient_name,
      basket_name: data.basket_name || null,
      purchase_date: data.purchase_date,
      delivery_date: data.delivery_date,
      delivery_time: data.delivery_time || null,
      delivery_address: data.delivery_address,
      card_message: data.card_message || null,
      total_amount: data.total_amount,
      cost: data.cost ?? 0,
      notes: data.notes || null,
    }

    if (editing) {
      const { error } = await supabase.from('orders').update(payload).eq('id', editing.id)
      if (error) { toast.error('Erro ao atualizar venda'); setSaving(false); return }

      // Sync revenue transaction
      const oldRevDesc = editing.basket_name
        ? `${editing.basket_name} — ${editing.recipient_name}`
        : `Venda para ${editing.recipient_name}`
      const newRevDesc = data.basket_name
        ? `${data.basket_name} — ${data.recipient_name}`
        : `Venda para ${data.recipient_name}`
      await supabase
        .from('transactions')
        .update({ amount: data.total_amount, description: newRevDesc, date: data.purchase_date })
        .eq('user_id', user.id)
        .eq('type', 'in')
        .eq('description', oldRevDesc)
        .eq('date', editing.purchase_date)

      // Sync cost transaction
      const oldCostDesc = `Custo: ${editing.basket_name || 'cesta'} — ${editing.recipient_name}`
      const newCostDesc = `Custo: ${data.basket_name || 'cesta'} — ${data.recipient_name}`
      const oldCost = editing.cost ?? 0
      const newCost = data.cost ?? 0
      if (oldCost > 0 && newCost > 0) {
        await supabase
          .from('transactions')
          .update({ amount: newCost, description: newCostDesc, date: data.purchase_date })
          .eq('user_id', user.id)
          .eq('type', 'out')
          .eq('description', oldCostDesc)
          .eq('date', editing.purchase_date)
      } else if (oldCost > 0 && newCost === 0) {
        await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'out')
          .eq('description', oldCostDesc)
          .eq('date', editing.purchase_date)
      } else if (oldCost === 0 && newCost > 0) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'out',
          amount: newCost,
          description: newCostDesc,
          date: data.purchase_date,
        })
      }

      toast.success('Venda atualizada')
    } else {
      const { error } = await supabase.from('orders').insert({ ...payload, user_id: user.id })
      if (error) { toast.error('Erro ao salvar venda'); setSaving(false); return }

      const txDescription = data.basket_name
        ? `${data.basket_name} — ${data.recipient_name}`
        : `Venda para ${data.recipient_name}`

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'in',
        amount: data.total_amount,
        description: txDescription,
        date: data.purchase_date,
      })

      if ((data.cost ?? 0) > 0) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'out',
          amount: data.cost,
          description: `Custo: ${data.basket_name || 'cesta'} — ${data.recipient_name}`,
          date: data.purchase_date,
        })
      }

      toast.success('Venda registrada!')
    }

    setSaving(false)
    setSheetOpen(false)
    load()
  }

  async function saveNewCustomer(data: CustomerFormData) {
    setSavingCust(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingCust(false); return }

    const { data: newCust, error } = await supabase
      .from('customers')
      .insert({ user_id: user.id, name: data.name, phone: data.phone, email: data.email || '' })
      .select()
      .single()

    if (error || !newCust) { toast.error('Erro ao cadastrar cliente'); setSavingCust(false); return }

    const c = newCust as Customer
    setCustomers(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
    setSelectedCustomerId(c.id)
    toast.success(`${c.name} cadastrado!`)
    setSavingCust(false)
    setNewCustOpen(false)
    resetCust()
  }

  async function markDelivered(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ delivered: true, delivered_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { toast.error('Erro ao confirmar entrega'); return }
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, delivered: true, delivered_at: new Date().toISOString() } : o
    ))
    toast.success('Entrega confirmada!')
  }

  async function undeliverOrder(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ delivered: false, delivered_at: null })
      .eq('id', id)
    if (error) { toast.error('Erro ao reabrir pedido'); return }
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, delivered: false, delivered_at: null } : o
    ))
    toast.success('Pedido reaberto')
  }

  const basketNameValue = watch('basket_name')

  const pending = orders
    .filter(o => !o.delivered)
    .sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))

  const delivered = orders
    .filter(o => o.delivered)
    .sort((a, b) => (b.delivered_at ?? b.delivery_date).localeCompare(a.delivered_at ?? a.delivery_date))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie pedidos e entregas</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Nova Venda
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground p-8 text-center">Carregando...</div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-base">Aguardando entrega</h2>
              {pending.length > 0 && <Badge variant="secondary">{pending.length}</Badge>}
            </div>
            {pending.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-xl bg-gray-50">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-25" />
                <p>Nenhuma entrega pendente.</p>
                <Button className="mt-4" variant="outline" onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-2" />Registrar venda
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map(order => (
                  <PendingCard key={order.id} order={order} onEdit={openEdit} onMarkDelivered={markDelivered} />
                ))}
              </div>
            )}
          </div>

          {delivered.length > 0 && (
            <div>
              <Separator className="mb-6" />
              <button
                type="button"
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Histórico de entregas ({delivered.length})
              </button>
              {showHistory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {delivered.map(order => (
                    <HistoryCard key={order.id} order={order} onEdit={openEdit} onUndeliver={undeliverOrder} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Order Sheet ───────────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar venda' : 'Nova venda'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-3">

            {/* Customer */}
            <div className="space-y-1">
              <Label>Quem comprou <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCustomerId || 'none'}
                  onValueChange={(v) => setSelectedCustomerId(!v || v === 'none' ? '' : v)}
                >
                  <SelectTrigger className="flex-1">
                    <span className="truncate text-sm">
                      {selectedCustomerId
                        ? (customers.find(c => c.id === selectedCustomerId)?.name ?? 'Selecionar cliente')
                        : 'Selecionar cliente'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente cadastrado</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button" variant="outline" size="icon"
                  title="Cadastrar novo cliente"
                  onClick={() => { resetCust(); setNewCustOpen(true) }}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-1">
              <Label>Para quem é a entrega *</Label>
              <Input placeholder="Nome do destinatário" {...register('recipient_name')} />
              {errors.recipient_name && <p className="text-xs text-red-500">{errors.recipient_name.message}</p>}
            </div>

            {/* Basket type */}
            <div className="space-y-1">
              <Label>Tipo da cesta <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              {baskets.length > 0 ? (
                <Select
                  value={selectedBasketId || 'none'}
                  onValueChange={(v) => {
                    if (v === 'none') {
                      setSelectedBasketId('')
                      setValue('basket_name', '')
                    } else {
                      v && handleBasketSelect(v)
                    }
                  }}
                >
                  <SelectTrigger>
                    <span className="truncate text-sm">
                      {basketNameValue || (selectedBasketId
                        ? (baskets.find(b => b.id === selectedBasketId)?.name ?? 'Selecionar cesta')
                        : 'Selecionar cesta')}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cesta vinculada</SelectItem>
                    {baskets.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} — {formatCurrency(b.sale_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Ex: Cesta Romântica Premium" {...register('basket_name')} />
              )}
              {/* hidden field holds basket_name when using the Select above */}
              {baskets.length > 0 && <input type="hidden" {...register('basket_name')} />}
            </div>

            {/* Dates */}
            <div className="space-y-1">
              <Label>Data da compra</Label>
              <Input type="date" {...register('purchase_date')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data de entrega *</Label>
                <Input type="date" {...register('delivery_date')} />
                {errors.delivery_date && <p className="text-xs text-red-500">{errors.delivery_date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Horário <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                <Input type="time" {...register('delivery_time')} />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <Label>Preço de venda (R$) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00"
                {...register('total_amount', { valueAsNumber: true })} />
              {errors.total_amount && <p className="text-xs text-red-500">{errors.total_amount.message}</p>}
            </div>

            {/* Cost */}
            <div className="space-y-1">
              <Label>Custo da cesta (R$) <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00"
                {...register('cost', { valueAsNumber: true })} />
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-1">
              <Label>Endereço de entrega *</Label>
              <Input placeholder="Rua, número, bairro, cidade" {...register('delivery_address')} />
              {errors.delivery_address && <p className="text-xs text-red-500">{errors.delivery_address.message}</p>}
            </div>

            {/* Card message */}
            <div className="space-y-1">
              <Label>Mensagem do cartão <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <textarea
                {...register('card_message')}
                placeholder="Ex: Com muito amor, feliz aniversário!"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Observações <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input placeholder="Ex: Deixar com o porteiro" {...register('notes')} />
            </div>

            <SheetFooter className="pt-2">
              <SheetClose render={<Button type="button" variant="outline" />}>Cancelar</SheetClose>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Registrar venda'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Inline customer dialog ────────────────────────────────────────────── */}
      <Dialog open={newCustOpen} onOpenChange={setNewCustOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Cadastrar cliente</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.stopPropagation(); hsCust(saveNewCustomer)(e) }}
            className="space-y-4 mt-1"
          >
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Nome completo" {...regCust('name')} />
              {errCust.name && <p className="text-xs text-red-500">{errCust.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>WhatsApp *</Label>
              <Input placeholder="(11) 99999-0000" {...regCust('phone')} />
              {errCust.phone && <p className="text-xs text-red-500">{errCust.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>E-mail <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input type="email" placeholder="cliente@email.com" {...regCust('email')} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setNewCustOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingCust}>
                {savingCust ? 'Cadastrando...' : 'Cadastrar cliente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
