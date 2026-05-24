'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Users, Plus, Phone, ChevronDown, ChevronUp,
  ShoppingBag, Bell, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/types/database'

type Customer = Database['public']['Tables']['customers']['Row']
type Order = Pick<
  Database['public']['Tables']['orders']['Row'],
  'id' | 'basket_name' | 'delivery_date' | 'total_amount' | 'delivered'
>
type CustomerWithOrders = Customer & { orders: Order[] }

const REORDER_OPTIONS = [30, 60, 90, 180, 360] as const

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').or(z.literal('')),
  birth_date: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function lastOrderDate(orders: Order[]): string | null {
  if (orders.length === 0) return null
  return orders.reduce((latest, o) =>
    o.delivery_date > latest ? o.delivery_date : latest,
    orders[0].delivery_date
  )
}

function totalSpent(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.total_amount, 0)
}

function reorderAlert(customer: CustomerWithOrders, threshold: number): { label: string; color: string } | null {
  const last = lastOrderDate(customer.orders)
  if (!last) return null
  const days = daysSince(last)
  if (days < threshold) return null
  const color = days >= threshold * 2 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
  return { label: `${days} dias sem comprar`, color }
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reorderDays, setReorderDays] = useState(90)
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', birth_date: '' },
  })

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select(`*, orders(id, basket_name, delivery_date, total_amount, delivered)`)
      .order('name') as { data: CustomerWithOrders[] | null; error: unknown }

    if (error) {
      toast.error('Erro ao carregar clientes')
    } else {
      const sorted = (data ?? []).map((c) => ({
        ...c,
        orders: [...c.orders].sort((a, b) =>
          new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime()
        ),
      }))
      setCustomers(sorted)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  async function onSubmit(data: FormData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('customers').insert({
      user_id: user.id,
      name: data.name,
      phone: data.phone,
      email: data.email ?? '',
      birth_date: data.birth_date || null,
    })
    if (error) { toast.error('Erro ao cadastrar cliente'); return }
    toast.success('Cliente cadastrado!')
    reset(); setOpen(false); loadCustomers()
  }

  function openWhatsapp(phone: string, name: string, isReorder: boolean) {
    const number = phone.replace(/\D/g, '')
    const msg = isReorder
      ? `Oi, ${name}! Faz um tempinho que não te vejo por aqui 🥰 Tenho novidades nas cestas e adoraria te surpreender novamente! Me conta o que você precisa 💛`
      : `Olá, ${name}! 🧺 Temos novidades no nosso catálogo de cestas. Quer conferir?`
    window.open(`https://wa.me/55${number}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const needsContact = customers
    .filter((c) => reorderAlert(c, reorderDays) !== null)
    .sort((a, b) => {
      const la = lastOrderDate(a.orders)!
      const lb = lastOrderDate(b.orders)!
      return new Date(la).getTime() - new Date(lb).getTime()
    })

  const totalPedidos = customers.reduce((s, c) => s + c.orders.length, 0)
  const totalFaturado = customers.reduce((s, c) => s + totalSpent(c.orders), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Clientes</h1>
          <p className="text-muted-foreground">Cadastre, acompanhe e fidelize sua base</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />Novo Cliente
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input placeholder="Nome completo" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>WhatsApp</Label>
                <Input placeholder="(11) 99999-0000" {...register('phone')} />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>E-mail (opcional)</Label>
                <Input type="email" placeholder="cliente@email.com" {...register('email')} />
              </div>
              <div className="space-y-1">
                <Label>Data de nascimento (opcional)</Label>
                <Input type="date" {...register('birth_date')} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-amber-700" />
              <p className="text-xs text-amber-700 font-medium">Clientes</p>
            </div>
            {loading ? <Skeleton className="h-6 w-12" /> : (
              <p className="text-2xl font-bold text-amber-900">{customers.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Pedidos</p>
            </div>
            {loading ? <Skeleton className="h-6 w-12" /> : (
              <p className="text-2xl font-bold">{totalPedidos}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Faturado</p>
            </div>
            {loading ? <Skeleton className="h-6 w-16" /> : (
              <p className="text-2xl font-bold">
                R${totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reorder alerts */}
      {!loading && (
        <Card className="mb-6 border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                <Bell className="h-4 w-4" />
                {needsContact.length > 0
                  ? `${needsContact.length} cliente${needsContact.length > 1 ? 's' : ''} para contatar`
                  : 'Nenhum cliente para contatar agora'}
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">Sem comprar há mais de</span>
                <select
                  value={reorderDays}
                  onChange={(e) => setReorderDays(Number(e.target.value))}
                  className="rounded-md border border-input bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {REORDER_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 360 ? '1 ano' : `${d} dias`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          {needsContact.length > 0 && (
            <CardContent className="pt-0 space-y-2">
              {needsContact.map((c) => {
                const alert = reorderAlert(c, reorderDays)!
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                          {initials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <Badge className={`text-xs px-1.5 py-0 border-0 ${alert.color}`}>
                          {alert.label}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50 h-7 text-xs gap-1"
                      onClick={() => openWhatsapp(c.phone, c.name, true)}
                    >
                      <Phone className="h-3 w-3" />
                      Recontatar
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          )}
        </Card>
      )}

      {/* Full list */}
      <Card>
        <CardHeader><CardTitle className="text-base">Todos os clientes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum cliente ainda. Cadastre sua primeira cliente!
            </p>
          ) : (
            <div className="divide-y">
              {customers.map((customer) => {
                const alert = reorderAlert(customer, reorderDays)
                const last = lastOrderDate(customer.orders)
                const spent = totalSpent(customer.orders)
                const isOpen = expanded === customer.id

                return (
                  <div key={customer.id}>
                    <button
                      className="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-gray-50 rounded-md px-1 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : customer.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                            {initials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{customer.name}</p>
                            {alert && (
                              <Badge className={`text-xs px-1.5 py-0 border-0 ${alert.color}`}>
                                {alert.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {customer.orders.length === 0
                              ? 'Sem pedidos ainda'
                              : `${customer.orders.length} pedido${customer.orders.length > 1 ? 's' : ''} · R$${spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · último em ${new Date(last! + 'T12:00:00').toLocaleDateString('pt-BR')}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50 h-7 text-xs gap-1"
                          onClick={(e) => { e.stopPropagation(); openWhatsapp(customer.phone, customer.name, !!alert) }}
                        >
                          <Phone className="h-3 w-3" />
                          WA
                        </Button>
                        {isOpen
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </button>

                    {isOpen && (
                      <div className="pb-3 px-1 ml-12">
                        {customer.orders.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            Esta cliente ainda não tem pedidos vinculados.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {customer.orders.map((order) => (
                              <div key={order.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                                <div>
                                  <p className="font-medium">{order.basket_name ?? 'Cesta'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(order.delivery_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                                      day: '2-digit', month: 'short', year: 'numeric',
                                    })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    R${order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <Badge variant={order.delivered ? 'secondary' : 'outline'} className="text-xs">
                                    {order.delivered ? 'Entregue' : 'Pendente'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
