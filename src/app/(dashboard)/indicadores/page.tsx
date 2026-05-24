'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type CatalogRow = {
  id: string
  basket: { name: string; category: string; sale_price: number } | null
}

type Period = 'month' | 'quarter' | 'year'

const PERIOD_LABELS: Record<Period, string> = {
  month: 'Este mês',
  quarter: 'Últimos 3 meses',
  year: 'Este ano',
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

function getStartDate(period: Period): string {
  const now = new Date()
  if (period === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
  if (period === 'quarter') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 2)
    d.setDate(1)
    return d.toISOString().split('T')[0]
  }
  return `${now.getFullYear()}-01-01`
}

function buildChartData(transactions: Transaction[]) {
  const now = new Date()
  const months: Record<string, { mes: string; entradas: number; saidas: number; lucro: number }> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
    months[key] = { mes: label.replace('.', ''), entradas: 0, saidas: 0, lucro: 0 }
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]

  for (const t of transactions) {
    if (t.date < sixMonthsAgo) continue
    const key = t.date.slice(0, 7)
    if (!months[key]) continue
    if (t.type === 'in') months[key].entradas += t.amount
    else months[key].saidas += t.amount
  }

  for (const m of Object.values(months)) {
    m.lucro = m.entradas - m.saidas
  }

  return Object.values(months)
}

export default function IndicadoresPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [orders, setOrders] = useState<{ basket_name: string | null; total_amount: number }[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const [catalogItems, setCatalogItems] = useState<CatalogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const [txResult, custResult, catalogResult, ordersResult] = await Promise.all([
        supabase.from('transactions').select('*').order('date'),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase
          .from('catalog_items')
          .select('id, basket:baskets(name, category, sale_price)')
          .eq('visible', true),
        supabase.from('orders').select('basket_name, total_amount, delivery_date'),
      ])
      setTransactions((txResult.data ?? []) as Transaction[])
      setCustomerCount(custResult.count ?? 0)
      setCatalogItems((catalogResult.data ?? []) as CatalogRow[])
      setOrders((ordersResult.data ?? []) as { basket_name: string | null; total_amount: number; delivery_date: string }[])
      setLoading(false)
    }
    load()
  }, [])

  const startDate = getStartDate(period)
  const filteredTx = transactions.filter(t => t.date >= startDate)

  const totalIn = filteredTx.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const totalOut = filteredTx.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const profit = totalIn - totalOut
  const inCount = filteredTx.filter(t => t.type === 'in').length
  const ticketMedio = inCount > 0 ? totalIn / inCount : 0

  const chartData = buildChartData(transactions)

  // Top baskets filtered by period
  const filteredOrders = (orders as { basket_name: string | null; total_amount: number; delivery_date: string }[])
    .filter((o) => o.delivery_date >= startDate)

  const topBaskets = Object.values(
    filteredOrders.reduce<Record<string, { name: string; count: number; revenue: number }>>((acc, o) => {
      const name = o.basket_name ?? 'Sem nome'
      if (!acc[name]) acc[name] = { name, count: 0, revenue: 0 }
      acc[name].count++
      acc[name].revenue += o.total_amount
      return acc
    }, {})
  ).sort((a, b) => b.count - a.count).slice(0, 7)

  const maxCount = topBaskets[0]?.count ?? 1

  const catalogByCategory = catalogItems.reduce<Record<string, CatalogRow[]>>((acc, item) => {
    const cat = item.basket?.category ?? 'outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Painel de Indicadores</h1>
          <p className="text-muted-foreground">Acompanhe a evolução do seu negócio</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Entradas</span>
                </div>
                <p className="text-xl font-bold text-green-700">{formatCurrency(totalIn)}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 text-red-700 mb-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs font-medium">Saídas</span>
                </div>
                <p className="text-xl font-bold text-red-700">{formatCurrency(totalOut)}</p>
              </CardContent>
            </Card>
            <Card className={`${profit >= 0 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="pt-5">
                <div className={`flex items-center gap-2 mb-1 ${profit >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Lucro Líquido</span>
                </div>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
                  {formatCurrency(profit)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-medium">Ticket Médio</span>
                </div>
                <p className="text-xl font-bold">
                  {inCount > 0 ? formatCurrency(ticketMedio) : '—'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Entradas · Saídas · Lucro — últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => v === 0 ? '0' : `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#f87171" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="lucro" name="Lucro" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top baskets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cestas mais pedidas — {PERIOD_LABELS[period].toLowerCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topBaskets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum pedido no período selecionado.
              </p>
            ) : (
              <div className="space-y-3">
                {topBaskets.map((b, i) => (
                  <div key={b.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium truncate max-w-48">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="text-xs text-muted-foreground">
                          {b.count} pedido{b.count > 1 ? 's' : ''}
                        </span>
                        <span className="font-medium text-amber-700 min-w-20">
                          {formatCurrency(b.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${(b.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Clientes Cadastrados</span>
              </div>
              {loading
                ? <Skeleton className="h-8 w-16" />
                : <p className="text-3xl font-bold">{customerCount}</p>
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cestas no catálogo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : catalogItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma cesta no catálogo.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(catalogByCategory).map(([cat, items]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[cat] ?? cat}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {items.length} {items.length === 1 ? 'cesta' : 'cestas'}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 border-t text-xs text-muted-foreground">
                    {catalogItems.length} no total
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
