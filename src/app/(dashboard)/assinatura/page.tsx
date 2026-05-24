'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Crown, Check, Zap, Clock, Mail } from 'lucide-react'

type Profile = {
  plan: 'basic' | 'premium'
  stripe_subscription_id: string | null
  created_at: string
}

const TRIAL_DAYS = 7

function trialDaysLeft(createdAt: string): number {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const daysUsed = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  return Math.max(0, TRIAL_DAYS - daysUsed)
}

function canUsePremium(profile: Profile): boolean {
  if (profile.plan === 'premium' && profile.stripe_subscription_id) return true
  if (!profile.stripe_subscription_id) {
    const diffMs = Date.now() - new Date(profile.created_at).getTime()
    return diffMs < TRIAL_DAYS * 24 * 60 * 60 * 1000
  }
  return false
}

export default function AssinaturaPage() {
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<'basic' | 'premium' | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (searchParams.get('success') === '1') toast.success('Assinatura confirmada! Bem-vinda ao Premium 🎉')
    if (searchParams.get('canceled') === '1') toast.info('Assinatura cancelada. Você pode tentar novamente.')
  }, [searchParams])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserEmail(user.email ?? '')
      supabase
        .from('users')
        .select('plan, stripe_subscription_id, created_at')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data as Profile))
    })
  }, [])

  // Listen for email confirmation and auto-proceed to checkout
  useEffect(() => {
    if (!pendingPlan) return
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && session?.user.email_confirmed_at) {
        subscription.unsubscribe()
        setPendingPlan(null)
        startCheckout(pendingPlan)
      }
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlan])

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  async function startCheckout(plan: 'basic' | 'premium') {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar checkout')
      setLoading(false)
    }
  }

  async function handleCheckout(plan: 'basic' | 'premium') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (!user.email_confirmed_at) {
      setPendingPlan(plan)
      return
    }

    await startCheckout(plan)
  }

  async function handleResend() {
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email: userEmail })
    if (error) {
      toast.error('Erro ao reenviar e-mail')
      return
    }
    toast.success('E-mail de confirmação reenviado!')
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
  }

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir portal')
      setLoading(false)
    }
  }

  const isPremiumActive = profile?.plan === 'premium' && !!profile.stripe_subscription_id
  const isBasicActive = profile?.plan === 'basic' && !!profile.stripe_subscription_id
  const isTrialing = profile && !profile.stripe_subscription_id
  const daysLeft = profile ? trialDaysLeft(profile.created_at) : 0
  const trialStillActive = isTrialing && daysLeft > 0

  if (pendingPlan) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <Card className="p-8 flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <Mail className="h-7 w-7 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Confirme seu e-mail</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enviamos um link de confirmação para <strong>{userEmail}</strong>.
              Clique no link e você será redirecionada automaticamente para o checkout.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2">
            <Button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              variant="outline"
              className="w-full"
            >
              {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar e-mail'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setPendingPlan(null)}
            >
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu plano e pagamento.</p>
      </div>

      {/* Status banner */}
      {trialStillActive && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Período de teste:</strong> você tem {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''} para experimentar todos os recursos Premium gratuitamente.
          </p>
        </div>
      )}

      {isTrialing && !trialStillActive && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Zap className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">
            <strong>Período de teste encerrado.</strong> Assine um plano para continuar usando os recursos.
          </p>
        </div>
      )}

      {isPremiumActive && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <Crown className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            <strong>Plano Premium ativo.</strong> Você tem acesso a todos os recursos.
          </p>
        </div>
      )}

      {isBasicActive && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Check className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>Plano Básico ativo.</strong> Faça upgrade para desbloquear recursos Premium.
          </p>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-lg">{PLANS.basic.name}</h2>
              <p className="text-2xl font-bold mt-1">
                R$ {(PLANS.basic.price / 100).toFixed(0).replace('.', ',')}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>
            {isBasicActive && <Badge variant="secondary">Plano atual</Badge>}
          </div>

          <ul className="space-y-2 flex-1">
            {PLANS.basic.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {!isBasicActive && !isPremiumActive && (
            <Button
              variant="outline"
              onClick={() => handleCheckout('basic')}
              disabled={loading}
              className="w-full"
            >
              {trialStillActive ? 'Assinar Básico (7 dias grátis)' : 'Assinar Básico'}
            </Button>
          )}
          {isBasicActive && (
            <Button variant="outline" onClick={handlePortal} disabled={loading} className="w-full">
              Gerenciar assinatura
            </Button>
          )}
        </Card>

        {/* Premium */}
        <Card className="p-6 flex flex-col gap-4 border-amber-300 bg-amber-50/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">{PLANS.premium.name}</h2>
                <Crown className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold mt-1">
                R$ {(PLANS.premium.price / 100).toFixed(0).replace('.', ',')}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>
            {isPremiumActive && <Badge className="bg-amber-600">Plano atual</Badge>}
          </div>

          <ul className="space-y-2 flex-1">
            {PLANS.premium.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-amber-600 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {!isPremiumActive && (
            <Button
              onClick={() => handleCheckout('premium')}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {trialStillActive ? 'Assinar Premium (7 dias grátis)' : 'Assinar Premium'}
            </Button>
          )}
          {isPremiumActive && (
            <Button variant="outline" onClick={handlePortal} disabled={loading} className="w-full">
              Gerenciar assinatura
            </Button>
          )}
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Pagamento seguro via Stripe. Cancele a qualquer momento.
      </p>
    </div>
  )
}
