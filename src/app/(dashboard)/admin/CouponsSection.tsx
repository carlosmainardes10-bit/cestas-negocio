'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Copy, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Tag } from 'lucide-react'

interface CouponUsage {
  user_email: string
  redeemed_at: string
}

interface Coupon {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  applicable_plans: string[]
  max_redemptions: number | null
  redeem_by: string | null
  active: boolean
  created_at: string
  coupon_usages: CouponUsage[]
}

export default function CouponsSection() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [applicablePlans, setApplicablePlans] = useState('both')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [redeemBy, setRedeemBy] = useState('')

  useEffect(() => { loadCoupons(true) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCoupons(seedIfEmpty?: boolean) {
    setLoading(true)
    const res = await fetch('/api/admin/coupons')
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    const list: Coupon[] = data.coupons ?? []
    setCoupons(list)
    setLoading(false)

    if (seedIfEmpty && !list.find(c => c.code === 'WINES100')) {
      const seedRes = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'WINES100',
          discount_type: 'percent',
          discount_value: 100,
          applicable_plans: ['basic', 'premium'],
          max_redemptions: null,
          redeem_by: null,
        }),
      })
      if (seedRes.ok) {
        const fresh = await fetch('/api/admin/coupons')
        if (fresh.ok) setCoupons((await fresh.json()).coupons ?? [])
      }
    }
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (!code || !discountValue) { toast.error('Preencha código e valor do desconto'); return }
    setCreating(true)

    const plans = applicablePlans === 'basic' ? ['basic'] : applicablePlans === 'premium' ? ['premium'] : ['basic', 'premium']
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        applicable_plans: plans,
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        redeem_by: redeemBy || null,
      }),
    })

    if (res.ok) {
      toast.success('Cupom criado!')
      setShowForm(false)
      setCode(''); setDiscountValue(''); setMaxRedemptions(''); setRedeemBy('')
      await loadCoupons()
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Erro ao criar cupom')
    }
    setCreating(false)
  }

  async function toggleActive(coupon: Coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    })
    if (res.ok) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c))
      toast.success(coupon.active ? 'Cupom desativado' : 'Cupom ativado')
    } else {
      toast.error('Erro ao atualizar cupom')
    }
  }

  function copyCode(c: string) {
    navigator.clipboard.writeText(c).then(() => toast.success('Código copiado!'))
  }

  function formatDiscount(c: Coupon) {
    return c.discount_type === 'percent' ? `${c.discount_value}% off` : `R$ ${c.discount_value.toFixed(2)} off`
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-amber-600" />
          <h2 className="font-semibold text-sm">Cupons de Desconto</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Novo cupom
        </Button>
      </div>

      {showForm && (
        <form onSubmit={createCoupon} className="p-4 border-b bg-gray-50/50 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Código *</Label>
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: DESCONTO50"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo de desconto *</Label>
            <Select value={discountType} onValueChange={(v: 'percent' | 'fixed') => { if (v) setDiscountType(v) }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valor *</Label>
            <Input
              type="number" step="0.01"
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percent' ? '100' : '29.00'}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Plano aplicável</Label>
            <Select value={applicablePlans} onValueChange={v => { if (v) setApplicablePlans(v) }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Ambos</SelectItem>
                <SelectItem value="basic">Somente Básico</SelectItem>
                <SelectItem value="premium">Somente Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Limite de usos <span className="text-muted-foreground">(opcional)</span></Label>
            <Input type="number" value={maxRedemptions} onChange={e => setMaxRedemptions(e.target.value)} placeholder="Ilimitado" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Validade <span className="text-muted-foreground">(opcional)</span></Label>
            <Input type="date" value={redeemBy} onChange={e => setRedeemBy(e.target.value)} />
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={creating}>{creating ? 'Criando...' : 'Criar cupom'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Carregando cupons...</p>
      ) : coupons.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/70 text-left">
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Código</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Desconto</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Plano</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Usos</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Validade</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs">Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.flatMap(coupon => {
                const rows = [(
                  <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <code className="font-mono font-semibold text-amber-700 text-xs">{coupon.code}</code>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatDiscount(coupon)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {coupon.applicable_plans.includes('basic') && coupon.applicable_plans.includes('premium')
                        ? 'Ambos' : coupon.applicable_plans.join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedCoupon(expandedCoupon === coupon.id ? null : coupon.id)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-gray-900 transition-colors text-xs"
                      >
                        {coupon.coupon_usages.length}{coupon.max_redemptions ? `/${coupon.max_redemptions}` : ''}
                        {coupon.coupon_usages.length > 0 && (
                          expandedCoupon === coupon.id
                            ? <ChevronUp className="h-3 w-3" />
                            : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {coupon.redeem_by ? formatDate(coupon.redeem_by) : 'Sem prazo'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={coupon.active ? 'default' : 'outline'} className="text-xs">
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-gray-900 transition-colors"
                          title="Copiar código"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActive(coupon)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title={coupon.active ? 'Desativar' : 'Ativar'}
                        >
                          {coupon.active
                            ? <ToggleRight className="h-3.5 w-3.5 text-green-600" />
                            : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                )]
                if (expandedCoupon === coupon.id && coupon.coupon_usages.length > 0) {
                  rows.push(
                    <tr key={`${coupon.id}-usages`} className="bg-amber-50/50 border-b">
                      <td colSpan={7} className="px-8 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Histórico de uso:</p>
                        <div className="space-y-0.5">
                          {coupon.coupon_usages.map((u, i) => (
                            <p key={i} className="text-xs text-gray-700">
                              <span className="font-medium">{u.user_email}</span>
                              <span className="text-muted-foreground ml-2">— {formatDate(u.redeemed_at)}</span>
                            </p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                }
                return rows
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
