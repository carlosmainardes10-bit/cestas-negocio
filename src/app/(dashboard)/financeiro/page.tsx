'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp, TrendingDown, Plus, ChevronLeft, ChevronRight, Trash2, Percent } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

const schema = z.object({
  type: z.enum(['in', 'out']),
  amount: z.number().min(0.01, 'Valor obrigatório'),
  description: z.string().min(1, 'Descrição obrigatória'),
  date: z.string().min(1, 'Data obrigatória'),
})

type FormData = z.infer<typeof schema>

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function monthLabel(year: number, month: number) {
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectValue, setSelectValue] = useState<'in' | 'out'>('in')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const now = new Date()
  const [viewDate, setViewDate] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'in', date: new Date().toISOString().split('T')[0] },
  })

  async function loadTransactions(year: number, month: number) {
    setLoading(true)
    const supabase = createClient()
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) toast.error('Erro ao carregar lançamentos')
    else setTransactions(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadTransactions(viewDate.year, viewDate.month)
  }, [viewDate])

  function prevMonth() {
    setViewDate(prev =>
      prev.month === 1 ? { year: prev.year - 1, month: 12 } : { ...prev, month: prev.month - 1 }
    )
  }

  function nextMonth() {
    const isCurrentMonth = viewDate.year === now.getFullYear() && viewDate.month === now.getMonth() + 1
    if (isCurrentMonth) return
    setViewDate(prev =>
      prev.month === 12 ? { year: prev.year + 1, month: 1 } : { ...prev, month: prev.month + 1 }
    )
  }

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
    })

    if (error) { toast.error('Erro ao salvar lançamento'); return }

    toast.success('Lançamento adicionado!')
    reset({ type: 'in', date: new Date().toISOString().split('T')[0] })
    setSelectValue('in')
    setOpen(false)
    loadTransactions(viewDate.year, viewDate.month)
  }

  async function deleteTransaction(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir lançamento')
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Lançamento excluído')
    }
    setDeletingId(null)
  }

  const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const profit = totalIn - totalOut
  const rentabilidade = totalIn > 0 ? (profit / totalIn) * 100 : 0
  const isCurrentMonth = viewDate.year === now.getFullYear() && viewDate.month === now.getMonth() + 1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Controle Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe entradas, saídas e lucro</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />Novo Lançamento
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={selectValue} onValueChange={(v) => { if (v) { setSelectValue(v as 'in' | 'out'); setValue('type', v as 'in' | 'out') } }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada (venda)</SelectItem>
                    <SelectItem value="out">Saída (custo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Input placeholder="Ex: Cesta Romântica" {...register('description')} />
                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" placeholder="0,00" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" {...register('date')} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-base font-semibold w-44 text-center">
          {monthLabel(viewDate.year, viewDate.month)}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth} disabled={isCurrentMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Entradas</span>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIn)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Saídas</span>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOut)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Lucro Líquido</span>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
                {formatCurrency(profit)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-violet-700 mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-sm font-medium">Rentabilidade</span>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className={`text-2xl font-bold ${rentabilidade >= 0 ? 'text-violet-700' : 'text-red-700'}`}>
                {rentabilidade.toFixed(1).replace('.', ',')}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Lançamentos</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lançamento em {monthLabel(viewDate.year, viewDate.month).toLowerCase()}.
            </p>
          ) : (
            <div className="space-y-1">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant={t.type === 'in' ? 'default' : 'destructive'} className="text-xs shrink-0">
                      {t.type === 'in' ? 'Entrada' : 'Saída'}
                    </Badge>
                    <span className="text-sm truncate">{t.description}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`font-medium text-sm ${t.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'in' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <Dialog>
                      <DialogTrigger render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" />
                      }>
                        <Trash2 className="h-3.5 w-3.5" />
                      </DialogTrigger>
                      <DialogContent showCloseButton={false}>
                        <DialogHeader>
                          <DialogTitle>Excluir lançamento</DialogTitle>
                          <DialogDescription>
                            Tem certeza que deseja excluir <strong>{t.description}</strong> ({formatCurrency(t.amount)})?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                          <DialogClose render={
                            <Button
                              variant="destructive"
                              disabled={deletingId === t.id}
                              onClick={() => deleteTransaction(t.id)}
                            />
                          }>
                            {deletingId === t.id ? 'Excluindo...' : 'Excluir'}
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
